import {dealerShouldHit,settleHand,settleInsurance,canSurrender,canSplit,handValue} from './blackjack-rules.js';
// Cloudflare Durable Object: server-authoritative virtual blackjack room.
// Educational play money only. No payments, prizes, or persistent player identities.
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/health')return json({ok:true,service:'blackedge-rooms-v28'});
  const match=url.pathname.match(/^\/api\/rooms\/([a-zA-Z0-9_-]{4,40})\/ws$/);
  if(!match)return new Response('Not found',{status:404});
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket upgrade required',{status:426});
  const id=env.BLACKJACK_ROOMS.idFromName(match[1]);
  return env.BLACKJACK_ROOMS.get(id).fetch(request);
 }
};
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
const symbols=['S','H','D','C'],ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function randomInt(n){const raw=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(raw)}while(raw[0]>=limit);return raw[0]%n}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function score(cards){let total=0,aces=0;for(const c of cards){if(c.r==='A'){total+=11;aces++}else total+=['10','J','Q','K'].includes(c.r)?10:+c.r}while(total>21&&aces){total-=10;aces--}return total}
function count(c){return ['2','3','4','5','6'].includes(c.r)?1:['10','J','Q','K','A'].includes(c.r)?-1:0}
export class BlackjackRoom {
 constructor(state,env){
  this.state=state;this.players=new Map();this.shoe=[];this.dealer=[];this.running=0;this.round=0;this.turn=0;this.phase='lobby';this.settings={decks:6};this.host=null;this.revealed=false;this.sessions=new Map();this.insuranceDecided=new Set();this.messageQueue=Promise.resolve();
  this.state.blockConcurrencyWhile(async()=>{const saved=await this.state.storage.get('roomCheckpoint');if(saved&&saved.v===1){this.shoe=saved.shoe||[];this.players=new Map((saved.seats||[]).map(p=>[p.id,{...p,socket:null}]));this.host=saved.host||null;this.round=saved.round||0;this.running=saved.running||0;this.settings=saved.settings||{decks:6};this.dealer=[];this.phase='lobby';if(saved.phase==='turn'||saved.phase==='insurance'){this.resetShoe();for(const p of this.players.values()){if(p.wager){p.bank+=p.hands?p.hands.reduce((sum,h)=>sum+(h.wager||0),0):p.wager;if(p.insurance)p.bank+=p.insurance}p.insurance=0;p.hands=null;p.wager=0;p.cards=[];p.status='Interrupted'}}this.notice='Room restored from durable checkpoint. Interrupted hands were canceled; reconnect to start a new round.';await this.checkpoint()}});
 }
 async checkpoint(){await this.state.storage.put('roomCheckpoint',{v:1,shoe:this.shoe,round:this.round,running:this.running,settings:this.settings,phase:this.phase,host:this.host,seats:[...this.players.values()].map(({socket,...p})=>p),savedAt:Date.now()})}
 async fetch(request){
  const pair=new WebSocketPair(),client=pair[0],server=pair[1];server.accept();
  const id=crypto.randomUUID(),p={id,token:crypto.randomUUID(),name:'Guest',cards:[],bank:1000,wager:25,status:'Waiting',socket:server};
  // Allow a transient connection to reclaim an existing seat before allocating a new seat.
  this.sessions.set(id,p);
  server.addEventListener('message',event=>{const op=async()=>{try{if(typeof event.data!=='string'||event.data.length>4096)throw Error('Invalid message');const m=JSON.parse(event.data);await this.handle(p,m);await this.checkpoint()}catch(e){this.send(p,{type:'error',message:String(e.message||e)})}};this.messageQueue=this.messageQueue.then(op,op)});
  server.addEventListener('close',()=>{this.messageQueue=this.messageQueue.then(()=>this.leave(p))});server.addEventListener('error',()=>{this.messageQueue=this.messageQueue.then(()=>this.leave(p))});
  this.send(p,{type:'hello',message:'Send resume with token or join as a new player'});
  return new Response(null,{status:101,webSocket:client});
 }
 async handle(connection,m){
  if(!m||typeof m.type!=='string')throw Error('Invalid message');
  if(!connection.seated){
   if(m.type==='resume'){
    const old=[...this.players.values()].find(p=>p.token===m.token);
    if(!old)throw Error('Seat token invalid or expired');
    if(old.socket&&old.socket!==connection.socket){try{old.socket.close(1000,'Seat reclaimed')}catch{}}
    old.socket=connection.socket;connection.seated=old.id;this.send(connection,{type:'welcome',playerId:old.id,token:old.token,reconnected:true});this.broadcast();return;
   }
   if(m.type!=='join')throw Error('Join or resume first');
   if(this.phase==='turn'||this.phase==='insurance')throw Error('Wait until the current round finishes');
   if(this.players.size>=4)throw Error('Room full');
   connection.seated=connection.id;this.players.set(connection.id,connection);if(!this.host||!this.players.get(this.host)?.socket)this.host=connection.id;
   this.send(connection,{type:'welcome',playerId:connection.id,token:connection.token,reconnected:false});this.broadcast();return;
  }
  const seat=this.players.get(connection.seated);
  if(!seat||seat.socket!==connection.socket)throw Error('Seat no longer active');
  if(m.type==='leaveRoom'){
   if(this.phase==='turn'||this.phase==='insurance')throw Error('Leave after the round');
   this.players.delete(seat.id);if(this.host===seat.id)this.host=[...this.players.values()].find(v=>v.socket)?.id||null;
   connection.seated=null;this.send(connection,{type:'left'});this.broadcast();return;
  }
  this.action(seat,m);
 }
 leave(connection){
  this.sessions.delete(connection.id);const p=this.players.get(connection.seated);
  if(!p||p.socket!==connection.socket)return;
  p.socket=null;
  if(this.host===p.id&&(this.phase==='lobby'||this.phase==='complete')){const replacement=[...this.players.values()].find(v=>v.id!==p.id&&v.socket);if(replacement)this.host=replacement.id}
  if(this.phase==='insurance'&&p.wager){
   p.status='Disconnected - standing';
   this.insuranceDecided.add(p.id);
   if([...this.players.values()].filter(v=>v.wager).every(v=>this.insuranceDecided.has(v.id))){
    if(score(this.dealer)===21)this.finish();
    else{this.phase='turn';this.turn=0;this.skip();this.broadcast()}
   }else this.broadcast();
  }else if(this.phase==='turn'&&p.wager){
   const wasCurrent=this.current()?.id===p.id;
   if(p.hands){for(const h of p.hands)if(h.status==='Playing')h.status='Stand';p.activeHand=p.hands.length-1}
   p.status='Disconnected - standing';
   if(wasCurrent)this.advance();else this.broadcast();
  }else this.broadcast();
  this.checkpoint().catch(()=>{});
 }
 send(p,data){try{p.socket?.send(JSON.stringify(data))}catch{}}
 publicState(viewer){const list=[...this.players.values()];return {type:'state',phase:this.phase,round:this.round,hostId:this.host,turnId:this.current()?.id||null,playerId:viewer.seated||viewer.id,shoeRemaining:this.shoe.length,visibleRunningCount:this.running,players:list.map(p=>({id:p.id,name:p.name,cards:p.cards,hands:p.hands||null,activeHand:p.activeHand||0,insurance:p.insurance||0,insuranceDecided:this.insuranceDecided.has(p.id),bank:p.bank,status:p.status,wager:p.wager})),dealer:this.dealer.map((c,i)=>(this.phase==='turn'||this.phase==='insurance')&&i===1?{hidden:true}:c),message:this.notice||'Waiting for players'} }
 broadcast(){for(const p of this.players.values())this.send(p,this.publicState(p))}
 current(){return [...this.players.values()][this.turn]}
 draw(hidden=false){if(!this.shoe.length)throw Error('Shoe depleted');const c=this.shoe.pop();if(!hidden)this.running+=count(c);return c}
 resetShoe(){const arr=[];for(let i=0;i<this.settings.decks;i++)for(const s of symbols)for(const r of ranks)arr.push({r,s});this.shoe=shuffle(arr);this.running=0}
 action(p,m){
  if(!m||typeof m.type!=='string')throw Error('Action missing');
  if(m.type==='name'){if(this.phase!=='lobby'&&this.phase!=='complete')throw Error('Wait for the round');const name=String(m.name||'').trim().slice(0,24);if(!/^[a-zA-Z0-9 _-]{1,24}$/.test(name))throw Error('Name must use letters, numbers, spaces');p.name=name;this.broadcast();return}
  if(m.type==='start'){if(this.host!==p.id)throw Error('Only host can deal');if(this.phase==='turn'||this.phase==='insurance')throw Error('Round underway');if(![...this.players.values()].some(v=>v.socket))throw Error('No connected players');this.startRound();return}
  if(this.phase==='insurance'){
   if(!['insurance','declineInsurance'].includes(m.type)||!p.wager||this.insuranceDecided.has(p.id))throw Error('Insurance decision unavailable');
   if(m.type==='insurance'){const amount=p.wager/2;if(p.bank<amount)throw Error('Insufficient chips');p.bank-=amount;p.insurance=amount}
   this.insuranceDecided.add(p.id);
   if([...this.players.values()].filter(v=>v.wager).every(v=>this.insuranceDecided.has(v.id))){
    if(score(this.dealer)===21)this.finish();
    else{this.phase='turn';this.turn=0;this.skip();this.broadcast()}
   }else this.broadcast();
   return;
  }
  if(this.phase!=='turn'||this.current()?.id!==p.id)throw Error('Not your turn');
  if(m.type==='hit'){p.cards.push(this.draw());if(score(p.cards)>=21){p.status=score(p.cards)>21?'Bust':'Done';this.nextHand(p)}else this.broadcast();return}
  if(m.type==='stand'){p.status='Stand';this.nextHand(p);return}
  if(m.type==='double'){if(p.cards.length!==2||p.bank<p.wager)throw Error('Double unavailable');p.bank-=p.wager;p.wager*=2;p.cards.push(this.draw());p.status=score(p.cards)>21?'Bust':'Doubled';this.nextHand(p);return}
  if(m.type==='surrender'){if(p.hands||!canSurrender({cards:p.cards}))throw Error('Surrender unavailable');p.status='Surrender';this.nextHand(p);return}
  
  if(m.type==='split'){
   if(p.hands||!canSplit(p.cards)||p.bank<p.wager)throw Error('Split unavailable');
   p.bank-=p.wager;const [a,b]=p.cards;
   p.hands=[{cards:[a,this.draw()],wager:p.wager,status:'Playing',splitHand:true},{cards:[b,this.draw()],wager:p.wager,status:'Playing',splitHand:true}];
   p.activeHand=0;p.cards=p.hands[0].cards;p.status='Playing';if(a.r==='A'){p.hands[0].status='Stand';p.hands[1].status='Stand';p.activeHand=1;p.cards=p.hands[1].cards;p.status='Stand';this.advance()}else this.broadcast();return
  }
  throw Error('Unsupported action');
 }
 nextHand(p){
  if(p.hands){const hand=p.hands[p.activeHand];hand.cards=p.cards;hand.wager=p.wager;hand.status=p.status;
   if(p.activeHand+1<p.hands.length){p.activeHand++;const next=p.hands[p.activeHand];p.cards=next.cards;p.wager=next.wager;p.status='Playing';this.broadcast();return}
  }
  this.advance();
 }
 startRound(){
  if(this.shoe.length<70)this.resetShoe();
  this.phase='turn';this.turn=0;this.round++;this.dealer=[];this.revealed=false;this.insuranceDecided=new Set();this.notice='Player decisions';
  for(const p of this.players.values()){p.cards=[];p.hands=null;p.activeHand=0;p.insurance=0;p.wager=p.socket?Math.min(25,p.bank):0;p.bank-=p.wager;p.status=p.wager?'Playing':p.socket?'Out of chips':'Offline'}
  for(let i=0;i<2;i++){for(const p of this.players.values())if(p.status==='Playing')p.cards.push(this.draw());this.dealer.push(this.draw(i===1))}
  if(this.dealer[0]?.r==='A'&&[...this.players.values()].some(p=>p.wager)){this.phase='insurance';this.notice='Dealer shows Ace: take or decline insurance';this.broadcast();return}
  if(score(this.dealer)===21){this.finish();return}
  this.skip();this.broadcast();
 }
 skip(){const arr=[...this.players.values()];while(this.turn<arr.length&&(arr[this.turn].status!=='Playing'||score(arr[this.turn].cards)>=21)){if(arr[this.turn].status==='Playing')arr[this.turn].status='Done';this.turn++}if(this.turn>=arr.length)this.finish()}
 advance(){this.turn++;this.skip();this.broadcast()}
 finish(){
  this.phase='complete';if(this.dealer[1]&&!this.revealed){this.running+=count(this.dealer[1]);this.revealed=true}
  const eligible=!handValue(this.dealer).blackjack&&[...this.players.values()].some(p=>p.wager&&(p.hands?p.hands.some(h=>h.status!=='Surrender'&&score(h.cards)<=21):p.status!=='Surrender'&&score(p.cards)<=21));
  while(eligible&&dealerShouldHit(this.dealer)&&this.shoe.length)this.dealer.push(this.draw());
  for(const p of this.players.values()){
    if(!p.wager)continue;
    const hands=p.hands||[{cards:p.cards,wager:p.wager,status:p.status,splitHand:false}];
    let results=[];
    for(const h of hands){const outcome=settleHand({cards:h.cards,dealerCards:this.dealer,wager:h.wager,surrender:h.status==='Surrender',splitHand:!!h.splitHand});p.bank+=outcome.payout;h.status=outcome.result;results.push(outcome.result)}
    if(p.insurance){p.bank+=settleInsurance({insuranceWager:p.insurance,dealerCards:this.dealer}).payout}
    p.status=results.join(' / ');
  }
  this.notice='Round complete. Host may deal again';this.broadcast();
 }
}

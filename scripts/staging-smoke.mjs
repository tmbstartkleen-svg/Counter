// Real two-client smoke test against a deployed Cloudflare beta Worker.
// Run: node scripts/staging-smoke.mjs https://your-worker.workers.dev
import assert from 'node:assert/strict';
const base=process.argv[2];
if(!base||!/^https:\/\//.test(base))throw Error('Supply an HTTPS workers.dev URL');
const room='smoke-'+crypto.randomUUID().slice(0,12);
const url=base.replace(/^http/,'ws').replace(/\/$/,'')+'/api/rooms/'+room+'/ws';
const timeout=12000;
async function connect(){
 return await new Promise((resolve,reject)=>{
  const ws=new WebSocket(url);
  const timer=setTimeout(()=>{ws.close();reject(Error('WebSocket connection timed out'))},timeout);
  ws.addEventListener('open',()=>{clearTimeout(timer);resolve(ws)},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('WebSocket connection failed'))},{once:true});
 });
}
function receive(ws,predicate,label='unspecified'){
 return new Promise((resolve,reject)=>{
  const observed=[];
  const timer=setTimeout(()=>{cleanup();reject(Error('Expected '+label+' message not received; observed: '+observed.slice(-10).join(', ')))},timeout);
  function onMessage(e){let msg;try{msg=JSON.parse(e.data)}catch{return}observed.push(msg.type+':'+(msg.phase||'')+':'+(msg.players?.length??''));if(predicate(msg)){cleanup();resolve(msg)}}
  function onClose(){cleanup();reject(Error('Socket closed before expected message'))}
  function cleanup(){clearTimeout(timer);ws.removeEventListener('message',onMessage);ws.removeEventListener('close',onClose)}
  ws.addEventListener('message',onMessage);ws.addEventListener('close',onClose,{once:true});
 });
}
const clients=[];
try{
 const a=await connect();clients.push(a);
 const welcomeA=receive(a,x=>x.type==='welcome','A welcome');
 a.send(JSON.stringify({type:'join'}));const first=await welcomeA;assert.ok(first.token);
 const b=await connect();clients.push(b);
 // Subscribe to the shared-state update before joining: the server may broadcast
 // immediately after welcome, and awaiting welcome first would lose that event.
 const welcomeB=receive(b,x=>x.type==='welcome','B welcome');
 const statePromise=receive(b,x=>x.type==='state'&&x.players?.length===2,'two-player state');
 b.send(JSON.stringify({type:'join'}));const second=await welcomeB;assert.ok(second.token);
 a.send(JSON.stringify({type:'name',name:'Smoke Player'}));
 let state=await statePromise;assert.equal(state.players.length,2);
 assert.ok(state.players.some(p=>p.id===first.playerId));assert.ok(state.players.some(p=>p.id===second.playerId));
 const waitState=receive(b,x=>x.type==='state'&&x.round>=1,'round started');
 a.send(JSON.stringify({type:'start'}));
 state=await waitState;assert.ok(state.phase==='turn'||state.phase==='insurance'||state.phase==='complete');
 const until=Date.now()+timeout;
 while(state.phase==='insurance'&&Date.now()<until){
   const current=state.players.find(p=>p.id===state.turnId)||state.players.find(p=>p.wager&&!p.insuranceDecided);
   const client=current?.id===first.playerId?a:b;
   const decidedBefore=state.players.filter(p=>p.wager&&p.insuranceDecided).length;
   const nextState=receive(b,x=>x.type==='state'&&x.round===state.round&&(x.phase!=='insurance'||x.players.filter(p=>p.wager&&p.insuranceDecided).length>decidedBefore));
   client.send(JSON.stringify({type:'declineInsurance'}));state=await nextState;
 }
 if(state.phase==='turn'){
   const current=state.players.find(p=>p.id===state.turnId);assert.ok(current,'turn player exists');
   const client=current.id===first.playerId?a:b;
   const nextState=receive(b,x=>x.type==='state'&&x.round===state.round&&(x.phase==='complete'||x.turnId!==current.id));
   client.send(JSON.stringify({type:'stand'}));state=await nextState;
 }
 assert.ok(['turn','complete','insurance'].includes(state.phase));
 console.log('PASS two-client room join, shared state, deal and player action');

}finally{for(const ws of clients)try{ws.close()}catch{}}

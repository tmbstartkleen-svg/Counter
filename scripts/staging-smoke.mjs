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
function receive(ws,predicate){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error('Expected message not received'))},timeout);
  function onMessage(e){let msg;try{msg=JSON.parse(e.data)}catch{return}if(predicate(msg)){cleanup();resolve(msg)}}
  function onClose(){cleanup();reject(Error('Socket closed before expected message'))}
  function cleanup(){clearTimeout(timer);ws.removeEventListener('message',onMessage);ws.removeEventListener('close',onClose)}
  ws.addEventListener('message',onMessage);ws.addEventListener('close',onClose,{once:true});
 });
}
const clients=[];
try{
 const a=await connect();clients.push(a);
 const welcomeA=receive(a,x=>x.type==='welcome');
 a.send(JSON.stringify({type:'join'}));const first=await welcomeA;assert.ok(first.token);
 const b=await connect();clients.push(b);
 const welcomeB=receive(b,x=>x.type==='welcome');
 b.send(JSON.stringify({type:'join'}));const second=await welcomeB;assert.ok(second.token);
 const statePromise=receive(b,x=>x.type==='state'&&x.players?.length===2);
 // A state broadcast already follows welcome and might have arrived; request another broadcast by naming.
 a.send(JSON.stringify({type:'name',name:'Smoke Player'}));
 const state=await statePromise;assert.equal(state.players.length,2);
 assert.ok(state.players.some(p=>p.id===first.playerId));assert.ok(state.players.some(p=>p.id===second.playerId));
 console.log('PASS deployed WebSocket room: two clients joined and received shared state');
}finally{for(const ws of clients)try{ws.close()}catch{}}

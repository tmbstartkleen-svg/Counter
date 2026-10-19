import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const base='https://counter.tmbstartkleen.workers.dev';
function mockEnv(){
 const called=[];
 return {
  called,
  BLACKJACK_ROOMS:{
   idFromName(name){called.push(['room',name]);return name},
   get(id){called.push(['get',id]);return {fetch(){called.push(['fetch']);return new Response('accepted',{status:200})}}}
  }
 };
}
async function check(origin,expectedStatus,shouldForward){
 const env=mockEnv();
 const headers={Upgrade:'websocket'};
 if(origin!==undefined)headers.Origin=origin;
 const result=await worker.fetch(new Request(base+'/api/rooms/table-test/ws',{headers}),env);
 assert.equal(result.status,expectedStatus,'origin '+String(origin));
 assert.equal(env.called.some(x=>x[0]==='fetch'),shouldForward,'DO reached only for allowed origin');
}
test('matching browser Origin reaches room',()=>check(base,200,true));
test('non-browser clients with no Origin still reach room',()=>check(undefined,200,true));
test('browser origin from unrelated website is blocked',()=>check('https://attacker.example',403,false));
test('same host over insecure http is blocked',()=>check('http://counter.tmbstartkleen.workers.dev',403,false));
test('different port is blocked',()=>check(base+':8443',403,false));
test('prefix/suffix host confusion is blocked',()=>check('https://counter.tmbstartkleen.workers.dev.evil.example',403,false));
test('opaque null origin is blocked',()=>check('null',403,false));
test('malformed origin is blocked',()=>check('not a url',403,false));
test('no websocket upgrade still gets HTTP 426',async()=>{
 const env=mockEnv();const response=await worker.fetch(new Request(base+'/api/rooms/table-test/ws'),env);
 assert.equal(response.status,426);assert.equal(env.called.length,0);
});
test('public health request remains accessible without Origin',async()=>{
 const env=mockEnv();const response=await worker.fetch(new Request(base+'/api/health'),env);
 assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
});

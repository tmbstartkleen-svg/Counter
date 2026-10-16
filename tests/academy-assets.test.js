import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const html=readFileSync('public/index.html','utf8');
const source=readFileSync('index.html','utf8');
test('deployed website mirrors root HTML',()=>assert.equal(html,source));
test('academy scripts load in dependency order',()=>{
 const names=['v29-speed-academy.js','v30-shoe-academy.js','v31-adaptive-coach.js','v32-academy-layout.js'];
 let last=-1;
 for(const name of names){const tag='<script src="'+name+'"></script>';const pos=html.indexOf(tag);assert.ok(pos>last,'Missing or out-of-order script: '+name);last=pos;assert.ok(existsSync('public/'+name),'Missing deployed asset '+name);assert.equal(readFileSync(name,'utf8'),readFileSync('public/'+name,'utf8'),'Root/public mismatch: '+name)}
});
test('academy panel and coach integration anchors exist',()=>{
 assert.match(html,/id="academy"/);
 for(const id of ['speedAcademy','shoeAcademy','adaptiveCoach'])assert.ok(readFileSync('public/v'+({speedAcademy:29,shoeAcademy:30,adaptiveCoach:31}[id])+'-'+({speedAcademy:'speed-academy',shoeAcademy:'shoe-academy',adaptiveCoach:'adaptive-coach'}[id])+'.js','utf8').includes(id));
 assert.match(readFileSync('public/v32-academy-layout.js','utf8'),/blackedgeAcademyOpen/);
});

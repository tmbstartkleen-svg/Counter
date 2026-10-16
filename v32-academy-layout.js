(()=>{
'use strict';
const academy=document.getElementById('academy');if(!academy)return;
const items=[
 ['overview','Overview',['adaptiveCoach']],
 ['speed','Speed Drills',['speedAcademy']],
 ['shoe','Full Shoe',['shoeAcademy']],
 ['count','Count & Skills',['advancedSkills']],
 ['exam','Certification',['academyBaseDrill','academyTrueCount']]
];
const native=Array.from(academy.children).filter(x=>x.classList.contains('panel'));
if(native.length>=2){native[0].id='academyBaseDrill';native[1].id='academyTrueCount'}
const head=document.createElement('div');head.className='academy-head';head.innerHTML='<div><div class="academy-kicker">BLACKEDGE / TRAINING CENTER</div><h2>Counting Academy</h2><p>Improve card recognition, running-count accuracy, true-count math, and endurance at your own pace.</p></div><div class="academy-head-badge">VIRTUAL CARDS · PRACTICE ONLY</div>';
const nav=document.createElement('nav');nav.className='academy-tabs';nav.setAttribute('aria-label','Counting Academy sections');
const buttons=new Map();let current='overview';
function activate(id,scroll=false){
 current=id;
 for(const [key,label,sections] of items){const b=buttons.get(key);const selected=key===id;b.setAttribute('aria-selected',selected?'true':'false');b.tabIndex=selected?0:-1;for(const name of sections){const target=document.getElementById(name);if(target)target.hidden=!selected}}
 try{sessionStorage.setItem('blackedge-academy-tab',id)}catch{}
 if(scroll)nav.scrollIntoView({behavior:'smooth',block:'start'})
}
for(const [id,label] of items){const button=document.createElement('button');button.type='button';button.textContent=label;button.className='academy-tab';button.setAttribute('role','tab');button.setAttribute('aria-controls',items.find(x=>x[0]===id)[2][0]);button.onclick=()=>activate(id);buttons.set(id,button);nav.append(button)}
nav.setAttribute('role','tablist');
nav.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return; e.preventDefault();const keys=items.map(x=>x[0]);let i=keys.indexOf(current);i=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length;activate(keys[i]);buttons.get(keys[i]).focus()});
academy.insertBefore(nav,academy.firstChild);
academy.insertBefore(head,nav);
const style=document.createElement('style');style.textContent=String.raw`
#academy .academy-head{display:flex;justify-content:space-between;align-items:center;gap:20px;border:1px solid #7c6740;background:linear-gradient(120deg,#123d2e,#0c261d 60%,#1b3e30);padding:26px;border-radius:18px;margin-bottom:16px}
#academy .academy-head h2{font-size:clamp(28px,4vw,40px);letter-spacing:-.025em;margin:8px 0}
#academy .academy-head p{color:#c5d6ca;max-width:650px;margin:0;line-height:1.55}
#academy .academy-kicker{color:#e9c68e;font-size:12px;font-weight:800;letter-spacing:.14em}
#academy .academy-head-badge{color:#d3b882;border:1px solid #816c42;padding:12px;border-radius:999px;font-size:11px;white-space:nowrap;font-weight:700}
#academy .academy-tabs{display:flex;gap:8px;overflow-x:auto;padding:5px 2px 14px;scrollbar-width:thin;margin-bottom:8px;position:sticky;top:0;z-index:5;background:#071710}
#academy .academy-tab{border:1px solid #3e6853;background:#123327;border-radius:11px;white-space:nowrap;padding:12px 16px;font-size:14px;font-weight:650}
#academy .academy-tab[aria-selected="true"]{color:#112619;background:#f0c77d;border-color:#f0c77d}
#academy .academy-tab:focus-visible{outline:3px solid #fff;outline-offset:3px}
#academy .panel:not([hidden]){animation:academy-in .16s ease-out}
#academy [hidden]{display:none!important}
#academy #speedAcademy .table,#academy #shoeAcademy .table{border-width:7px;min-height:260px;border-radius:28px;background:radial-gradient(circle at 50% 25%,#26774f,#0b3d2a 85%)}
#academy #speedFace{min-height:110px;display:grid;place-items:center}
#academy #shoeAcademy .cards .card{width:clamp(42px,5vw,64px);height:clamp(62px,7vw,90px);font-size:clamp(19px,2vw,26px)}
#academy .stat{border:1px solid #2b523e}
@keyframes academy-in{from{opacity:.5;transform:translateY(4px)}to{opacity:1;transform:none}}
@media(max-width:650px){#academy .academy-head{padding:18px;display:block}#academy .academy-head-badge{display:inline-block;margin-top:14px}#academy .academy-tab{padding:12px 13px}#academy .row input{max-width:100%}#academy .table{border-width:5px!important}#academy #shoeAcademy .cards{gap:3px}}
@media(prefers-reduced-motion:reduce){#academy .panel:not([hidden]){animation:none}}
`;document.head.append(style);
for(const [id] of items){if(!document.getElementById(items.find(x=>x[0]===id)[2][0])){buttons.get(id).disabled=true}}
let initial='overview';try{const stored=sessionStorage.getItem('blackedge-academy-tab');if(buttons.has(stored))initial=stored}catch{}activate(initial);
window.blackedgeAcademyOpen=(tab)=>{if(!buttons.has(tab))return;const top=document.querySelector('[data-page="academy"]');if(top)top.click();activate(tab,true)};
})();

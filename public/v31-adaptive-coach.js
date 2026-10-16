(()=>{
'use strict';
const academy=document.getElementById('academy');if(!academy)return;
const $=id=>document.getElementById(id),key='blackedge-coach-v1';
const el=document.createElement('section');el.className='panel';el.id='adaptiveCoach';
el.innerHTML='<h2>Personal Training Coach <span class="tag">Skills dashboard</span></h2><p class="small">Recommendations use your saved drills on this device only. No account or cloud upload is required.</p><div class="grid"><div class="stat">Speed accuracy<strong id="coachSpeed">—</strong></div><div class="stat">Running checkpoints<strong id="coachRunning">—</strong></div><div class="stat">True-count checkpoints<strong id="coachTrue">—</strong></div><div class="stat">Recommended card pace<strong id="coachPace">—</strong></div></div><div id="coachRecommendation" class="coach" aria-live="polite"></div><div class="row"><button class="gold" id="coachGo">Open recommended drill</button><button id="coachRefresh">Refresh assessment</button><button id="coachExport">Export training summary</button></div><p class="small" id="coachSample"></p>';
academy.insertAdjacentElement('afterbegin',el);
function safe(key,fallback){try{const parsed=JSON.parse(localStorage.getItem(key)||'null');return parsed??fallback}catch{return fallback}}
function assess(){
 const speed=safe('blackedge-speed-v1',[]),shoe=safe('blackedge-shoe-v1',{});
 const valid=Array.isArray(speed)?speed.filter(x=>typeof x.correct==='boolean'&&Number.isFinite(x.pace)).slice(-10):[];
 const speedPct=valid.length?Math.round(valid.filter(x=>x.correct).length/valid.length*100):null;
 const checkpoints=Number(shoe.checkpoints)||0,rc=Number(shoe.rcCorrect)||0,tc=Number(shoe.tcCorrect)||0;
 const rPct=checkpoints?Math.round(100*rc/checkpoints):null,tPct=checkpoints?Math.round(100*tc/checkpoints):null;
 const pace=valid.length?valid[valid.length-1].pace:1500;
 let target='speedAcademy',message='Start with a 26-card speed drill at 1.5 seconds per card. Focus on identifying neutralizing high and low cards.';
 if(valid.length>=3&&speedPct>=90&&(checkpoints===0||rPct<90)){target='shoeAcademy';message='Practice a full shoe with 5-card checkpoints. Focus on maintaining an accurate running count across each checkpoint.'}
 if(checkpoints>=3&&rPct>=90&&tPct<90){target='shoeAcademy';message='Your running count is stronger than your true count. Practice dividing by remaining decks and compare the one-decimal results.'}
 if(valid.length>=3&&speedPct<90){target='speedAcademy';message='Build consistency with 26-card speed drills. Slow the card pace until you can reach at least 90% recent accuracy.'}
 if(valid.length>=3&&speedPct>=90&&checkpoints>=3&&rPct>=90&&tPct>=90){target='speedAcademy';message='Strong recent results. Increase card speed gradually while keeping accuracy high, then retest on a full shoe.'}
 $('coachSpeed').textContent=speedPct===null?'Not started':speedPct+'%';
 $('coachRunning').textContent=rPct===null?'Not started':rPct+'%';
 $('coachTrue').textContent=tPct===null?'Not started':tPct+'%';
 $('coachPace').textContent=(pace/1000).toFixed(2)+' sec';
 $('coachRecommendation').textContent=message;
 $('coachSample').textContent='Based on '+valid.length+' recent speed drills and '+checkpoints+' checkpoints from your latest completed full shoe. More drills improve the assessment.';
 $('coachGo').onclick=()=>{document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'})};
 return {speedAccuracy:speedPct,runningAccuracy:rPct,trueCountAccuracy:tPct,speedSample:valid.length,shoeCheckpoints:checkpoints,recommendation:message};
}
$('coachRefresh').onclick=assess;
$('coachExport').onclick=()=>{const result={version:1,exportedAt:new Date().toISOString(),assessment:assess()};const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='blackedge-coaching-summary.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
document.querySelectorAll('[data-page="academy"]').forEach(x=>x.addEventListener('click',assess));
window.addEventListener('storage',e=>{if(['blackedge-speed-v1','blackedge-shoe-v1'].includes(e.key))assess()});
assess();
})();
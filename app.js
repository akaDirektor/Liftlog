const $=s=>document.querySelector(s),fmt=n=>new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1}).format(n),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initial={week:1,kind:'back',cycle:1,library:[{id:1,name:'Тяга верхнього блока',group:'back',weight:50,reps:12},{id:2,name:'Тяга горизонтального блока',group:'back',weight:45,reps:12},{id:3,name:'Тяга гантелі в нахилі',group:'back',weight:22,reps:10},{id:4,name:'Згинання рук зі штангою',group:'back',weight:25,reps:12},{id:5,name:'Жим штанги лежачи',group:'chest',weight:60,reps:10},{id:6,name:'Жим гантелей під кутом',group:'chest',weight:20,reps:12},{id:7,name:'Розведення в кросовері',group:'chest',weight:15,reps:12},{id:8,name:'Розгинання рук на блоці',group:'chest',weight:25,reps:12}],sessions:{},history:[]};let state;try{state=JSON.parse(localStorage.getItem('liftlog-v1'))||initial}catch{state=initial}let tab='workout';const title=k=>k==='back'?'Спина + біцепс':'Груди + трицепс';const slot=()=>`${state.cycle}-${state.week}-${state.kind}`;const key=()=>state.activeSessions?.[slot()]||slot();function save(){preserveHistoryBackup();localStorage.setItem('liftlog-v1',JSON.stringify(state))}function session(){let k=key();if(!state.sessions[k]){let mult=state.week===7?.6:1+(state.week-1)*.025;state.sessions[k]={date:localDate(),finished:false,exercises:state.library.filter(e=>!e.deleted&&e.group===state.kind).map(e=>({id:e.id,sets:Array.from({length:3},()=>({pw:e.loadMode==='bodyweight'?e.weight:Math.round(e.weight*mult*2)/2,pr:e.reps,fw:'',fr:'',done:false}))}))};}state.sessions[k].exercises.forEach(e=>{preparePlanLinks(e);e.sets.forEach(prepareSet)});return state.sessions[k]}function totals(s=session()){return s.exercises.reduce((a,e)=>{e.sets.forEach(x=>{a.plan+=effectiveLoad(e,x.pw)*x.pr;if(x.done){a.fact+=effectiveLoad(e,x.fw)*Number(x.fr);a.done++}a.count++});return a},{plan:0,fact:0,done:0,count:0})}function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2800)}
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));let headings={workout:['Кожен підхід має значення.','Плануй, тренуйся та спостерігай, як зростає твоя сила.'],progress:['Твоя сила в цифрах.','Кожне завершене тренування — ще один крок уперед.'],library:['Тільки твої вправи.','Невелика бібліотека. Жодного зайвого пошуку.'],cycle:['Ритм твого прогресу.','Шість тижнів наростання. Один тиждень відновлення.']};$('#app').innerHTML=`<div class="heading"><div><h1>${headings[tab][0]}</h1><p>${headings[tab][1]}</p></div><span class="pill">Цикл ${state.cycle} · Тиждень ${state.week} із 7</span></div>`+({workout:workout,progress:progress,library:library,cycle:cycle}[tab])();save()}
function workout(){let s=session(),t=totals(),history=state.history.filter(h=>h.kind===state.kind),last=history.at(-1);return `<div class="card cycle-mini"><div><span class="eyebrow">ПОТОЧНИЙ ЦИКЛ</span><div style="margin-top:6px;font-weight:700;font-size:12px">${state.week===7?'Тиждень відновлення':'Поступове наростання навантаження'}</div></div><div class="week-dots">${Array.from({length:7},(_,i)=>`<button class="${state.week===i+1?'current':''} ${i===6?'deload':''}" onclick="setWeek(${i+1})" title="Тиждень ${i+1}">${i===6?'↘':i+1}</button>`).join('')}</div></div><div class="split"><button class="${state.kind==='back'?'selected':''}" onclick="setKind('back')">Спина <span style="opacity:.6">+ біцепс</span></button><button class="${state.kind==='chest'?'selected':''}" onclick="setKind('chest')">Груди <span style="opacity:.6">+ трицепс</span></button></div><div class="grid"><div><section class="card"><div class="work-head"><div><h2>${title(state.kind)}</h2><small>${s.exercises.length} вправи · ${t.count} підходів · <input aria-label="Дата тренування" type="date" value="${s.date}" onchange="session().date=this.value;save()" style="border:0;color:#89919c;background:none;font-size:11px"></small></div><div class="work-actions"><span class="badge">${s.finished?'Завершено':'План → виконання'}</span><button class="secondary new-workout" onclick="startNewWorkout()">＋ Нове тренування</button></div></div>${s.exercises.map((e,i)=>exercise(e,i)).join('')}<button class="secondary" style="margin-top:20px" onclick="addExercise()">＋ Додати вправу</button></section><p class="footer-note">Тоннаж = вага × повтори. Для гантелей вказуй сумарну вагу обох гантелей.</p></div><div class="right"><section class="card total"><span class="eyebrow">ПІДНЯТО СЬОГОДНІ</span><div class="big" id="fact-total">${fmt(t.fact)} <span>кг</span></div><p style="font-size:11px" id="plan-total">із ${fmt(t.plan)} кг за планом</p><div class="track"><i id="bar" style="width:${Math.min(100,t.fact/t.plan*100)||0}%"></i></div><div class="total-footer"><span id="set-count">${t.done} із ${t.count} підходів</span><span id="percent">${Math.round(t.fact/t.plan*100)||0}% плану</span></div><button class="primary" onclick="finish()">${s.finished?'Оновити результат':'Завершити тренування'} &nbsp; ↗</button></section><section class="card"><div class="eyebrow">МИНУЛОГО РАЗУ</div>${last?`<div class="big" style="font-size:30px">${fmt(last.fact)} <span>кг</span></div><small>${last.date} · ${last.done} підходів</small>`:`<div style="font-size:24px;margin:18px 0">Перший крок ↗</div><p style="font-size:11px">Заверши тренування, щоб почати свою історію прогресу.</p>`}<div class="statline"><span>Ціль цього тижня</span><b>${state.week===7?'Відновлення':'+'+(state.week-1)*2.5+'% ваги'}</b></div><div class="statline"><span>Тренувань у циклі</span><b>${state.history.filter(h=>h.cycle===state.cycle).length} / 14</b></div></section><div class="note">↗ &nbsp; План — твій орієнтир. Записуй фактичні повтори й вагу, навіть якщо вони відрізняються.</div></div></div>`}
function exercise(e,i){let info=state.library.find(x=>x.id===e.id);return `<div class="exercise"><div class="exercise-title"><span class="num">0${i+1}</span><div><b>${esc(info?.name||'Вправа')}</b><small>${e.sets.length} підходи</small></div><div class="exercise-actions"><button onclick="replaceExercise(${i})">Замінити ⇄</button><button class="danger" onclick="removeWorkoutExercise(${i})">Прибрати</button></div></div>${info?.loadMode==='bodyweight'?pullupHelp(e,i):''}<table class="sets"><thead><tr><th>ПІДХІД</th><th>${info?.loadMode==='bodyweight'?'ПЛАН ±КГ':'ПЛАН, КГ'}</th><th>ПОВТОРИ</th><th>${info?.loadMode==='bodyweight'?'ФАКТ ±КГ':'ФАКТ, КГ'}</th><th>ПОВТОРИ</th><th>ГОТОВО</th></tr></thead><tbody>${e.sets.map((s,j)=>`<tr><td><span>${j+1}</span><button class="delete-set" aria-label="Видалити підхід ${j+1}" title="Видалити підхід" onclick="deleteSet(${i},${j})">×</button></td>${['pw','pr','fw','fr'].map(k=>`<td><input aria-label="${esc(info?.name)} підхід ${j+1} ${k}" data-field="${k}" class="${k[0]==='f'?'fact':''}" type="number" min="${info?.loadMode==='bodyweight'&&k[1]==='w'?-300:0}" max="${k[1]==='r'?200:1000}" step="${k[1]==='r'?1:.5}" value="${s[k]}" placeholder="—" oninput="change(${i},${j},'${k}',this)"></td>`).join('')}<td><button aria-label="Відмітити підхід ${j+1}" class="check ${s.done?'done':''}" onclick="toggleSet(${i},${j})">✓</button></td></tr>`).join('')}</tbody></table><button style="font-size:10px;color:#89919c;margin:8px 0 0 42px" onclick="addSet(${i})">＋ Підхід</button></div>`}
function change(i,j,k,el){let v=el.value===''?'':Number(el.value);if(v!==''&&(!Number.isFinite(v)||v<Number(el.min||0)||v>Number(el.max)||(k[1]==='r'&&!Number.isInteger(v)))){el.value=session().exercises[i].sets[j][k];toast('Перевір значення');return}let x=session().exercises[i].sets[j];x[k]=v;if(x.done&&(x.fr===''||x.fw===''))x.done=false;session().finished=false;save();refreshTotals()}
function refreshTotals(){let t=totals();$('#fact-total').innerHTML=`${fmt(t.fact)} <span>кг</span>`;$('#plan-total').textContent=`із ${fmt(t.plan)} кг за планом`;$('#bar').style.width=(Math.min(100,t.fact/t.plan*100)||0)+'%';$('#set-count').textContent=`${t.done} із ${t.count} підходів`;$('#percent').textContent=(Math.round(t.fact/t.plan*100)||0)+'% плану'}
function toggleSet(i,j){let x=session().exercises[i].sets[j];if(!x.done&&(x.fw===''||x.fr===''||Number(x.fr)<=0)){toast('Вкажи фактичну вагу та кількість повторів');return}x.done=!x.done;session().finished=false;render()}function addSet(i){let a=session().exercises[i].sets;a.push({...a.at(-1),fw:'',fr:'',done:false});render()}function setKind(k){state.kind=k;render()}function setWeek(w){state.week=w;render()}
function finish(){let s=session(),t=totals();if(!t.done){toast('Спочатку запиши та відміть виконані підходи');return}let record={key:key(),kind:state.kind,week:state.week,cycle:state.cycle,date:s.date,...t,exercises:structuredClone(s.exercises)};let i=state.history.findIndex(h=>h.key===key());if(i<0)state.history.push(record);else state.history[i]=record;s.finished=true;render();toast(t.done<t.count?'Збережено частково виконане тренування':'Тренування збережено. Гарна робота!')}
function library(){return `<div class="card"><div class="row"><div><h2>Моя бібліотека</h2><p style="font-size:12px">Твоя бібліотека: додавай, редагуй і видаляй непотрібні вправи.</p></div><button class="secondary" onclick="editExercise()">＋ Своя вправа</button></div>${state.library.filter(e=>!e.deleted).map(e=>`<div class="library-row"><div><b>${esc(e.name)}</b><small>${title(e.group)} · базовий план ${e.weight} кг × ${e.reps}</small></div><div class="library-actions"><button onclick="editExercise(${e.id})">Редагувати ↗</button><button class="danger" onclick="deleteLibraryExercise(${e.id})">Видалити</button></div></div>`).join('')}</div>`}
function modal(html){$('#dialog').innerHTML=html;$('#dialog').showModal()}function editExercise(id){let e=state.library.find(e=>e.id===id);modal(`<h2>${e?'Редагувати':'Нова'} вправа</h2><form id="libform"><input name="name" aria-label="Назва вправи" placeholder="Назва вправи" required maxlength="100" value="${esc(e?.name||'')}"><select name="group"><option value="back">Спина + біцепс</option><option value="chest" ${e?.group==='chest'?'selected':''}>Груди + трицепс</option></select><label>Базова сумарна вага, кг<input name="weight" type="number" min="${e?.loadMode==='bodyweight'?-300:0}" max="1000" step="0.5" required value="${e?.weight??20}"></label><label>Повторів<input name="reps" type="number" min="1" max="200" required value="${e?.reps||12}"></label><small>Базові значення застосуються до нових тренувань.</small><button class="primary">Зберегти</button><button type="button" class="secondary" onclick="$('#dialog').close()">Скасувати</button></form>`);$('#libform').onsubmit=ev=>{ev.preventDefault();let d=new FormData(ev.target),obj={id:id||Date.now(),...e,name:d.get('name').trim(),group:d.get('group'),weight:+d.get('weight'),reps:+d.get('reps')};if(!obj.name)return;let idx=state.library.findIndex(e=>e.id===id);if(idx<0)state.library.push(obj);else state.library[idx]=obj;$('#dialog').close();render()}}
function chooseExercise(callback){if(!state.library.some(e=>!e.deleted)){toast('Бібліотека порожня. Додай свою вправу в «Мої вправи».');return}modal(`<h2>Обери зі своїх вправ</h2><select id="choice">${state.library.filter(e=>!e.deleted).map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select><button class="primary" id="choose">Обрати</button><button class="secondary" onclick="$('#dialog').close()">Скасувати</button>`);$('#choose').onclick=()=>{callback(state.library.find(e=>e.id===Number($('#choice').value)));$('#dialog').close();render()}}function newExercise(e){return {id:e.id,sets:Array.from({length:3},()=>({pw:e.weight,pr:e.reps,fw:'',fr:'',done:false}))}}function replaceExercise(i){chooseExercise(e=>{session().exercises[i]=newExercise(e);session().finished=false})}function addExercise(){chooseExercise(e=>{session().exercises.push(newExercise(e));session().finished=false})}
function progressCharts(){let h=[...state.history].sort((a,b)=>a.date.localeCompare(b.date)),filter=state.kind,selected=h.filter(x=>x.kind===filter),max=Math.max(1,...selected.map(x=>x.fact));return `<div class="split"><button class="${filter==='back'?'selected':''}" onclick="setKind('back')">Спина + біцепс</button><button class="${filter==='chest'?'selected':''}" onclick="setKind('chest')">Груди + трицепс</button></div><div class="grid"><section class="card"><h2>Тоннаж за тренування</h2><p style="font-size:12px">${title(filter)} · порівнюй однакові вправи та обсяг роботи</p>${selected.length?`<div class="spark" style="height:220px;margin-bottom:55px">${selected.slice(-12).map(x=>`<div style="height:${x.fact/max*100}%" title="${x.date}: ${fmt(x.fact)} кг"><label>${x.date.slice(5)}</label></div>`).join('')}</div><table class="wide-table"><tr><th>ДАТА</th><th>ТИЖДЕНЬ</th><th>ПЛАН</th><th>ФАКТ</th></tr>${selected.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${x.week} / 7</td><td>${fmt(x.plan)} кг</td><td><b>${fmt(x.fact)} кг</b></td></tr>`).join('')}</table>`:`<div class="empty"><h2>Тут почнеться твій прогрес</h2><p>Після першого тренування з’являться графік і результати.</p></div>`}</section><section class="card" style="align-self:start"><span class="eyebrow">ЗА ВЕСЬ ЧАС</span><div class="big">${fmt(selected.reduce((a,x)=>a+x.fact,0))} <span>кг</span></div><div class="statline"><span>Тренувань</span><b>${selected.length}</b></div><div class="statline"><span>Найкращий тоннаж</span><b>${fmt(Math.max(0,...selected.map(x=>x.fact)))} кг</b></div><p style="font-size:11px;margin-top:15px">Дані з’являються лише з твоїх завершених тренувань.</p></section></div>`}
function cycle(){return `<section class="card"><div class="row"><div><h2>Цикл ${state.cycle} · 6 + 1</h2><p style="font-size:12px">Два тренування щотижня: спина та груди.</p></div><span class="badge">Тиждень ${state.week}</span></div><div class="cycle-grid">${Array.from({length:7},(_,i)=>`<button class="cycle-box ${state.week===i+1?'active':''}" onclick="setWeek(${i+1})"><span class="eyebrow">ТИЖДЕНЬ ${i+1}</span><b>${i===6?'−40%':'+'+i*2.5+'%'}</b><small>${i===6?'Відновлення':'Від базової ваги'}</small></button>`).join('')}</div><div class="note">Це початкова схема для перегляду: +2,5% від базової ваги щотижня, на 7-му тижні — 60% базової ваги. План будь-якого підходу можна змінити вручну: додати вагу або повтори. Наступний цикл починається з базових значень бібліотеки — їх можна оновити під свій прогрес.</div><button class="secondary" style="margin-top:22px" onclick="nextCycle()">Почати наступний цикл →</button></section>`}function nextCycle(){modal(`<h2>Новий цикл</h2><p>Почати цикл ${state.cycle+1} з першого тижня? Попередні тренування залишаться в історії.</p><button class="primary" id="next">Почати цикл</button><button class="secondary" onclick="$('#dialog').close()">Скасувати</button>`);$('#next').onclick=()=>{state.cycle++;state.week=1;$('#dialog').close();render()}}

function prepareSet(x){
 if(x.fwManual===undefined)x.fwManual=x.fw!==''&&Number(x.fw)!==Number(x.pw);
 if(x.frManual===undefined)x.frManual=x.fr!==''&&Number(x.fr)!==Number(x.pr);
 if(!x.done){if(!x.fwManual)x.fw=x.pw;if(!x.frManual)x.fr=x.pr}
 return x;
}
function preparePlanLinks(e){
 const first=e.sets[0];if(!first)return;
 e.sets.forEach((x,j)=>{for(const field of ['pw','pr'])if(x[field+'Manual']===undefined)x[field+'Manual']=j>0&&Number(x[field])!==Number(first[field])});
}
function change(i,j,k,el){
 const e=session().exercises[i],x=e.sets[j];
 const v=el.value===''?'':Number(el.value);
 if(v!==''&&(!Number.isFinite(v)||v<Number(el.min||0)||v>Number(el.max)||(k[1]==='r'&&!Number.isInteger(v)))){el.value=x[k];toast('Перевір значення');return}
 x[k]=v;
 if(k[0]==='f')x[k+'Manual']=true;
 if(k[0]==='p'){
   if(j>0)x[k+'Manual']=true;
   const targets=j===0?e.sets.filter((s,index)=>index===0||(!s.done&&!s[k+'Manual'])):[x];
   for(const s of targets){
     if(s!==x)s[k]=v;
     const fact='f'+k[1];
     if(!s.done&&!s[fact+'Manual'])s[fact]=v;
   }
 }
 if(x.done&&(x.fr===''||x.fw===''||Number(x.fr)<=0))x.done=false;
 const table=el.closest('table');
 if(table)table.querySelectorAll('tbody tr').forEach((row,index)=>{
   const set=e.sets[index];if(!set)return;
   row.querySelectorAll('input[data-field]').forEach(input=>{if(input!==el)input.value=set[input.dataset.field]});
   row.querySelector('.check')?.classList.toggle('done',set.done);
 });
 session().finished=false;save();refreshTotals();
}
function addSet(i){
 const a=session().exercises[i].sets,last=a.at(-1);
 a.push(prepareSet({pw:last?.pw??0,pr:last?.pr??12,fw:'',fr:'',done:false,fwManual:false,frManual:false}));
 session().finished=false;render();
}
function deleteSet(i,j){
 const s=session(),removed=s.exercises[i].sets.splice(j,1)[0];
 s.finished=false;render();
 toast('Підхід видалено');
}
function deleteLibraryExercise(id){
 const e=state.library.find(e=>e.id===id);if(!e)return;
 modal('<h2>Видалити вправу?</h2><p>'+esc(e.name)+'</p><p style="margin-top:12px">Вправа зникне з бібліотеки та невиконаних шаблонів. Виконані підходи й історія залишаться.</p><button class="primary" id="delete-library-confirm">Видалити вправу</button><button class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button>');
 $('#delete-library-confirm').onclick=()=>{
   e.deleted=true;
   Object.values(state.sessions).forEach(s=>{if(!s.finished)s.exercises=s.exercises.filter(x=>x.id!==id||x.sets.some(set=>set.done))});
   $('#dialog').close();render();toast('Вправу видалено з бібліотеки');
 };
}


function effectiveLoad(e,adjustment){
 const info=state.library.find(x=>x.id===e.id);
 if(info?.loadMode!=='bodyweight')return Number(adjustment)||0;
 return Number(e.bodyWeight)>0?Math.max(0,Number(e.bodyWeight)+Number(adjustment)):0;
}
function pullupHelp(e,i){
 return '<div class="pullup-help"><p>−20 кг — допомога · 0 — власна вага · +10 кг — додаткова вага.</p><label>Вага тіла, кг <input type="number" min="1" max="400" step="0.5" aria-label="Вага тіла для підтягувань" value="'+(e.bodyWeight??'')+'" oninput="setBodyWeight('+i+',this)"></label><small>Тоннаж ≈ (вага тіла ± навантаження) × повтори. Допомога резинки — умовна оцінка. Без ваги тіла підтягування записуються, але не додаються до тоннажу.</small></div>';
}
function setBodyWeight(i,el){
 const n=el.value===''?'':Number(el.value);if(n!==''&&(!Number.isFinite(n)||n<=0||n>400))return;
 session().exercises[i].bodyWeight=n;session().finished=false;save();refreshTotals();
}
function addRequestedBackExercises(){
 if(state.backExercisesAddedV1)return;
 const requested=[
 {id:10001,name:'Тяга штанги в нахилі лежачи',group:'back',weight:0,reps:10},
 {id:10002,name:'Підтягування',group:'back',weight:0,reps:8,loadMode:'bodyweight'}
 ];
 const added=[];
 requested.forEach(e=>{
   let existing=state.library.find(x=>!x.deleted&&x.name.toLowerCase()===e.name.toLowerCase());
   if(existing){if(e.loadMode)existing.loadMode=e.loadMode;return}
   while(state.library.some(x=>x.id===e.id))e.id++;
   state.library.push(e);added.push(e);
 });
 Object.entries(state.sessions).forEach(([k,s])=>{
   if(!k.endsWith('-back')||s.finished||state.history.some(h=>h.key===k))return;
   added.forEach(e=>{if(!s.exercises.some(x=>x.id===e.id))s.exercises.push(newExercise(e))});
 });
 state.backExercisesAddedV1=true;save();
}
addRequestedBackExercises();


function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function archiveCurrentWorkout(){
 const s=session(),t=totals(s);if(!t.done)return;
 const record={key:key(),kind:state.kind,week:state.week,cycle:state.cycle,date:s.date,...t,exercises:structuredClone(s.exercises)};
 const i=state.history.findIndex(h=>h.key===key());
 if(i<0)state.history.push(record);else state.history[i]=record;
}
function startNewWorkout(){
 modal('<h2>Нове тренування</h2><p>'+title(state.kind)+'</p><p style="margin-top:12px">Виконаний результат збережеться в історії. План залишиться, відмітки виконання скинуться, дата буде сьогоднішня.</p><button class="primary" id="start-new-workout">Почати тренування</button><button class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button>');
 $('#start-new-workout').onclick=()=>createNewWorkout();
}
function createNewWorkout(){
 const previous=session();
 archiveCurrentWorkout();
 const exercises=previous.exercises.filter(e=>!state.library.find(x=>x.id===e.id)?.deleted).map(e=>({
   ...structuredClone(e),
   sets:e.sets.map(x=>prepareSet({pw:x.pw,pr:x.pr,fw:x.pw,fr:x.pr,done:false,fwManual:false,frManual:false}))
 }));
 state.workoutSequence=(state.workoutSequence||0)+1;
 const id=slot()+'-session-'+Date.now()+'-'+state.workoutSequence;
 state.activeSessions??={};state.activeSessions[slot()]=id;
 state.sessions[id]={date:localDate(),finished:false,exercises};
 save();$('#dialog').close();render();toast('Нове тренування готове. Попередній результат збережено.');
}
function removeWorkoutExercise(i){
 const s=session(),e=s.exercises[i];if(!e)return;
 const name=state.library.find(x=>x.id===e.id)?.name||'Вправа';
 modal('<h2>Прибрати вправу з тренування?</h2><p>'+esc(name)+'</p><p style="margin-top:12px">Її підходи буде прибрано з цього тренування. Вправа залишиться у «Моїх вправах».</p><button class="primary" id="remove-workout-exercise">Прибрати вправу</button><button class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button>');
 $('#remove-workout-exercise').onclick=()=>{s.exercises.splice(i,1);s.finished=false;$('#dialog').close();render()};
}


function preserveHistoryBackup(){
 try{const raw=localStorage.getItem('liftlog-v1');if(raw&&!localStorage.getItem('liftlog-backup-before-history-v1'))localStorage.setItem('liftlog-backup-before-history-v1',raw)}catch{}
}
function progress(){
 const rows=state.history.map((h,index)=>({h,index})).sort((a,b)=>b.h.date.localeCompare(a.h.date)||b.index-a.index);
 return '<section class="card"><div class="row"><div><h2>Історія всіх тренувань</h2><p>Груди та спина · '+rows.length+' записів</p></div><button class="secondary" onclick="downloadBackup()">Завантажити резервну копію</button></div>'+
 (rows.length?'<div class="history-list">'+rows.map(({h,index})=>'<button class="history-entry" onclick="showWorkoutHistory('+index+')"><span><b>'+esc(title(h.kind))+'</b><small>'+esc(h.date)+' · Цикл '+h.cycle+' · Тиждень '+h.week+(h.recovered?' · Відновлено зі збережених підходів':'')+'</small></span><span><b>'+fmt(h.fact)+' кг</b><small>'+h.done+' підходів · Деталі →</small></span></button>').join('')+'</div>':'<p style="margin-top:20px">У цьому браузері немає збережених результатів. Дані з іншого браузера або пристрою автоматично не синхронізуються.</p>')+'</section>'+progressCharts();
}
function showWorkoutHistory(index){
 const h=state.history[index];if(!h)return;
 modal('<h2>'+esc(title(h.kind))+'</h2><p>'+esc(h.date)+' · '+fmt(h.fact)+' кг</p>'+
 (h.exercises||[]).map(e=>{
 const name=e.name||state.library.find(x=>x.id===e.id)?.name||'Вправа';
 return '<section style="margin-top:22px"><b>'+esc(name)+'</b><table class="wide-table"><tr><th>Підхід</th><th>План</th><th>Факт</th><th>Стан</th></tr>'+e.sets.map((x,j)=>'<tr><td>'+(j+1)+'</td><td>'+fmt(x.pw)+' × '+fmt(x.pr)+'</td><td>'+fmt(Number(x.fw))+' × '+fmt(Number(x.fr))+'</td><td>'+(x.done?'✓':'—')+'</td></tr>').join('')+'</table></section>';
 }).join('')+'<button class="secondary" style="margin-top:20px" onclick="document.querySelector(\'#dialog\').close()">Закрити</button>');
}
function downloadBackup(){
 const blob=new Blob([JSON.stringify({format:'liftlog-backup-v1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='liftlog-backup-'+localDate()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
preserveHistoryBackup();


document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});render();

function setFontSize(value){
 const size=['1','1.15','1.3'].includes(String(value))?String(value):'1.15';
 document.documentElement.style.setProperty('--font-scale',size);
 document.querySelectorAll('[data-font]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.font===size)));
 try{localStorage.setItem('liftlog-font-size',size)}catch{}
}
document.querySelectorAll('[data-font]').forEach(b=>b.addEventListener('click',()=>setFontSize(b.dataset.font)));
let savedFont='1.15';try{savedFont=localStorage.getItem('liftlog-font-size')||savedFont}catch{}
setFontSize(savedFont);

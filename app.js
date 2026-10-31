const $=s=>document.querySelector(s),fmt=n=>new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2}).format(n),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initial={week:1,kind:'back',cycle:1,library:[{id:1,name:'Тяга верхнього блока',group:'back',weight:50,reps:12},{id:2,name:'Тяга горизонтального блока',group:'back',weight:45,reps:12},{id:3,name:'Тяга гантелі в нахилі',group:'back',weight:22,reps:10},{id:4,name:'Згинання рук зі штангою',group:'back',weight:25,reps:12},{id:5,name:'Жим штанги лежачи',group:'chest',weight:60,reps:10},{id:6,name:'Жим гантелей під кутом',group:'chest',weight:20,reps:12},{id:7,name:'Розведення в кросовері',group:'chest',weight:15,reps:12},{id:8,name:'Розгинання рук на блоці',group:'chest',weight:25,reps:12}],sessions:{},history:[]};let state;try{state=JSON.parse(localStorage.getItem('liftlog-v1'))||initial}catch{state=initial}let tab='workout';const workoutKinds=['back','chest','legs'];const title=k=>({back:'Спина + біцепс',chest:'Груди + трицепс',legs:'Ноги + плечі'}[k]||'Тренування');const slot=()=>`${state.cycle}-${state.week}-${state.kind}`;const key=()=>state.activeSessions?.[slot()]||slot();function save(){preserveHistoryBackup();localStorage.setItem('liftlog-v1',JSON.stringify(state))}function session(){let k=key();if(!state.sessions[k]){let mult=state.week===7?.6:1+(state.week-1)*.025;state.sessions[k]={date:localDate(),finished:false,exercises:state.library.filter(e=>!e.deleted&&e.group===state.kind).map(e=>({id:e.id,weightMode:e.weightMode||(e.loadMode==='bodyweight'?'bodyweight':'total'),loadMode:e.loadMode,sets:Array.from({length:3},()=>({pw:e.loadMode==='bodyweight'?e.weight:Math.round(e.weight*mult*2)/2,pr:e.reps,fw:'',fr:'',done:false}))}))};}state.sessions[k].exercises.forEach(e=>{preparePlanLinks(e);e.sets.forEach(prepareSet)});return state.sessions[k]}function totals(s=session()){return s.exercises.reduce((a,e)=>{e.sets.forEach(x=>{a.plan+=effectiveLoad(e,x.pw)*x.pr;if(x.done){a.fact+=effectiveLoad(e,x.fw)*Number(x.fr);a.done++}a.count++});return a},{plan:0,fact:0,done:0,count:0})}function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2800)}
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));let headings={planning:['Твій план на шість тижнів.','Шість тижнів редагуються прямо на екрані. Вага й повтори переходять далі за твоєю схемою.'],workout:['Кожен підхід має значення.','Плануй, тренуйся та спостерігай, як зростає твоя сила.'],progress:['Твоя сила в цифрах.','Кожне завершене тренування — ще один крок уперед.'],library:['Тільки твої вправи.','Невелика бібліотека. Жодного зайвого пошуку.'],cycle:['Ритм твого прогресу.','Шість тижнів наростання. Один тиждень відновлення.']};$('#app').innerHTML=`<div class="heading"><div><h1>${headings[tab][0]}</h1><p>${headings[tab][1]}</p></div><span class="pill">${tab==='planning'?'Макроплан · 6 тижнів':`Цикл ${state.cycle} · Тиждень ${state.week} із 7`}</span></div>`+({workout:workout,progress:progress,library:library,cycle:cycle,planning:planning}[tab])();save();renderRestTimer()}
function workout(){let s=session();if(s.finished)return workoutKindTabs()+completedWorkout();let t=totals(),history=state.history.filter(h=>h.kind===state.kind),last=history.at(-1);return `<div class="card cycle-mini"><div><span class="eyebrow">ПОТОЧНИЙ ЦИКЛ</span><div style="margin-top:6px;font-weight:700;font-size:12px">${state.week===7?'Тиждень відновлення':'Поступове наростання навантаження'}</div></div><div class="week-dots">${Array.from({length:7},(_,i)=>`<button class="${state.week===i+1?'current':''} ${i===6?'deload':''}" onclick="setWeek(${i+1})" title="Тиждень ${i+1}">${i===6?'↘':i+1}</button>`).join('')}</div></div>${workoutKindTabs()}<div class="grid"><div><section class="card"><div class="work-head"><div><h2>${title(state.kind)}</h2><small>${s.exercises.length} вправи · ${t.count} підходів · <input aria-label="Дата тренування" type="date" value="${s.date}" onchange="session().date=this.value;save()" style="border:0;color:#89919c;background:none;font-size:11px"></small></div><div class="work-actions"><span class="badge">${s.finished?'Завершено':'План → виконання'}</span><button class="secondary" onclick="beginWorkTimer()">Почати замір підходу</button><button class="secondary new-workout" onclick="startNewWorkout()">＋ Нове тренування</button></div></div>${s.exercises.map((e,i)=>exercise(e,i)).join('')}<label class="notes-label">Примітки до тренування<textarea maxlength="5000" placeholder="Самопочуття, цілі, що врахувати…" oninput="session().notes=this.value;save()">${esc(s.notes||'')}</textarea></label><button class="secondary" style="margin-top:20px" onclick="addExercise()">＋ Додати вправу</button></section><p class="footer-note">Тоннаж = вага × повтори. Для гантелей: вага однієї гантелі та повтори на сторону; один підхід — обидві сторони.</p></div><div class="right"><section class="card total"><span class="eyebrow">ПІДНЯТО СЬОГОДНІ</span><div class="big" id="fact-total">${fmt(t.fact)} <span>кг</span></div><p style="font-size:11px" id="plan-total">із ${fmt(t.plan)} кг за планом</p><div class="track"><i id="bar" style="width:${Math.min(100,t.fact/t.plan*100)||0}%"></i></div><div class="total-footer"><span id="set-count">${t.done} із ${t.count} підходів</span><span id="percent">${Math.round(t.fact/t.plan*100)||0}% плану</span></div><button class="primary" onclick="finish()">${s.finished?'Оновити результат':'Завершити тренування'} &nbsp; ↗</button></section><section class="card"><div class="eyebrow">МИНУЛОГО РАЗУ</div>${last?`<div class="big" style="font-size:30px">${fmt(last.fact)} <span>кг</span></div><small>${last.date} · ${last.done} підходів</small>`:`<div style="font-size:24px;margin:18px 0">Перший крок ↗</div><p style="font-size:11px">Заверши тренування, щоб почати свою історію прогресу.</p>`}<div class="statline"><span>Ціль цього тижня</span><b>${state.week===7?'Відновлення':'+'+(state.week-1)*2.5+'% ваги'}</b></div><div class="statline"><span>Тренувань у циклі</span><b>${state.history.filter(h=>h.cycle===state.cycle).length} виконано</b></div></section><div class="note">↗ &nbsp; План — твій орієнтир. Записуй фактичні повтори й вагу, навіть якщо вони відрізняються.</div></div></div>`}
function exercise(e,i){let info=state.library.find(x=>x.id===e.id);return `<div class="exercise" data-exercise="${i}"><div class="exercise-title"><span class="num">0${i+1}</span><div><b>${esc(info?.name||'Вправа')}</b><small>${e.sets.length} підходи</small></div><div class="exercise-actions"><button onclick="replaceExercise(${i})">Замінити ⇄</button><button class="danger" onclick="removeWorkoutExercise(${i})">Прибрати</button></div></div>${exerciseWeightMode(e)==='bodyweight'?pullupHelp(e,i):''}<div class="weight-mode-note">${weightModeLabel(exerciseWeightMode(e))}</div><table class="sets"><thead><tr><th>ПІДХІД</th><th>${info?.loadMode==='bodyweight'?'ПЛАН ±КГ':'ПЛАН, КГ'}</th><th>ПОВТОРИ</th><th>${info?.loadMode==='bodyweight'?'ФАКТ ±КГ':'ФАКТ, КГ'}</th><th>ПОВТОРИ</th><th>ГОТОВО</th></tr></thead><tbody>${e.sets.map((s,j)=>`<tr data-set="${j}"><td><span>${j+1}</span><button class="delete-set" aria-label="Видалити підхід ${j+1}" title="Видалити підхід" onclick="deleteSet(${i},${j})">×</button></td>${['pw','pr','fw','fr'].map(k=>`<td><input aria-label="${esc(info?.name)} підхід ${j+1} ${k}" data-field="${k}" class="${k[0]==='f'?'fact':''}" type="number" min="${info?.loadMode==='bodyweight'&&k[1]==='w'?-300:0}" max="${k[1]==='r'?200:1000}" step="${k[1]==='r'?1:.5}" value="${s[k]}" placeholder="—" oninput="change(${i},${j},'${k}',this)"></td>`).join('')}<td><button aria-label="Відмітити підхід ${j+1}" class="check ${s.done?'done':''}" onclick="toggleSet(${i},${j})">✓</button></td></tr>${setVolumeRow(e,s,j)}`).join('')}</tbody></table><div class="exercise-volume" data-volume-summary>${exerciseVolumeSummary(e)}</div><label class="notes-label">Примітки до вправи<textarea maxlength="3000" placeholder="Техніка, відчуття, відпочинок…" oninput="session().exercises[${i}].notes=this.value;save()">${esc(e.notes||'')}</textarea></label><button style="font-size:10px;color:#89919c;margin:8px 0 0 42px" onclick="addSet(${i})">＋ Підхід</button></div>`}
function change(i,j,k,el){let v=el.value===''?'':Number(el.value);if(v!==''&&(!Number.isFinite(v)||v<Number(el.min||0)||v>Number(el.max)||(k[1]==='r'&&!Number.isInteger(v)))){el.value=session().exercises[i].sets[j][k];toast('Перевір значення');return}let x=session().exercises[i].sets[j];x[k]=v;if(x.done&&(x.fr===''||x.fw===''))x.done=false;session().finished=false;save();refreshTotals()}
function refreshTotals(){let t=totals();$('#fact-total').innerHTML=`${fmt(t.fact)} <span>кг</span>`;$('#plan-total').textContent=`із ${fmt(t.plan)} кг за планом`;$('#bar').style.width=(Math.min(100,t.fact/t.plan*100)||0)+'%';$('#set-count').textContent=`${t.done} із ${t.count} підходів`;$('#percent').textContent=(Math.round(t.fact/t.plan*100)||0)+'% плану';refreshExerciseVolumes()}
function toggleSet(i,j){let x=session().exercises[i].sets[j];if(!x.done&&(x.fw===''||x.fr===''||Number(x.fr)<=0)){toast('Вкажи фактичну вагу та кількість повторів');return}x.done=!x.done;if(x.done)startRestTimer(i,j);else if(state.restTimer?.setId===x.restTimerId)dismissRestTimer();session().finished=false;render()}function addSet(i){let a=session().exercises[i].sets;a.push({...a.at(-1),fw:'',fr:'',done:false});render()}function setKind(k){state.kind=k;render()}function setWeek(w){state.week=w;render()}
function finish(){stopRestTimer('workout-complete');clearTimerUndo();let s=session(),t=totals();if(!t.done){toast('Спочатку запиши та відміть виконані підходи');return}let record={key:key(),kind:state.kind,week:state.week,cycle:state.cycle,date:s.date,...t,notes:s.notes||'',exercises:snapshotExercises(s.exercises)};let i=state.history.findIndex(h=>h.key===key());if(i<0)state.history.push(record);else state.history[i]=record;s.finished=true;state.restTimer=null;clearTimerUndo();render();toast(t.done<t.count?'Збережено частково виконане тренування':'Тренування збережено. Гарна робота!')}
function library(){return `<div class="card"><div class="row"><div><h2>Моя бібліотека</h2><p style="font-size:12px">Твоя бібліотека: додавай, редагуй і видаляй непотрібні вправи.</p></div><button class="secondary" onclick="editExercise()">＋ Своя вправа</button></div>${state.library.filter(e=>!e.deleted).map(e=>`<div class="library-row"><div><b>${esc(e.name)}</b><small>${title(e.group)} · ${weightModeLabel(e.weightMode||(e.loadMode==='bodyweight'?'bodyweight':'total'))} · ${e.weight} кг × ${e.reps}</small></div><div class="library-actions"><button onclick="editExercise(${e.id})">Редагувати ↗</button><button class="danger" onclick="deleteLibraryExercise(${e.id})">Видалити</button></div></div>`).join('')}</div>`}
function modal(html){$('#dialog').innerHTML=html;$('#dialog').showModal()}function editExercise(id){let e=state.library.find(e=>e.id===id);modal(`<h2>${e?'Редагувати':'Нова'} вправа</h2><form id="libform"><input name="name" aria-label="Назва вправи" placeholder="Назва вправи" required maxlength="100" value="${esc(e?.name||'')}"><select name="group">${workoutKinds.map(kind=>`<option value="${kind}" ${e?.group===kind?'selected':''}>${title(kind)}</option>`).join('')}</select><label>Облік ваги<select name="weightMode">${weightModeOptions(e?.weightMode||(e?.loadMode==='bodyweight'?'bodyweight':'total'))}</select></label><label>Базова вага, кг (для гантелей — однієї)<input name="weight" type="number" min="${e?.loadMode==='bodyweight'?-300:0}" max="1000" step="0.5" required value="${e?.weight??20}"></label><label>Повторів<input name="reps" type="number" min="1" max="200" required value="${e?.reps||12}"></label><small>Дві гантелі / дві сторони: вводь вагу однієї гантелі й повтори на сторону, тоннаж ×2. Історичні записи не змінюються. Базова вага має відповідати вибраному способу обліку.</small><button class="primary">Зберегти</button><button type="button" class="secondary" onclick="$('#dialog').close()">Скасувати</button></form>`);$('#libform').onsubmit=ev=>{ev.preventDefault();let d=new FormData(ev.target),obj={id:id||Date.now(),...e,name:d.get('name').trim(),group:d.get('group'),weightMode:d.get('weightMode'),loadMode:d.get('weightMode')==='bodyweight'?'bodyweight':undefined,weight:+d.get('weight'),reps:+d.get('reps')};if(!obj.name)return;let idx=state.library.findIndex(e=>e.id===id);if(idx<0)state.library.push(obj);else state.library[idx]=obj;$('#dialog').close();render()}}
function chooseExercise(callback){if(!state.library.some(e=>!e.deleted)){toast('Бібліотека порожня. Додай свою вправу в «Мої вправи».');return}modal(`<h2>Обери зі своїх вправ</h2><select id="choice">${state.library.filter(e=>!e.deleted).map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select><button class="primary" id="choose">Обрати</button><button class="secondary" onclick="$('#dialog').close()">Скасувати</button>`);$('#choose').onclick=()=>{callback(state.library.find(e=>e.id===Number($('#choice').value)));$('#dialog').close();render()}}function newExercise(e){return {id:e.id,weightMode:e.weightMode||(e.loadMode==='bodyweight'?'bodyweight':'total'),loadMode:e.loadMode,sets:Array.from({length:3},()=>({pw:e.weight,pr:e.reps,fw:'',fr:'',done:false}))}}function replaceExercise(i){chooseExercise(e=>{session().exercises[i]=newExercise(e);session().finished=false})}function addExercise(){chooseExercise(e=>{session().exercises.push(newExercise(e));session().finished=false})}
let historyKinds=['back','chest','legs'];
function historySelectionLabel(){return historyKinds.length?historyKinds.map(title).join(' · '):'Жодне тренування не вибране'}
function toggleHistoryKind(kind){
 if(historyKinds.includes(kind))historyKinds=historyKinds.filter(x=>x!==kind);else historyKinds.push(kind);
 render();
}
function selectedHistory(){return state.history.filter(h=>historyKinds.includes(h.kind))}
let trendMode='cycle',trendCycle=null;
function trendDate(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function mondayOf(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return d}
function trendWeeks(selected,mode=trendMode,cycle=trendCycle??state.cycle,today=localDate()){
 let weeks;
 if(mode==='recent'){
  const monday=mondayOf(today);
  weeks=Array.from({length:6},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()-(5-i)*7);const end=new Date(d);end.setDate(end.getDate()+6);return {label:'Тиждень '+(i+1),dateLabel:String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0'),start:trendDate(d),end:trendDate(end),current:i===5,plan:0,fact:0,count:0,kinds:[]}});
 }else weeks=Array.from({length:6},(_,i)=>({label:'Тиждень '+(i+1),week:i+1,cycle:Number(cycle),current:Number(cycle)===state.cycle&&i+1===state.week,plan:0,fact:0,count:0,kinds:[]}));
 selected.forEach(h=>{
  const w=mode==='recent'?weeks.find(x=>h.date>=x.start&&h.date<=x.end):weeks.find(x=>Number(h.cycle)===x.cycle&&Number(h.week)===x.week);
  if(!w)return;w.plan+=Number(h.plan)||0;w.fact+=Number(h.fact)||0;w.count++;if(!w.kinds.includes(h.kind))w.kinds.push(h.kind);
 });
 return weeks;
}
function progressCharts(){
 const selected=selectedHistory(),cycle=trendCycle??state.cycle,weeks=trendWeeks(selected),peak=Math.max(1,...weeks.map(x=>x.fact)),ceiling=Math.ceil(peak/1000)*1000;
 const cycles=[...new Set([state.cycle,...state.history.map(h=>Number(h.cycle))])].sort((a,b)=>a-b);
 const observed=weeks.filter(w=>w.count),first=observed[0],last=observed.at(-1),canCompare=observed.length>=2&&first.fact>0;
 const delta=canCompare?(last.fact-first.fact)/first.fact*100:null,windowSum=weeks.reduce((s,w)=>s+w.fact,0);
 return '<div class="grid"><section class="card"><div class="trend-heading"><div><h2>Динаміка за 6 тижнів</h2><p>'+esc(historySelectionLabel())+'</p></div><div class="trend-controls"><select aria-label="Період графіка" onchange="trendMode=this.value;render()"><option value="cycle" '+(trendMode==='cycle'?'selected':'')+'>Шеститижневий цикл</option><option value="recent" '+(trendMode==='recent'?'selected':'')+'>Останні 6 календарних тижнів</option></select>'+
 (trendMode==='cycle'?'<select aria-label="Цикл графіка" onchange="trendCycle=Number(this.value);render()">'+cycles.map(c=>'<option value="'+c+'" '+(Number(cycle)===c?'selected':'')+'>Цикл '+c+'</option>').join('')+'</select>':'')+'</div></div>'+
 '<div class="trend-caption">'+(trendMode==='cycle'?'Тижні 1–6 циклу '+cycle+'. Тиждень 7 — полегшений; його записи залишаються в історії.':'Тижні від понеділка до неділі, включно з поточним.')+'</div>'+
 '<div class="tonnage-chart" role="img" aria-label="Тоннаж за шість тижнів у кілограмах"><div class="chart-axis"><span>'+fmt(ceiling)+' кг</span><span>'+fmt(ceiling/2)+'</span><span>0</span></div><div class="chart-columns">'+weeks.map(w=>'<div class="chart-week '+(w.current?'is-current':'')+'"><div class="chart-slot">'+(w.count?'<span class="chart-value">'+fmt(w.fact)+'</span><div class="chart-bar" style="height:'+Math.max(1,w.fact/ceiling*100)+'%" title="'+esc(w.label+(w.start?' '+w.start+' — '+w.end:''))+': '+fmt(w.fact)+' кг · '+w.count+' тренувань"></div>':'<span class="chart-no-data">—</span>')+'</div><b>'+w.label+'</b><small>'+(w.dateLabel||'')+(w.current?' · зараз':'')+'</small><small>'+(w.count?w.count+' трен.':'Немає даних')+'</small></div>').join('')+'</div></div>'+
 '<div class="trend-insight">'+(canCompare?'<b>'+(delta>=0?'+':'')+fmt(delta)+'%</b> · '+esc(last.label)+' проти '+esc(first.label)+'. Порівняння записаного тоннажу; неповні тижні можуть давати нижчу суму.':'Для оцінки динаміки потрібні записи щонайменше за два тижні. Порожні тижні не вважаються нульовим результатом.')+'</div>'+
 '<table class="wide-table"><tr><th>ТИЖДЕНЬ</th><th>ТРЕНУВАНЬ</th><th>ФАКТ, КГ</th></tr>'+weeks.map(w=>'<tr><td>'+w.label+(w.dateLabel?' · '+w.dateLabel:'')+'</td><td>'+w.count+'</td><td>'+(w.count?'<b>'+fmt(w.fact)+'</b>':'—')+'</td></tr>').join('')+'</table></section>'+
 '<section class="card history-summary" style="align-self:start"><span class="eyebrow">СУМАРНИЙ ТОННАЖ · ЗА ВЕСЬ ЧАС</span><div class="big">'+fmt(selected.reduce((s,h)=>s+Number(h.fact||0),0))+' <span>кг</span></div><p>'+esc(historySelectionLabel())+'</p><div class="statline"><span>За вибрані 6 тижнів</span><b>'+fmt(windowSum)+' кг</b></div><div class="statline"><span>Тренувань за весь час</span><b>'+selected.length+'</b></div></section></div>';
}
function cycle(){return `<section class="card"><div class="row"><div><h2>Цикл ${state.cycle} · 6 + 1</h2><p style="font-size:12px">Типи тренувань: спина + біцепс, груди + трицепс, ноги + плечі.</p></div><span class="badge">Тиждень ${state.week}</span></div><div class="cycle-grid">${Array.from({length:7},(_,i)=>`<button class="cycle-box ${state.week===i+1?'active':''}" onclick="setWeek(${i+1})"><span class="eyebrow">ТИЖДЕНЬ ${i+1}</span><b>${i===6?'−40%':'+'+i*2.5+'%'}</b><small>${i===6?'Відновлення':'Від базової ваги'}</small></button>`).join('')}</div><div class="note">Це початкова схема для перегляду: +2,5% від базової ваги щотижня, на 7-му тижні — 60% базової ваги. План будь-якого підходу можна змінити вручну: додати вагу або повтори. Наступний цикл починається з базових значень бібліотеки — їх можна оновити під свій прогрес.</div><button class="secondary" style="margin-top:22px" onclick="nextCycle()">Почати наступний цикл →</button></section>`}function nextCycle(){modal(`<h2>Новий цикл</h2><p>Почати цикл ${state.cycle+1} з першого тижня? Попередні тренування залишаться в історії.</p><button class="primary" id="next">Почати цикл</button><button class="secondary" onclick="$('#dialog').close()">Скасувати</button>`);$('#next').onclick=()=>{state.cycle++;state.week=1;$('#dialog').close();render()}}

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
 if(table)table.querySelectorAll('tbody tr[data-set]').forEach((row,index)=>{
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
 if(exerciseWeightMode(e)!=='bodyweight')return (Number(adjustment)||0)*weightMultiplier(exerciseWeightMode(e));
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

function weightMultiplier(mode){return mode==='pairSides'?4:mode==='pair'||mode==='sides'?2:1}
function exerciseWeightMode(e){return e.weightMode||(e.loadMode==='bodyweight'?'bodyweight':state.library.find(x=>x.id===e.id)?.weightMode)||'total'}
function weightModeLabel(mode){return {total:'Загальна вага · тоннаж ×1',pair:'Дві гантелі одночасно · вага однієї · тоннаж ×2',sides:'По черзі на дві сторони · вага однієї · повтори на сторону · тоннаж ×2',pairSides:'Дві гантелі · дві ноги по черзі · вага однієї · повтори на ногу · тоннаж ×4',bodyweight:'Вага тіла ± допомога / обтяження'}[mode]||'Загальна вага'}
function weightModeOptions(selected){return ['total','pair','sides','pairSides','bodyweight'].map(mode=>'<option value="'+mode+'" '+(mode===selected?'selected':'')+'>'+weightModeLabel(mode)+'</option>').join('')}
function migrateDumbbellAccounting(){
 if(state.weightAccountingVersion===1)return;
 try{const raw=localStorage.getItem('liftlog-v1');if(raw&&!localStorage.getItem('liftlog-before-dumbbell-accounting'))localStorage.setItem('liftlog-before-dumbbell-accounting',raw)}catch{}
 const oldMode=e=>e.loadMode==='bodyweight'||state.library.find(x=>x.id===e.id)?.loadMode==='bodyweight'?'bodyweight':'total';
 // Freeze the meaning of all old records before changing the library.
 [...Object.values(state.sessions||{}),...state.history,...(state.historyRevisions||[]).map(r=>r.record)].forEach(s=>(s.exercises||[]).forEach(e=>{e.weightMode??=oldMode(e)}));
 state.library.forEach(e=>{
 if(e.weightMode)return;
 if(e.loadMode==='bodyweight')e.weightMode='bodyweight';
 else if(/гантел/i.test(e.name)){e.weightMode=/тяга|одн|почерг/i.test(e.name)?'sides':'pair';e.weight=Number(e.weight)/2}
 else e.weightMode='total';
 });
 Object.entries(state.sessions||{}).forEach(([id,s])=>{
 if(s.finished||state.history.some(h=>h.key===id))return;
 s.exercises.forEach(e=>{
 const mode=state.library.find(x=>x.id===e.id)?.weightMode||e.weightMode;
 if(weightMultiplier(mode)===2&&e.weightMode==='total'){
 e.sets.forEach(x=>{if(x.pw!=='')x.pw=Number(x.pw)/2;if(x.fw!=='')x.fw=Number(x.fw)/2});
 e.weightMode=mode;
 }
 });
 });
 state.weightAccountingVersion=1;save();
}
migrateDumbbellAccounting();

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
 stopRestTimer('workout-complete');clearTimerUndo();
 const previous=session();
 archiveCurrentWorkout();
 const exercises=previous.exercises.filter(e=>!state.library.find(x=>x.id===e.id)?.deleted).map(e=>({
   ...structuredClone(e),notes:'',
   weightMode:state.library.find(x=>x.id===e.id)?.weightMode||exerciseWeightMode(e),loadMode:(state.library.find(x=>x.id===e.id)?.weightMode||exerciseWeightMode(e))==='bodyweight'?'bodyweight':undefined,
   sets:e.sets.map(x=>{const mode=state.library.find(y=>y.id===e.id)?.weightMode||exerciseWeightMode(e),w=x.pw*weightMultiplier(exerciseWeightMode(e))/weightMultiplier(mode);return prepareSet({pw:w,pr:x.pr,fw:w,fr:x.pr,done:false,fwManual:false,frManual:false})})
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
 const rows=state.history.map((h,index)=>({h,index})).filter(({h})=>historyKinds.includes(h.kind)).sort((a,b)=>b.h.date.localeCompare(a.h.date)||b.index-a.index);
 const filters='<div class="split history-filters" role="group" aria-label="Типи тренувань в історії">'+workoutKinds.map(kind=>'<button class="'+(historyKinds.includes(kind)?'selected':'')+'" aria-pressed="'+historyKinds.includes(kind)+'" onclick="toggleHistoryKind(\''+kind+'\')">'+(historyKinds.includes(kind)?'✓ ':'')+title(kind)+'</button>').join('')+'</div>';
 return filters+progressCharts()+timeAnalytics()+'<section class="card"><div class="row"><div><h2>Історія тренувань</h2><p>'+esc(historySelectionLabel())+' · '+rows.length+' записів</p></div><button class="secondary" onclick="downloadBackup()">Завантажити резервну копію</button></div>'+
 (rows.length?'<div class="history-list">'+rows.map(({h,index})=>'<button class="history-entry" onclick="showWorkoutHistory('+index+')"><span><b>'+esc(title(h.kind))+'</b><small>'+esc(h.date)+' · Цикл '+h.cycle+' · Тиждень '+h.week+'</small></span><span><b>'+fmt(h.fact)+' кг</b><small>'+h.done+' підходів · Деталі →</small></span></button>').join('')+'</div>':'<p style="margin-top:20px">'+(historyKinds.length?'Немає збережених результатів для вибраних тренувань.':'Вибери один або кілька типів тренувань.')+'</p>')+'</section>';
}

let historyDraft=null,historyDraftIndex=-1;
function snapshotExercises(exercises){return exercises.map(e=>({...structuredClone(e),name:e.name||state.library.find(x=>x.id===e.id)?.name||'Вправа',weightMode:exerciseWeightMode(e),loadMode:exerciseWeightMode(e)==='bodyweight'?'bodyweight':undefined}))}
function completedWorkout(){
 const s=session(),h=state.history.find(x=>x.key===key()),t=h||totals(s),index=state.history.findIndex(x=>x.key===key());
 return '<section class="card completed-workout"><span class="badge">Завершено й збережено</span><h2 style="margin-top:18px">'+title(state.kind)+'</h2><p>'+esc(s.date)+' · '+t.done+' виконаних підходів</p><div class="big">'+fmt(t.fact)+' <span>кг</span></div><p>Результат доступний в історії. Можеш виправити його або почати наступне тренування.</p><div class="work-actions" style="margin-top:22px">'+(index>=0?'<button class="secondary" onclick="showWorkoutHistory('+index+')">Відкрити й виправити запис</button>':'')+'<button class="secondary new-workout" onclick="startNewWorkout()">＋ Нове тренування</button><button class="secondary" onclick="tab=\'progress\';render()">Історія й прогрес</button></div></section>';
}
function showWorkoutHistory(index){
 const h=state.history[index];if(!h)return;
 historyDraft=structuredClone(h);historyDraftIndex=index;renderHistoryEditor();
}
function renderHistoryEditor(){
 const h=historyDraft;if(!h)return;
 modal('<form id="history-editor"><h2>Редагування завершеного тренування</h2><p>'+esc(title(h.kind))+' · '+fmt(totals(h).fact)+' кг</p><label>Дата<input required type="date" value="'+esc(h.date)+'" onchange="historyDraft.date=this.value"></label><label class="notes-label">Примітки до тренування<textarea maxlength="5000" oninput="historyDraft.notes=this.value">'+esc(h.notes||'')+'</textarea></label>'+
 h.exercises.map((e,i)=>{
 const name=e.name||state.library.find(x=>x.id===e.id)?.name||'Вправа',pull=exerciseWeightMode(e)==='bodyweight';
 return '<section class="history-exercise"><b>'+esc(name)+'</b><div class="weight-mode-note">'+weightModeLabel(exerciseWeightMode(e))+'</div>'+
 (pull?'<label>Вага тіла, кг<input type="number" min="1" max="400" step="0.5" value="'+(e.bodyWeight??'')+'" oninput="historyDraft.exercises['+i+'].bodyWeight=this.value===\'\'?\'\':Number(this.value)"></label>':'')+
 '<div class="history-set-grid history-set-heading"><span>№</span><span>План кг</span><span>Повтори</span><span>Факт кг</span><span>Повтори</span><span>✓</span><span></span></div>'+
 e.sets.map((s,j)=>'<div class="history-set-grid"><span>'+(j+1)+'</span>'+['pw','pr','fw','fr'].map(k=>'<input aria-label="'+esc(name)+' підхід '+(j+1)+' '+k+'" type="number" required min="'+(k[1]==='w'&&pull?-300:0)+'" max="'+(k[1]==='r'?200:1000)+'" step="'+(k[1]==='r'?1:0.5)+'" value="'+s[k]+'" oninput="historyDraft.exercises['+i+'].sets['+j+'].'+k+'=this.value===\'\'?\'\':Number(this.value)">').join('')+
 '<input type="checkbox" aria-label="Виконано підхід '+(j+1)+'" '+(s.done?'checked':'')+' onchange="historyDraft.exercises['+i+'].sets['+j+'].done=this.checked"><button type="button" aria-label="Видалити підхід '+(j+1)+'" onclick="historyDraft.exercises['+i+'].sets.splice('+j+',1);renderHistoryEditor()">×</button></div>').join('')+
 '<button type="button" class="secondary" onclick="addHistorySet('+i+')">＋ Підхід</button><label class="notes-label">Примітки до вправи<textarea maxlength="3000" oninput="historyDraft.exercises['+i+'].notes=this.value">'+esc(e.notes||'')+'</textarea></label></section>';
 }).join('')+'<button class="primary">Зберегти виправлення</button><button type="button" class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button></form>');
 $('#history-editor').onsubmit=ev=>{ev.preventDefault();saveHistoryEdits()};
}
function addHistorySet(i){
 const a=historyDraft.exercises[i].sets,last=a.at(-1);a.push({pw:last?.pw??0,pr:last?.pr??10,fw:last?.fw??0,fr:last?.fr??10,done:false});renderHistoryEditor();
}
function saveHistoryEdits(){
 clearTimerUndo();
 const draft=historyDraft,old=state.history[historyDraftIndex];if(!draft||!old||old.key!==draft.key)return;
 if(draft.exercises.some(e=>e.sets.some(s=>s.done&&(Number(s.fr)<=0||s.fw===''||s.fr==='')))){toast('Для виконаних підходів вкажи вагу та повтори більше нуля');return}
 const t=totals(draft);
 state.historyRevisions??=[];state.historyRevisions.push({savedAt:new Date().toISOString(),record:structuredClone(old)});
 const updated={...draft,...t,notes:draft.notes||'',exercises:snapshotExercises(draft.exercises),updatedAt:new Date().toISOString()};
 state.history[historyDraftIndex]=updated;
 if(state.sessions[updated.key])state.sessions[updated.key]={...state.sessions[updated.key],date:updated.date,notes:updated.notes,exercises:structuredClone(updated.exercises),finished:true};
 save();$('#dialog').close();render();toast('Виправлення збережено. Прогрес перераховано.');
}
function downloadBackup(){
 const blob=new Blob([JSON.stringify({format:'liftlog-backup-v1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='liftlog-backup-'+localDate()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
preserveHistoryBackup();



function setVolume(e,s){
 return {plan:effectiveLoad(e,s.pw)*Number(s.pr||0),fact:s.done?effectiveLoad(e,s.fw)*Number(s.fr||0):0};
}
function setVolumeText(e,s){
 const v=setVolume(e,s);
 return 'Тоннаж підходу: план <b>'+fmt(v.plan)+' кг</b> <span>·</span> виконано <b>'+fmt(v.fact)+' кг</b>'+(s.done?'':' <small>(після ✓)</small>')+(Number.isFinite(s.restSeconds)?' · Відпочинок '+restClock(s.restSeconds*1000)+(s.restStatus==='stopped'?' ✓':s.restStatus==='paused'?' Ⅱ':' ●'):'');
}
function setVolumeRow(e,s,j){return '<tr class="set-volume-row"><td colspan="6" data-set-volume="'+j+'">'+setVolumeText(e,s)+'</td></tr>'}
function exerciseVolumeSummary(e){
 const v=e.sets.reduce((sum,s)=>{const x=setVolume(e,s);sum.plan+=x.plan;sum.fact+=x.fact;if(s.done)sum.done++;return sum},{plan:0,fact:0,done:0});
 return '<span>Разом за вправу <small>'+v.done+' / '+e.sets.length+' підходів виконано</small></span><span>План <b>'+fmt(v.plan)+' кг</b></span><span>Факт <b>'+fmt(v.fact)+' кг</b></span>';
}
function refreshExerciseVolumes(){
 document.querySelectorAll('[data-exercise]').forEach(block=>{
  const e=session().exercises[Number(block.dataset.exercise)];if(!e)return;
  block.querySelectorAll('[data-set-volume]').forEach(node=>{const s=e.sets[Number(node.dataset.setVolume)];if(s)node.innerHTML=setVolumeText(e,s)});
  const summary=block.querySelector('[data-volume-summary]');if(summary)summary.innerHTML=exerciseVolumeSummary(e);
 });
}


function restElapsed(timer=state.restTimer,now=Date.now()){
 if(!timer)return 0;
 return Math.max(0,Number(timer.elapsedMs||0)+(timer.running?Math.max(0,now-timer.startedAt):0));
}
function restClock(ms){const seconds=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
function restTimeLabel(timestamp){return new Date(timestamp).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function restSet(timer=state.restTimer){
 if(!timer)return null;const s=state.sessions[timer.workoutKey];
 for(const e of s?.exercises||[]){const set=e.sets.find(x=>x.restTimerId===timer.setId);if(set)return set}return null;
}
function recordRest(timer=state.restTimer){
 if(timer?.phase==='work'){recordWork(timer);return}
 const set=restSet(timer);if(!set)return;
 set.restSeconds=Math.floor(restElapsed(timer)/1000);
 set.restStatus=timer.status||(timer.running?'running':'paused');
 set.restStartedAt=timer.firstStartedAt||timer.startedAt;
 if(timer.endedAt)set.restEndedAt=timer.endedAt;else delete set.restEndedAt;
 set.restStopReason=timer.stopReason||'';
}
function completeRest(reason='manual',now=Date.now()){
 const t=state.restTimer;if(!t||t.status==='stopped')return;
 const elapsed=restElapsed(t,now);
 t.elapsedMs=elapsed;
 t.endedAt=now;
 t.running=false;t.status='stopped';t.stopReason=reason;
 recordRest(t);const set=t.phase==='work'?null:restSet(t);
 if(set){set.restLog??=[];set.restLog.push({startedAt:t.firstStartedAt||t.startedAt,endedAt:t.endedAt,seconds:Math.floor(t.elapsedMs/1000),reason})}
 save();
}
let restAudioContext=null;
function enableRestAudio(){
 try{
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return;
 if(!restAudioContext)restAudioContext=new Audio();
 if(restAudioContext.state==='suspended')restAudioContext.resume().catch(()=>{});
 }catch{}
}
let restAlarmOscillator=null;
function restBeep(){
 if(state.restSoundEnabled===false||!restAudioContext||restAudioContext.state!=='running')return;
 try{
  if(restAlarmOscillator){try{restAlarmOscillator.stop()}catch{}}
  const now=restAudioContext.currentTime,duration=3.6;
  const oscillator=restAudioContext.createOscillator(),gain=restAudioContext.createGain();
  oscillator.type='square';
  oscillator.frequency.setValueAtTime(850,now);
  for(let i=0;i<6;i++){
   const at=now+i*.6;
   oscillator.frequency.setValueAtTime(850,at);
   oscillator.frequency.linearRampToValueAtTime(1650,at+.25);
   oscillator.frequency.linearRampToValueAtTime(850,at+.5);
  }
  gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(.36,now+.015);
  gain.gain.setValueAtTime(.36,now+duration-.04);
  gain.gain.linearRampToValueAtTime(0,now+duration);
  oscillator.connect(gain);gain.connect(restAudioContext.destination);
  restAlarmOscillator=oscillator;
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();if(restAlarmOscillator===oscillator)restAlarmOscillator=null};
  oscillator.start(now);oscillator.stop(now+duration);
 }catch{}
}
function toggleRestSound(){
 state.restSoundEnabled=state.restSoundEnabled===false;enableRestAudio();save();renderRestTimer();
}
function testRestSound(){enableRestAudio();if(restAudioContext?.state==='running')restBeep();else restAudioContext?.resume().then(()=>restBeep()).catch(()=>{})}
function restDisplay(t,now=Date.now()){
 const elapsed=restElapsed(t,now),target=(t.targetSeconds||150)*1000;
 if(t.status==='stopped'||t.phase==='work')return restClock(elapsed);
 return elapsed>=target?'+'+restClock(elapsed-target):restClock(target-elapsed);
}
function tickRestTimer(now=Date.now()){
 const t=state.restTimer;if(!t)return;
 const elapsed=restElapsed(t,now),target=(t.targetSeconds||150)*1000;
 if(t.phase!=='work'&&t.running&&elapsed>=target&&!t.targetReached){
  t.targetReached=true;save();restBeep();renderRestTimer();
 }
 const clock=document.querySelector('#rest-clock'),bar=document.querySelector('#rest-progress'),total=document.querySelector('#rest-elapsed');
 if(clock)clock.textContent=restDisplay(t,now);
 if(total)total.textContent=(t.phase==='work'?'Тривалість підходу ':'Загальний відпочинок ')+restClock(elapsed);
 if(bar)bar.style.width=Math.min(100,elapsed/target*100)+'%';
}
function startRestTimer(i,j){
 const pending=state.restTimer,marked=session().exercises[i].sets[j];
 if(pending?.phase==='work'&&pending.status!=='stopped')pending.workSetId=marked.timerUndoId;
 if(pending?.phase!=='work'&&pending?.status!=='stopped'&&pending?.manualSwitch&&pending?.linkedSetId===marked.timerUndoId){recordRest();save();renderRestTimer();return}
 enableRestAudio();
 const now=Date.now();
 if(state.restTimer&&state.restTimer.status!=='stopped'){
  completeRest('next-set',now);
 }
 const e=session().exercises[i],s=e.sets[j];
 s.restTimerId=now+'-'+Math.random().toString(36).slice(2);
 state.restTimer={workoutKey:key(),setId:s.restTimerId,exercise:state.library.find(x=>x.id===e.id)?.name||e.name||'Вправа',setNumber:j+1,firstStartedAt:now,startedAt:now,elapsedMs:0,targetSeconds:state.restTargetSeconds||150,running:true,status:'running',phase:'rest'};
 recordRest();save();renderRestTimer();
}
function pauseRestTimer(){
 const t=state.restTimer;if(!t||t.status==='stopped')return;
 if(t.running){t.elapsedMs=restElapsed(t);t.running=false;t.status='paused'}else{t.startedAt=Date.now();t.running=true;t.status='running'}
 recordRest();save();renderRestTimer();
}
function stopRestTimer(reason='manual'){
 if(!state.restTimer)return;
 completeRest(reason);
 renderRestTimer();
}
function dismissRestTimer(){
 if(state.restTimer?.status!=='stopped')stopRestTimer('manual');
 state.restTimer=null;save();renderRestTimer();
}
function resetRestTimer(){
 enableRestAudio();
 const old=state.restTimer;if(!old)return;
 stopRestTimer('restart');
 const now=Date.now();
 state.restTimer={...old,startedAt:now,firstStartedAt:now,elapsedMs:0,targetSeconds:state.restTargetSeconds||150,running:true,status:'running',endedAt:null,stopReason:'',targetReached:false,minimized:false,phase:'rest'};
 recordRest();save();renderRestTimer();
}
function changeRestTarget(value){
 const n=Number(value);if(![60,90,120,150,180,240,300].includes(n))return;
 state.restTargetSeconds=n;save();
}

function minimizeRestTimer(){
 if(!state.restTimer)return;
 state.restTimer.minimized=true;state.restTimer.mobileExpanded=false;save();renderRestTimer();
}
function expandRestTimer(){if(!state.restTimer)return;enableRestAudio();state.restTimer.minimized=false;state.restTimer.mobileExpanded=true;save();renderRestTimer()}
function renderRestTimer(){
 cleanupFinishedTimer();
 const host=document.querySelector('#rest-timer');if(!host)return;
 const t=state.restTimer;renderWorkStatus();
 if(t?.phase==='work'&&t.status!=='stopped'){host.hidden=true;host.innerHTML='';host.classList.remove('rest-fullscreen','rest-docked');return}
 host.hidden=!t&&!(state.timerUndoStack?.length);
 if(!t){host.innerHTML=state.timerUndoStack?.length?'<b>Таймер закритий</b><button class="rest-undo" onclick="undoTimerAction()">↶ Скасувати останню дію</button>':'';host.classList.remove('rest-fullscreen','rest-docked');host.style.removeProperty('--rest-left');host.style.removeProperty('--rest-width');return}
 const target=(t.targetSeconds||150)*1000,elapsed=restElapsed(t),stopped=t.status==='stopped',overtime=elapsed>=target;
 const dock=window.innerWidth>1000&&tab==='workout'&&!t.minimized;
 const full=window.innerWidth<=1000&&t.mobileExpanded&&!t.minimized&&!stopped;
 host.classList.toggle('rest-fullscreen',full);host.classList.toggle('rest-docked',dock);
 host.dataset.status=stopped?'stopped':!t.running?'paused':t.phase==='work'?'working':overtime?'overtime':'running';
 const work=t.phase==='work';host.dataset.phase=work?'work':'rest';
 const label=stopped?'Відлік завершено':!t.running?'Повна пауза':work?'Підхід виконується':overtime?'Час вийшов — відпочинок триває':'Відпочинок';
 host.innerHTML='<div class="rest-timer-inner"><div class="rest-timer-heading"><b>'+label+'</b>'+
 (stopped?'<button type="button" aria-label="Закрити таймер" onclick="dismissRestTimer()">×</button>':(full||dock)?'<button type="button" aria-label="Згорнути таймер без зупинки" onclick="minimizeRestTimer()">↙ Згорнути</button>':'<button type="button" aria-label="Розгорнути таймер" onclick="expandRestTimer()">↗ Розгорнути</button>')+
 '</div><small>'+esc(t.phase==='work'?(t.workExercise||t.exercise):t.exercise)+' · '+(t.phase==='work'?'підхід ':'після підходу ')+(t.phase==='work'?(t.workSetNumber||'—'):t.setNumber)+'</small>'+
 '<div class="rest-timer-clock" id="rest-clock" role="timer" aria-label="Таймер відпочинку">'+restDisplay(t)+'</div>'+
 '<div id="rest-elapsed" class="rest-elapsed">Загальний відпочинок '+restClock(elapsed)+'</div>'+
 '<div class="rest-progress-track"><div id="rest-progress" style="width:'+Math.min(100,elapsed/target*100)+'%"></div></div>'+
 '<div class="rest-state" role="status">'+(stopped?'✓ Час зафіксовано':!t.running?'Ⅱ Відлік призупинений':work?'● Час підходу рахується':overtime?'Планові '+restClock(target)+' минули. Фактичний час продовжує рахуватися.':'● Плановий відпочинок '+restClock(target))+'</div>'+
 '<small>Початок '+restTimeLabel(t.firstStartedAt||t.startedAt)+(t.endedAt?' · Завершення '+restTimeLabel(t.endedAt):'')+'</small>'+
 '<div class="rest-timer-actions">'+(stopped?'<button type="button" onclick="resetRestTimer()">Новий відлік</button><button type="button" onclick="dismissRestTimer()">Закрити</button>':'<button type="button" class="rest-start-set" onclick="switchChessPhase()">'+(work?'Почати відпочинок':'Почати підхід')+'</button><button type="button" onclick="pauseRestTimer()">'+(t.running?'Повна пауза':'Продовжити')+'</button>')+'</div>'+
 (state.timerUndoStack?.length?'<button type="button" class="rest-undo" onclick="undoTimerAction()">↶ Скасувати: '+esc(state.timerUndoStack.at(-1).label)+'</button>':'')+
 '<div class="rest-audio-controls"><button type="button" onclick="toggleRestSound()">'+(state.restSoundEnabled===false?'Звук: вимкнено':'Звук: увімкнено')+'</button><button type="button" onclick="testRestSound()">Перевірити сирену</button></div>'+
 '<label class="rest-target-label">Наступний відпочинок <select aria-label="Тривалість наступного відпочинку" onchange="changeRestTarget(this.value)">'+[60,90,120,150,180,240,300].map(n=>'<option value="'+n+'" '+(n===(state.restTargetSeconds||150)?'selected':'')+'>'+restClock(n*1000)+'</option>').join('')+'</select></label>'+
 '<small>'+(stopped?'Наступна галочка ✓ запустить новий відпочинок.':'Перемикай «Підхід ↔ Відпочинок». Кожен інтервал зберігається, відлік не переривається.')+'</small></div>';
 syncRestPanel();
}
function syncRestPanel(){
 const host=document.querySelector('#rest-timer');if(!host||!host.classList.contains('rest-docked'))return;
 const column=document.querySelector('.grid>.right');
 if(column){
  const rect=column.getBoundingClientRect(),summary=column.querySelector('.total');
  host.style.setProperty('--rest-left',rect.left+'px');host.style.setProperty('--rest-width',rect.width+'px');
  let top=16;
  if(summary){
   summary.style.setProperty('--summary-left',rect.left+'px');summary.style.setProperty('--summary-width',rect.width+'px');
   top=16+summary.getBoundingClientRect().height+12;
  }
  host.style.setProperty('--rest-top',top+'px');
  host.style.setProperty('--rest-height',Math.max(140,window.innerHeight-top-16)+'px');
 }else{host.classList.remove('rest-docked')}
}
window.addEventListener('resize',()=>renderRestTimer());
window.addEventListener('scroll',()=>syncRestPanel(),{passive:true});

let timerActionDepth=0;
const restFields=['workSeconds','workStatus','workStartedAt','workEndedAt','workLog','restTimerId','restSeconds','restStatus','restStartedAt','restEndedAt','restStopReason','restLog'];
function timerUndoSnapshot(label,doneSet){
 const sets=[];
 for(const [workoutKey,s] of Object.entries(state.sessions)){
  for(const e of s.exercises)for(const set of e.sets){
   set.timerUndoId??='set-'+Date.now()+'-'+Math.random().toString(36).slice(2);
   const rest={};for(const field of restFields)if(Object.hasOwn(set,field))rest[field]=structuredClone(set[field]);
   sets.push({id:set.timerUndoId,workoutKey,rest,...(set===doneSet?{done:set.done,finished:s.finished}:{})});
  }
 }
 return {label,timer:structuredClone(state.restTimer||null),sets};
}
function runTimerAction(label,action,doneSet){
 if(timerActionDepth)return action();
 const before=timerUndoSnapshot(label,doneSet);timerActionDepth++;
 try{
 const result=action(),after=timerUndoSnapshot(label,doneSet);
 if(JSON.stringify(before)!==JSON.stringify(after)){
  state.timerUndoStack??=[];state.timerUndoStack.push(before);
  if(state.timerUndoStack.length>10)state.timerUndoStack.shift();
  save();renderRestTimer();
 }
 return result;
 }finally{timerActionDepth--}
}
function undoTimerAction(){
 cleanupFinishedTimer();
 const stack=state.timerUndoStack||[],snapshot=stack.at(-1);if(!snapshot)return;
 const current=new Map();
 for(const [workoutKey,s] of Object.entries(state.sessions))for(const e of s.exercises)for(const set of e.sets)if(set.timerUndoId)current.set(set.timerUndoId,{set,session:s,workoutKey});
 // Never recreate a deleted set or erase notes, weights, or repetitions.
 if(snapshot.timer&&!snapshot.sets.some(x=>(snapshot.timer.phase==='work'?x.id===snapshot.timer.workSetId:x.rest.restTimerId===snapshot.timer.setId)&&current.has(x.id))){toast('Підхід попереднього таймера вже видалений');return}
 stack.pop();
 for(const entry of snapshot.sets){
  const found=current.get(entry.id);if(!found)continue;
  for(const field of restFields)delete found.set[field];
  Object.assign(found.set,structuredClone(entry.rest));
  if(Object.hasOwn(entry,'done')){found.set.done=entry.done;found.session.finished=entry.finished}
 }
 state.restTimer=structuredClone(snapshot.timer);
 // Keep the original start timestamp: accidental clicks do not erase elapsed rest.
 save();render();renderRestTimer();toast('Скасовано: '+snapshot.label);
}
function clearTimerUndo(){state.timerUndoStack=[]}
const originalToggleSet=toggleSet;
toggleSet=function(i,j){const set=session().exercises[i]?.sets[j];return runTimerAction('галочка підходу',()=>originalToggleSet(i,j),set)};
const originalStartRest=startRestTimer;
startRestTimer=function(i,j){return runTimerAction('запуск відпочинку',()=>originalStartRest(i,j))};
const originalStopRest=stopRestTimer;
stopRestTimer=function(reason='manual'){return runTimerAction('завершення відпочинку',()=>originalStopRest(reason))};
const originalPauseRest=pauseRestTimer;
pauseRestTimer=function(){return runTimerAction('пауза / продовження',()=>originalPauseRest())};
const originalResetRest=resetRestTimer;
resetRestTimer=function(){return runTimerAction('новий відлік',()=>originalResetRest())};
const originalDismissRest=dismissRestTimer;
dismissRestTimer=function(){return runTimerAction('закриття таймера',()=>originalDismissRest())};


function workoutKindTabs(){return '<div class="split workout-kind-tabs">'+workoutKinds.map(kind=>'<button class="'+(state.kind===kind?'selected':'')+'" onclick="setKind(\''+kind+'\')">'+title(kind)+'</button>').join('')+'</div>'}
function addLegWorkoutLibrary(){
 if(state.legsLibraryV1)return;
 const list=[
 {id:20001,name:'Присід зі штангою',group:'legs',weight:0,reps:10,weightMode:'total'},
 {id:20002,name:'Випади з гантелями',group:'legs',weight:0,reps:10,weightMode:'pairSides'}
 ];
 for(const e of list){
  if(state.library.some(x=>!x.deleted&&x.group==='legs'&&x.name.toLowerCase()===e.name.toLowerCase()))continue;
  while(state.library.some(x=>x.id===e.id))e.id++;
  state.library.push(e);
  for(const [id,s] of Object.entries(state.sessions))if(id.startsWith(state.cycle+'-')&&id.includes('-legs')&&!s.finished&&!state.history.some(h=>h.key===id))s.exercises.push(newExercise(e));
 }
 state.legsLibraryV1=true;save();
}
addLegWorkoutLibrary();


function findWorkTarget(t){
 const s=state.sessions[t.workoutKey];if(!s)return null;
 if(t.workSetId)for(const e of s.exercises){const j=e.sets.findIndex(x=>x.timerUndoId===t.workSetId);if(j>=0)return {e,set:e.sets[j],j}}
 const all=s.exercises.flatMap(e=>e.sets.map((set,j)=>({e,set,j}))),anchor=t.phase==='work'?null:restSet(t),start=anchor?all.findIndex(x=>x.set===anchor)+1:0;
 return all.slice(start).find(x=>!x.set.done)||null;
}
function recordWork(t){
 const target=findWorkTarget(t);if(!target)return;
 const set=target.set;
 set.workSeconds=Math.floor(restElapsed(t)/1000);set.workStatus=t.status;
 set.workStartedAt=t.firstStartedAt||t.startedAt;
 if(t.endedAt){set.workEndedAt=t.endedAt;set.workLog??=[];if(!set.workLog.some(x=>x.startedAt===set.workStartedAt&&x.endedAt===t.endedAt))set.workLog.push({startedAt:set.workStartedAt,endedAt:t.endedAt,seconds:set.workSeconds})}
}
function switchChessPhase(){
 return runTimerAction('перемикання підхід / відпочинок',()=>{
  const old=state.restTimer;if(!old||old.status==='stopped')return;
  enableRestAudio();
  const now=Date.now(),wasWork=old.phase==='work',target=findWorkTarget(old);
  completeRest(wasWork?'work-complete':'start-work',now);
  const next={...old,startedAt:now,firstStartedAt:now,elapsedMs:0,running:true,status:'running',phase:wasWork?'rest':'work',endedAt:null,stopReason:'',targetReached:false};
  if(wasWork){
   next.manualSwitch=true;next.workSetId=null;
   next.linkedSetId=target?.set.timerUndoId||null;
   if(target){
    target.set.restTimerId=now+'-'+Math.random().toString(36).slice(2);
    next.setId=target.set.restTimerId;next.setNumber=target.j+1;
    next.exercise=target.e.name||state.library.find(e=>e.id===target.e.id)?.name||'Вправа';
   }else{next.setId=null;next.exercise='Відпочинок';next.setNumber='—'}
   next.targetSeconds=state.restTargetSeconds||150;
  }else{
   next.workSetId=target?.set.timerUndoId||null;
   next.workSetNumber=target?target.j+1:null;
   next.workExercise=target?(target.e.name||state.library.find(e=>e.id===target.e.id)?.name):'Підхід';
  }
  state.restTimer=next;recordRest();save();renderRestTimer();
 });
}


function renderWorkStatus(){
 const host=document.querySelector('#work-timer-status');if(!host)return;
 const t=state.restTimer,active=t?.phase==='work'&&t.status!=='stopped';
 host.hidden=!active;
 host.innerHTML=active?'<span><b>'+(t.running?'● Підхід виконується':'Ⅱ Замір підходу на паузі')+'</b> · '+esc(t.workExercise||'Вправа')+' · підхід '+(t.workSetNumber||'—')+'<small>Введи вагу й повтори та постав ✓ — почнеться відпочинок.</small></span><div><button type="button" onclick="pauseRestTimer()">'+(t.running?'Повна пауза':'Продовжити')+'</button><button type="button" onclick="undoTimerAction()">↶ Скасувати</button></div>':'';
}
function beginWorkTimer(){
 session();
 return runTimerAction('початок заміру підходу',()=>{
 if(state.restTimer?.phase==='work'&&state.restTimer.status!=='stopped'){toast('Замір підходу вже триває');return}
 if(state.restTimer&&state.restTimer.status!=='stopped'){switchChessPhase();return}
 const now=Date.now(),t={workoutKey:key(),setId:null,phase:'work'},target=findWorkTarget(t);
 if(!target){toast('Додай невиконаний підхід для заміру');return}
 state.restTimer={...t,workSetId:target.set.timerUndoId,workSetNumber:target.j+1,workExercise:target.e.name||state.library.find(e=>e.id===target.e.id)?.name||'Вправа',exercise:'',setNumber:target.j+1,firstStartedAt:now,startedAt:now,elapsedMs:0,targetSeconds:state.restTargetSeconds||150,running:true,status:'running'};
 recordWork(state.restTimer);save();renderRestTimer();
 });
}
function measuredInterval(set,prefix){
 const logs=set[prefix+'Log'];
 if(Array.isArray(logs)&&logs.length){
  const seen=new Set();let seconds=0,count=0;
  for(const log of logs){
   const duration=Number(log.seconds),id=String(log.startedAt)+'-'+String(log.endedAt);
   if(seen.has(id)||!Number.isFinite(duration)||duration<=0||!Number.isFinite(Number(log.endedAt)))continue;
   seen.add(id);seconds+=duration;count++;
  }
  return count?seconds:null;
 }
 const seconds=Number(set[prefix+'Seconds']);
 return set[prefix+'Status']==='stopped'&&Number.isFinite(seconds)&&seconds>0?seconds:null;
}
function emptyTimeStats(){return {done:0,workSets:0,restSets:0,pairedSets:0,workSeconds:0,restSeconds:0,pairedSeconds:0,pairedVolume:0,repetitions:0}}
function addTimeStats(a,b){for(const key of Object.keys(a))a[key]+=b[key];return a}
function workoutTimeStats(h){
 const stats=emptyTimeStats();
 for(const e of h.exercises||[])for(const set of e.sets||[]){
  if(!set.done)continue;
  stats.done++;
  const work=measuredInterval(set,'work'),rest=measuredInterval(set,'rest');
  if(work!==null){
   stats.workSets++;stats.workSeconds+=work;
   const sides=['sides','pairSides'].includes(exerciseWeightMode(e))?2:1;
   stats.repetitions+=(Number(set.fr)||0)*sides;
  }
  if(rest!==null){stats.restSets++;stats.restSeconds+=rest}
  if(work!==null&&rest!==null){stats.pairedSets++;stats.pairedSeconds+=work+rest;stats.pairedVolume+=setVolume(e,set).fact}
 }
 return stats;
}
function displayDuration(seconds){return seconds===null?'—':restClock(Math.round(seconds)*1000)}
function timeStatsValues(s){return {
 work:s.workSets?s.workSeconds/s.workSets:null,
 rest:s.restSets?s.restSeconds/s.restSets:null,
 density:s.pairedSeconds?s.pairedVolume/(s.pairedSeconds/60):null,
 reps:s.workSeconds?s.repetitions/(s.workSeconds/60):null
}}
function recordsInTrendWeek(records,w){return records.filter(h=>trendMode==='recent'?h.date>=w.start&&h.date<=w.end:Number(h.cycle)===w.cycle&&Number(h.week)===w.week)}
function analyticsBars(weeks,series){
 const max=Math.max(1,...weeks.flatMap(w=>series.map(s=>w.values[s.key]??0)));
 return '<div class="analytics-chart">'+weeks.map(w=>'<div class="analytics-week"><div class="analytics-bars">'+series.map(s=>{
 const value=w.values[s.key];
 return '<div class="analytics-bar-column"><small>'+(value===null?'—':s.duration?displayDuration(value):fmt(value))+'</small><div class="analytics-bar-space">'+(value===null?'<span>—</span>':'<i class="'+s.className+'" style="height:'+Math.max(1,value/max*100)+'%" title="'+esc(w.label+' · '+s.name)+': '+(s.duration?displayDuration(value):fmt(value))+'"></i>')+'</div></div>';
 }).join('')+'</div><b>'+w.label+'</b><small>'+(w.dateLabel||'')+'</small></div>').join('')+'</div>';
}
function timeAnalytics(){
 const selected=selectedHistory(),weeks=trendWeeks(selected),records=weeks.flatMap(w=>recordsInTrendWeek(selected,w));
 const summary=records.reduce((s,h)=>addTimeStats(s,workoutTimeStats(h)),emptyTimeStats()),v=timeStatsValues(summary);
 const points=weeks.map(w=>{const s=recordsInTrendWeek(selected,w).reduce((sum,h)=>addTimeStats(sum,workoutTimeStats(h)),emptyTimeStats());return {...w,stats:s,values:timeStatsValues(s)}});
 const perWorkout=records.map(h=>({h,stats:workoutTimeStats(h)})).sort((a,b)=>b.h.date.localeCompare(a.h.date));
 return '<section class="card time-analytics"><h2>Час і щільність тренувань</h2><p>Той самий період із шести тижнів і вибрані типи тренувань.</p><div class="time-metrics">'+
 '<div><small>Середній відпочинок</small><b>'+displayDuration(v.rest)+'</b><small>'+summary.restSets+' із '+summary.done+' підходів із заміром відпочинку</small></div>'+
 '<div><small>Середній підхід</small><b>'+displayDuration(v.work)+'</b><small>'+summary.workSets+' із '+summary.done+' підходів із заміром роботи</small></div>'+
 '<div><small>Щільність роботи</small><b>'+(v.density===null?'—':fmt(v.density)+' кг/хв')+'</b><small>'+summary.pairedSets+' підходів із заміром роботи й відпочинку</small></div>'+
 '<div><small>Темп повторів</small><b>'+(v.reps===null?'—':fmt(v.reps)+' / хв')+'</b><small>За хвилину роботи; дві сторони враховані</small></div></div>'+
 '<div class="analytics-sections"><section><h3>Середній час: підхід і відпочинок</h3><div class="chart-legend"><span>🟦 Підхід</span><span>🟩 Відпочинок</span></div>'+analyticsBars(points,[{key:'work',name:'Середній підхід',duration:true,className:'work-bar'},{key:'rest',name:'Середній відпочинок',duration:true,className:'rest-bar'}])+'</section>'+
 '<section><h3>Тоннаж за хвилину · кг/хв</h3><p>Час роботи + відпочинок лише для підходів із обома замірами.</p>'+analyticsBars(points,[{key:'density',name:'Кг за хвилину',duration:false,className:'density-bar'}])+'</section></div>'+
 '<p class="analytics-note">Повну паузу виключено. Відпочинок понад 2:30 враховано. Відсутній або нульовий замір не вважається нульовим результатом. Старі тренування без таймера залишаються без часових показників. Кг/хв показує щільність роботи, а не якість тренування.</p>'+
 (perWorkout.length?'<details class="time-workout-details"><summary>Часова статистика за кожне тренування</summary><div class="time-table-scroll"><table class="wide-table"><tr><th>ДАТА / ТРЕНУВАННЯ</th><th>ПАУЗА</th><th>ПІДХІД</th><th>КГ/ХВ</th><th>ПОВТ./ХВ</th><th>ЗАМІРИ</th></tr>'+perWorkout.map(({h,stats})=>{const v=timeStatsValues(stats);return '<tr><td>'+esc(h.date)+'<small>'+esc(title(h.kind))+'</small></td><td>'+displayDuration(v.rest)+'</td><td>'+displayDuration(v.work)+'</td><td>'+(v.density===null?'—':fmt(v.density))+'</td><td>'+(v.reps===null?'—':fmt(v.reps))+'</td><td>Робота '+stats.workSets+'/'+stats.done+'<small>Відпочинок '+stats.restSets+'/'+stats.done+'</small></td></tr>'}).join('')+'</table></div></details>':'')+'</section>';
}


function cleanupFinishedTimer(){
 const last=state.timerUndoStack?.at(-1);
 const owner=state.restTimer?.workoutKey||last?.timer?.workoutKey;
 const finishedOwner=owner&&state.sessions[owner]?.finished;
 const finishedCurrent=!state.restTimer&&state.sessions[key()]?.finished;
 if((finishedOwner||finishedCurrent)&&(state.restTimer||state.timerUndoStack?.length)){
  state.restTimer=null;state.timerUndoStack=[];save();
 }
}


let planKind='back',planCycle=null;
function planExerciseFromHistory(e){
 const library=state.library.find(x=>x.id===e.id);
 const oldMode=exerciseWeightMode(e),mode=library?.weightMode||oldMode;
 const ratio=oldMode==='bodyweight'||mode==='bodyweight'?1:weightMultiplier(oldMode)/weightMultiplier(mode);
 return {
  uid:'plan-'+Date.now()+'-'+Math.random().toString(36).slice(2),id:e.id,name:e.name||library?.name||'Вправа',
  weightMode:mode,loadMode:mode==='bodyweight'?'bodyweight':undefined,bodyWeight:e.bodyWeight||'',
  notes:'',overrides:{},
  sets:e.sets.filter(s=>s.done).map(s=>({pw:Number(s.fw)*ratio,pr:Number(s.fr)}))
 };
}
function plannerRoot(){
 state.macroPlans??={};
 const id=String(planCycle??state.cycle);
 if(!state.macroPlans[id]){
  const latest=state.history.map((h,index)=>({h,index})).sort((a,b)=>b.h.date.localeCompare(a.h.date)||b.index-a.index).slice(0,2).map(x=>x.h);
  const root={id:Number(id),createdAt:new Date().toISOString(),workouts:{}};
  for(const kind of workoutKinds)root.workouts[kind]={weightStep:0,repStep:0,rounding:.5,exercises:[],source:null};
  // Seed each type once using the most recent of the last two records.
  for(const h of latest){
   const p=root.workouts[h.kind];if(!p||p.source)continue;
   p.exercises=(h.exercises||[]).map(planExerciseFromHistory).filter(e=>e.sets.length);
   p.source={date:h.date,key:h.key,fact:h.fact};
  }
  state.macroPlans[id]=root;
 }
 return state.macroPlans[id];
}
function plannerWorkout(){return plannerRoot().workouts[planKind]}
function planSets(e,week,p=plannerWorkout()){
 if(week>0&&e.overrides?.[week])return structuredClone(e.overrides[week]);
 const step=Number(p.weightStep)||0,reps=Number(p.repStep)||0,rounding=Number(p.rounding)||.5;
 return e.sets.map(s=>{
 const base=Number(s.pw)||0;
 const weight=week===0||step===0||e.weightMode==='bodyweight'?base:Math.round(base*(1+week*step/100)/rounding)*rounding;
 return {pw:Math.min(1000,Math.max(e.weightMode==='bodyweight'?-300:0,Number(weight.toFixed(3)))),pr:Math.min(200,Math.max(1,(Number(s.pr)||1)+week*reps))};
 });
}
function planVolume(e,sets){
 return sets.reduce((sum,s)=>sum+effectiveLoad(e,s.pw)*s.pr,0);
}
function planWeekVolume(p,week){return p.exercises.reduce((sum,e)=>sum+planVolume(e,planSets(e,week,p)),0)}

function progressionReference(){
 const reps=[[8,7,6],[9,8,7],[10,9,8],[11,10,9],[12,11,10],[12,12,12]];
 return '<section class="card progression-reference"><div class="row"><div><span class="eyebrow">ТВОЯ СХЕМА-ОРІЄНТИР ІЗ КАРТИНКИ</span><h2>Прогресія повторів за 6 тижнів</h2></div><span class="badge">Орієнтир для повторів у плані</span></div><p>Три числа — орієнтир для трьох робочих підходів однієї вправи, після розминки.</p><div class="reference-weeks">'+reps.map((r,i)=>'<div><small>Тиждень '+(i+1)+'</small><b>'+r.join(' · ')+'</b><span>повторів</span></div>').join('')+'</div><div class="reference-notes"><p><b>Робоча вага:</b> на картинці не зазначена. Варіант зі сталою вагою протягом циклу та її підвищенням після 12 · 12 · 12 — наша інтерпретація, а не підпис автора.</p><p><b>Як працює план:</b> повтори збільшуються від бази першого тижня за цією схемою. Вагу ти задаєш вручну, а наступні тижні успадковують її до наступної поправки.</p><p><b>Важливо для планування:</b> на шостому тижні підходи з базою менш ніж 12 автоматично отримують 12 повторів. Базові 12 або більше не зменшуються.</p></div></section>';
}


function initializeLinkedPlan(p){
 if(p.linkedPlanningVersion===1)return;
 const old=structuredClone(p);
 p.exercises.forEach((e,i)=>{
  e.chainWeights={};e.chainReps={};e.chainCounts={};
  for(let week=1;week<6;week++){
   const oldSets=planSets(old.exercises[i],week,old),explicit=!!old.exercises[i].overrides?.[week];
   if(explicit&&oldSets.length!==e.sets.length)e.chainCounts[week]=oldSets.length;
   oldSets.forEach((s,j)=>{
    const base=e.sets[j]||e.sets.at(-1)||{pw:0,pr:10};
    if(Number(s.pw)!==Number(base.pw)){e.chainWeights[week]??={};e.chainWeights[week][j]=Number(s.pw)}
    if(explicit){e.chainReps[week]??={};e.chainReps[week][j]=Number(s.pr)}
   });
  }
 });
 p.linkedPlanningVersion=1;
}
function linkedPlanSets(e,week){
 const count=week===0?e.sets.length:(e.chainCounts?.[week]??e.sets.length);
 return Array.from({length:count},(_,j)=>{
  const base=e.sets[j]||e.sets.at(-1)||{pw:0,pr:10};
  let weight=Number(base.pw)||0;
  for(let w=1;w<=week;w++)if(Object.hasOwn(e.chainWeights?.[w]||{},j))weight=Number(e.chainWeights[w][j]);
  const baseReps=Number(base.pr)||1;
  const auto=week===0?baseReps:baseReps>=12?baseReps:week===5?12:Math.min(12,baseReps+week);
  const reps=Object.hasOwn(e.chainReps?.[week]||{},j)?Number(e.chainReps[week][j]):auto;
  return {pw:weight,pr:reps};
 });
}
function latestPlannerHistory(){
 return state.history.map((h,index)=>({h,index})).filter(x=>x.h.kind===planKind).sort((a,b)=>b.h.date.localeCompare(a.h.date)||b.index-a.index)[0]?.h||null;
}
function previousExerciseReference(e,h){
 if(!h)return null;
 const source=(h.exercises||[]).find(x=>x.id===e.id||(x.name&&x.name===e.name));if(!source)return null;
 const ratio=exerciseWeightMode(source)==='bodyweight'||e.weightMode==='bodyweight'?1:weightMultiplier(exerciseWeightMode(source))/weightMultiplier(e.weightMode);
 const sets=(source.sets||[]).filter(s=>s.done).map(s=>({pw:Number(s.fw)*ratio,pr:Number(s.fr)}));
 return sets.length?sets:null;
}
function inlineWeekVolume(p,week){return p.exercises.reduce((sum,e)=>sum+planVolume(e,linkedPlanSets(e,week)),0)}
function inlineWeekChange(p,week){
 if(!week)return 'База першого тижня';
 const previous=inlineWeekVolume(p,week-1),current=inlineWeekVolume(p,week);
 if(!previous)return 'Порівняння після заповнення';
 const difference=current-previous;
 return (difference>=0?'+':'')+fmt(difference)+' кг · '+(difference>=0?'+':'')+fmt(difference/previous*100)+'% до попереднього';
}
function planning(){
 const root=plannerRoot(),p=plannerWorkout();initializeLinkedPlan(p);
 const ids=Object.keys(state.macroPlans).map(Number).sort((a,b)=>a-b),history=latestPlannerHistory();
 return '<section class="card planning-intro"><div class="row"><div><span class="eyebrow">МАКРОПЛАН · ШІСТЬ КОЛОНОК</span><p>Редагуй прямо в тижнях. Вага переходить праворуч до наступної ручної поправки. Історія й поточне тренування не змінюються.</p></div><div class="plan-toolbar"><select aria-label="Макроплан" onchange="planCycle=Number(this.value);render()">'+ids.map(id=>'<option value="'+id+'" '+(root.id===id?'selected':'')+'>Макроплан '+id+'</option>').join('')+'</select><button class="secondary" onclick="newMacroPlan()">＋ Новий план</button></div></div></section>'+progressionReference()+
 '<div class="split workout-kind-tabs">'+workoutKinds.map(kind=>'<button class="'+(planKind===kind?'selected':'')+'" onclick="planKind=\''+kind+'\';render()">'+title(kind)+'</button>').join('')+'</div>'+
 '<section class="card inline-planner"><div class="row"><div><h2>Шість тижнів · '+esc(title(planKind))+'</h2><p>'+(history?'Останнє завершене тренування: '+esc(history.date)+' · '+fmt(history.fact)+' кг. Фактичні значення показані біля першого тижня.':'Для цього типу ще немає завершених тренувань. Можна додати вправи з бібліотеки.')+'</p></div><div class="plan-toolbar"><button class="secondary" onclick="addInlinePlannerExercise()">＋ Вправа</button></div></div>'+
 '<div class="note inline-plan-rules">Повтори: від першого тижня +1 щотижня до 12, на шостому — 12. Наприклад, 8 · 7 · 6 → 9 · 8 · 7 → 10 · 9 · 8 → 11 · 10 · 9 → 12 · 11 · 10 → 12 · 12 · 12. Якщо в базі вже 12 або більше, кількість не зменшується. Окремі повтори можна виправити вручну. Тоннаж показує обсяг, а не оцінку якості тренування.</div>'+
 '<div class="inline-plan-scroll"><div class="inline-plan-grid">'+
 Array.from({length:6},(_,w)=>'<div class="inline-week-heading"><b>Тиждень '+(w+1)+'</b><strong data-inline-week-total="'+w+'">'+fmt(inlineWeekVolume(p,w))+' кг</strong><small data-inline-week-change="'+w+'">'+inlineWeekChange(p,w)+'</small></div>').join('')+
 p.exercises.map((e,i)=>{
 const old=previousExerciseReference(e,history);
 return Array.from({length:6},(_,w)=>{
 const sets=linkedPlanSets(e,w);
 return '<section class="inline-exercise-cell" data-inline-cell="'+i+'-'+w+'"><div class="inline-exercise-name">'+esc(e.name)+'</div><small class="inline-mode">'+esc(weightModeLabel(e.weightMode))+'</small>'+
 '<div class="inline-reference '+(w?'inline-reference-spacer':'')+'">'+(old?'Було '+old.map(s=>fmt(s.pw)+' × '+s.pr).join(' · ')+'<small>Найбільша вага: '+fmt(Math.max(...old.map(s=>s.pw)))+' кг</small>':'Немає попереднього запису цієї вправи')+'</div>'+
 (e.weightMode==='bodyweight'?'<label class="inline-body-weight">Вага тіла, кг <input type="number" min="1" max="400" step="any" data-inline-bodyweight="'+i+'" value="'+(e.bodyWeight||'')+'" '+(w?'disabled':'')+' oninput="inlineBodyWeight('+i+',this)" aria-label="Вага тіла для '+esc(e.name)+'"></label>':'')+
 '<div class="inline-set-labels"><span>№</span><span>Кг</span><span>Повтори</span></div>'+
 sets.map((s,j)=>'<div class="inline-plan-set"><span>'+(j+1)+'</span><input type="number" min="'+(e.weightMode==='bodyweight'?-300:0)+'" max="1000" step="any" value="'+s.pw+'" data-inline-input="weight" data-inline-exercise="'+i+'" data-inline-week="'+w+'" data-inline-set="'+j+'" aria-label="'+esc(e.name)+' тиждень '+(w+1)+' підхід '+(j+1)+' вага" oninput="changeInlinePlan('+i+','+w+','+j+',\'pw\',this)"><input type="number" min="1" max="200" step="1" value="'+s.pr+'" data-inline-input="reps" data-inline-exercise="'+i+'" data-inline-week="'+w+'" data-inline-set="'+j+'" aria-label="'+esc(e.name)+' тиждень '+(w+1)+' підхід '+(j+1)+' повтори" oninput="changeInlinePlan('+i+','+w+','+j+',\'pr\',this)"></div>').join('')+
 '<div class="inline-plan-set-actions"><button onclick="addInlinePlanSet('+i+','+w+')">＋ Підхід</button>'+(sets.length?'<button onclick="removeInlinePlanSet('+i+','+w+')" aria-label="Прибрати останній підхід">−</button>':'')+'</div>'+
 '<div class="inline-exercise-volume" data-inline-exercise-total="'+i+'-'+w+'">'+fmt(planVolume(e,sets))+' кг</div>'+
 (w?'<button class="inline-inherit" onclick="resetInlineWeight('+i+','+w+')">↶ Вага з попереднього</button>':'<button class="plan-remove" onclick="removePlannerExercise('+i+')">Прибрати вправу</button>')+'</section>';
 }).join('');
 }).join('')+
 '</div></div>'+(!p.exercises.length?'<div class="empty">Додай вправу, щоб заповнити шість тижнів.</div>':'')+
 '<label class="notes-label">Примітки до макроплану<textarea maxlength="5000" oninput="plannerRoot().notes=this.value;save()">'+esc(root.notes||'')+'</textarea></label></section>';
}
function changeInlinePlan(index,week,setIndex,field,el){
 const p=plannerWorkout(),e=p.exercises[index];if(!e)return;
 const value=Number(el.value);
 if(el.value===''||!Number.isFinite(value)||value<(field==='pw'?(e.weightMode==='bodyweight'?-300:0):1)||value>(field==='pw'?1000:200)||(field==='pr'&&!Number.isInteger(value)))return;
 if(week===0){if(!e.sets[setIndex])return;e.sets[setIndex][field]=value}
 else{const map=field==='pw'?e.chainWeights:e.chainReps;map[week]??={};map[week][setIndex]=value}
 save();refreshInlinePlanner(el);
}
function refreshInlinePlanner(activeInput){
 const p=plannerWorkout();
 document.querySelectorAll('[data-inline-bodyweight]').forEach(input=>{if(input!==activeInput)input.value=p.exercises[Number(input.dataset.inlineBodyweight)]?.bodyWeight||''});
 document.querySelectorAll('[data-inline-input]').forEach(input=>{
 if(input===activeInput)return;
 const e=p.exercises[Number(input.dataset.inlineExercise)],w=Number(input.dataset.inlineWeek),j=Number(input.dataset.inlineSet);
 const set=e&&linkedPlanSets(e,w)[j];if(set)input.value=input.dataset.inlineInput==='weight'?set.pw:set.pr;
 });
 document.querySelectorAll('[data-inline-week-total]').forEach(node=>{const w=Number(node.dataset.inlineWeekTotal);node.textContent=fmt(inlineWeekVolume(p,w))+' кг'});
 document.querySelectorAll('[data-inline-week-change]').forEach(node=>{const w=Number(node.dataset.inlineWeekChange);node.textContent=inlineWeekChange(p,w)});
 document.querySelectorAll('[data-inline-exercise-total]').forEach(node=>{const [i,w]=node.dataset.inlineExerciseTotal.split('-').map(Number),e=p.exercises[i];if(e)node.textContent=fmt(planVolume(e,linkedPlanSets(e,w)))+' кг'});
}
function addInlinePlanSet(index,week){
 const e=plannerWorkout().exercises[index],sets=linkedPlanSets(e,week),s=sets.at(-1)||{pw:0,pr:10};
 if(week===0)e.sets.push({...s});
 else{const j=sets.length;e.chainCounts[week]=j+1;e.chainWeights[week]??={};e.chainReps[week]??={};e.chainWeights[week][j]=s.pw;e.chainReps[week][j]=s.pr}
 save();render();
}
function removeInlinePlanSet(index,week){
 const e=plannerWorkout().exercises[index],sets=linkedPlanSets(e,week);if(!sets.length)return;
 if(week===0){
 const j=e.sets.length-1;e.sets.pop();
 for(const w of Object.keys(e.chainWeights))delete e.chainWeights[w][j];
 for(const w of Object.keys(e.chainReps))delete e.chainReps[w][j];
 }else{e.chainCounts[week]=sets.length-1;delete e.chainWeights?.[week]?.[sets.length-1];delete e.chainReps?.[week]?.[sets.length-1]}
 save();render();
}
function resetInlineWeight(index,week){delete plannerWorkout().exercises[index].chainWeights[week];save();refreshInlinePlanner()}
function inlineBodyWeight(index,el){
 if(el.value===''){plannerWorkout().exercises[index].bodyWeight='';save();refreshInlinePlanner();return}
 const value=Number(el.value);if(!Number.isFinite(value)||value<=0||value>400)return;
 plannerWorkout().exercises[index].bodyWeight=value;save();refreshInlinePlanner();
}
function addInlinePlannerExercise(){
 const available=state.library.filter(e=>!e.deleted);if(!available.length){toast('Додай вправу в бібліотеці');return}
 const area=document.querySelector('.inline-planner .plan-toolbar');
 if(area.querySelector('[data-inline-library]'))return;
 const select=document.createElement('select');select.dataset.inlineLibrary='true';select.setAttribute('aria-label','Вправа для макроплану');
 select.innerHTML='<option value="">Обери вправу…</option>'+available.map(e=>'<option value="'+e.id+'">'+esc(title(e.group)+' · '+e.name)+'</option>').join('');
 select.onchange=()=>{
 const e=available.find(x=>x.id===Number(select.value));if(!e)return;
 plannerWorkout().exercises.push({uid:'plan-'+Date.now()+'-'+Math.random().toString(36).slice(2),id:e.id,name:e.name,weightMode:e.weightMode||'total',bodyWeight:'',sets:Array.from({length:3},()=>({pw:e.weight,pr:e.reps})),chainWeights:{},chainReps:{},chainCounts:{},notes:''});
 save();render();
 };area.append(select);select.focus();
}
function setPlanProgression(field,el){
 const value=Number(el.value),limits={weightStep:[-20,50],repStep:[-10,20],rounding:[.25,5]};
 if(el.value===''||!Number.isFinite(value)||value<limits[field][0]||value>limits[field][1]||(field==='repStep'&&!Number.isInteger(value))){return}
 plannerWorkout()[field]=value;save();refreshPlannerPreview();
}

function refreshPlannerPreview(){
 const current=document.querySelector('.plan-six-weeks');if(!current)return;
 const temp=document.createElement('div');temp.innerHTML=planning();
 const next=temp.querySelector('.plan-six-weeks');if(next)current.replaceChildren(...next.childNodes);
}

function editPlannerExercise(index,week){
 const p=plannerWorkout(),e=p.exercises[index];if(!e)return;
 const draft=planSets(e,week,p);
 modal('<form id="planner-set-form"><h2>'+esc(e.name)+'</h2><p>Тиждень '+(week+1)+(week===0?' · зміни бази оновлять автоматичні тижні':' · окрема ручна поправка')+'</p><small>'+esc(weightModeLabel(e.weightMode))+'</small>'+(e.weightMode==='bodyweight'?'<label>Вага тіла для планового тоннажу, кг<input id="planner-body-weight" type="number" min="1" max="400" step="any" value="'+(e.bodyWeight||'')+'"></label>':'')+'<div id="planner-set-inputs"></div><button type="button" class="secondary" id="planner-add-set">＋ Підхід</button>'+(week>0?'<button type="button" class="secondary" id="planner-skip-exercise">Не виконувати цього тижня</button>':'')+'<label class="notes-label">Примітки до вправи в плані<textarea id="planner-exercise-note" maxlength="3000">'+esc(e.notes||'')+'</textarea></label><button class="primary">Зберегти план</button><button type="button" class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button></form>');
 function draw(){
 const node=$('#planner-set-inputs');node.innerHTML=draft.map((s,j)=>'<div class="planner-set-row"><span>'+(j+1)+'</span><label>Вага, кг<input required type="number" data-plan-weight="'+j+'" min="'+(e.weightMode==='bodyweight'?-300:0)+'" max="1000" step="any" value="'+s.pw+'"></label><label>Повтори<input required type="number" data-plan-reps="'+j+'" min="1" max="200" step="1" value="'+s.pr+'"></label><button type="button" data-plan-delete="'+j+'" aria-label="Прибрати підхід '+(j+1)+'">×</button></div>').join('');
 node.querySelectorAll('[data-plan-weight]').forEach(input=>input.oninput=()=>draft[Number(input.dataset.planWeight)].pw=input.value===''?'':Number(input.value));
 node.querySelectorAll('[data-plan-reps]').forEach(input=>input.oninput=()=>draft[Number(input.dataset.planReps)].pr=input.value===''?'':Number(input.value));
 node.querySelectorAll('[data-plan-delete]').forEach(button=>button.onclick=()=>{draft.splice(Number(button.dataset.planDelete),1);draw()});
 }
 draw();
 $('#planner-add-set').onclick=()=>{draft.push({...draft.at(-1)||{pw:0,pr:10}});draw()};
 if(week>0)$('#planner-skip-exercise').onclick=()=>{draft.splice(0);draw()};
 $('#planner-set-form').onsubmit=ev=>{
 ev.preventDefault();
 if(draft.some(s=>!Number.isFinite(s.pw)||s.pw<(e.weightMode==='bodyweight'?-300:0)||s.pw>1000||!Number.isInteger(s.pr)||s.pr<1||s.pr>200)){toast('Перевір вагу та повтори');return}
 if(week===0)e.sets=structuredClone(draft);else{e.overrides??={};e.overrides[week]=structuredClone(draft)}
 e.notes=$('#planner-exercise-note').value;if(e.weightMode==='bodyweight')e.bodyWeight=$('#planner-body-weight').value===''?'':Number($('#planner-body-weight').value);
 save();$('#dialog').close();render();
 };
}
function removePlannerExercise(index){plannerWorkout().exercises.splice(index,1);save();render()}
function addPlannerExercise(){
 const available=state.library.filter(e=>!e.deleted);
 if(!available.length){toast('Додай вправи в «Мої вправи»');return}
 modal('<h2>Додати вправу в план</h2><select id="planner-library-choice">'+available.map(e=>'<option value="'+e.id+'" '+(e.group===planKind?'':'')+'>'+esc(title(e.group)+' · '+e.name)+'</option>').join('')+'</select><button class="primary" id="planner-library-add">Додати</button><button class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button>');
 const preferred=available.find(e=>e.group===planKind);if(preferred)$('#planner-library-choice').value=String(preferred.id);
 $('#planner-library-add').onclick=()=>{
 const e=available.find(x=>x.id===Number($('#planner-library-choice').value));if(!e)return;
 plannerWorkout().exercises.push({uid:'plan-'+Date.now()+'-'+Math.random().toString(36).slice(2),id:e.id,name:e.name,weightMode:e.weightMode||'total',bodyWeight:'',sets:Array.from({length:3},()=>({pw:e.weight,pr:e.reps})),overrides:{},notes:''});
 save();$('#dialog').close();render();
 };
}
function choosePlannerHistory(){
 const records=state.history.map((h,index)=>({h,index})).filter(x=>x.h.kind===planKind).sort((a,b)=>b.h.date.localeCompare(a.h.date)||b.index-a.index);
 if(!records.length){toast('В історії ще немає '+title(planKind));return}
 modal('<h2>Взяти перший тиждень з історії</h2><p>Це замінить лише базу цього типу в макроплані. Саме тренування й історія не зміняться.</p><select id="planner-history-choice">'+records.map(({h,index})=>'<option value="'+index+'">'+esc(h.date)+' · '+fmt(h.fact)+' кг</option>').join('')+'</select><button class="primary" id="planner-history-use">Використати як базу</button><button class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button>');
 $('#planner-history-use').onclick=()=>{
 const h=state.history[Number($('#planner-history-choice').value)],p=plannerWorkout();
 p.exercises=(h.exercises||[]).map(planExerciseFromHistory).filter(e=>e.sets.length);p.source={date:h.date,key:h.key,fact:h.fact};
 save();$('#dialog').close();render();
 };
}
function resetPlannerOverrides(){
 modal('<h2>Скинути ручні поправки?</h2><p>Тижні 2–6 цього типу знову рахуватимуться автоматично від бази. Історія тренувань не зміниться.</p><button class="primary" id="planner-reset-overrides">Скинути поправки</button><button class="secondary" onclick="document.querySelector(\'#dialog\').close()">Скасувати</button>');
 $('#planner-reset-overrides').onclick=()=>{plannerWorkout().exercises.forEach(e=>e.overrides={});save();$('#dialog').close();render()};
}
function newMacroPlan(){
 const current=plannerRoot();state.macroPlans??={};
 const id=Math.max(...Object.keys(state.macroPlans).map(Number),Number(state.cycle))+1;
 const copy=structuredClone(current);copy.id=id;copy.createdAt=new Date().toISOString();state.macroPlans[String(id)]=copy;planCycle=id;save();render();
}

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

setInterval(()=>tickRestTimer(),250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderRestTimer()});
renderRestTimer();

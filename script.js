// ══════════════════════════════════════════════════════════════
//  ASEM — ARK Stat & Evolution Manager
//  Application behavior and UI logic. Dinosaur data lives in data.js.
// ══════════════════════════════════════════════════════════════

// ─── STORAGE ──────────────────────────────────────────────────
const STORAGE_KEY = 'asem_lines_v2';
function loadLines() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveLines() { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); }

// ─── STATE ────────────────────────────────────────────────────
let lines = loadLines();
if (!lines.length) lines = [newLine()];

function newLine() {
  return {
    id: Date.now() + Math.random(),
    name: 'New Breeding Line',
    dino: '',
    targetStat: 'Melee',
    fatherStats: {health:0,stamina:0,oxygen:0,food:0,weight:0,melee:0},
    motherStats: {health:0,stamina:0,oxygen:0,food:0,weight:0,melee:0},
    targets: {
      health:{fM:0,mM:0}, stamina:{fM:0,mM:0}, oxygen:{fM:0,mM:0},
      food:{fM:0,mM:0},   weight:{fM:0,mM:0},  melee:{fM:0,mM:0},
    },
    checkVal:'', mutStack:0, mutMax:20, notes:'', collapsed:false,
  };
}

// ─── PAGE SWITCH ──────────────────────────────────────────────
function switchPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelector(`.nav-tab[data-page="${id}"]`).classList.add('active');
}

// ─── HELPERS ──────────────────────────────────────────────────
function el(tag,cls,html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!==undefined)e.innerHTML=html; return e; }
function qs(sel,root){ return (root||document).querySelector(sel); }

// ─── MUTATION HELPER ──────────────────────────────────────────
function renderLines() {
  const container = document.getElementById('lines-container');
  container.innerHTML = '';
  lines.forEach(line => container.appendChild(buildLineCard(line)));
}

function buildLineCard(line) {
  const card = el('div','line-card');
  card.dataset.id = line.id;

  const hdr  = el('div','line-header');
  const left = el('div','line-header-left');
  const colBtn = el('button','collapse-btn', line.collapsed?'▶':'▼');
  if(line.collapsed) colBtn.classList.add('collapsed');
  colBtn.onclick = () => { line.collapsed=!line.collapsed; saveLines(); renderLines(); };
  const titleEl = el('span','line-title', line.name||'Breeding Line');
  titleEl.contentEditable=true; titleEl.spellcheck=false;
  titleEl.oninput = () => { line.name=titleEl.innerText.trim(); saveLines(); };
  left.appendChild(colBtn); left.appendChild(titleEl);

  const delBtn = el('button','btn btn-danger btn-sm','✕');
  delBtn.onclick = () => { lines=lines.length===1?[newLine()]:lines.filter(l=>l.id!==line.id); saveLines(); renderLines(); };
  hdr.appendChild(left); hdr.appendChild(delBtn);
  card.appendChild(hdr);

  const body = el('div','line-body');
  if(line.collapsed){ body.style.display='none'; card.appendChild(body); return card; }

  body.appendChild(buildDinoPicker(line));

  const tsRow = el('div','target-stat-row');
  tsRow.innerHTML='<label>Mutation Target Stat:</label>';
  const tsSel = el('select','');
  ['Health','Stamina','Oxygen','Food','Weight','Melee'].forEach(s=>{
    const o=el('option','',s); o.value=s; if(s===line.targetStat)o.selected=true; tsSel.appendChild(o);
  });
  tsSel.onchange=()=>{ line.targetStat=tsSel.value; saveLines(); renderLines(); };
  tsRow.appendChild(tsSel); body.appendChild(tsRow);

  body.appendChild(buildStatBlock(line,'FATHER STATS','fatherStats'));
  body.appendChild(buildStatBlock(line,'MOTHER STATS','motherStats'));
  body.appendChild(buildTargets(line));
  body.appendChild(buildMutCheck(line));
  body.appendChild(buildStack(line));

  const noteWrap=el('div','notes-wrap');
  const ta=el('textarea','');
  ta.placeholder='e.g. Gen 5 melee line, keep babies above 350…'; ta.value=line.notes||'';
  ta.oninput=()=>{ line.notes=ta.value; saveLines(); };
  noteWrap.appendChild(ta); body.appendChild(noteWrap);
  card.appendChild(body);
  return card;
}

function buildDinoPicker(line){
  const wrap=el('div','');
  const sw=el('div','dino-search-wrap');
  const si=el('input',''); si.type='text'; si.placeholder='Search dinos…';
  sw.appendChild(el('span','search-icon','🔍')); sw.appendChild(si); wrap.appendChild(sw);
  const grid=el('div','dino-grid'); let filtered=UNIQUE_DINOS;
  function renderChips(){
    grid.innerHTML='';
    filtered.forEach(d=>{
      const chip=el('span','dino-chip',d.name);
      if(line.dino===d.name) chip.classList.add('selected');
      chip.onclick=()=>{ line.dino=(line.dino===d.name)?'':d.name; saveLines(); renderLines(); };
      grid.appendChild(chip);
    });
  }
  renderChips();
  si.oninput=()=>{ const q=si.value.toLowerCase(); filtered=q?UNIQUE_DINOS.filter(d=>d.name.toLowerCase().includes(q)):UNIQUE_DINOS; renderChips(); };
  wrap.appendChild(grid); return wrap;
}

function buildStatBlock(line,title,key){
  const sec=el('div',''); sec.appendChild(el('div','stat-section-title',title));
  const grid=el('div','stat-grid');
  ['health','stamina','oxygen','food','weight','melee'].forEach((sk,i)=>{
    const f=el('div','stat-field'); f.appendChild(el('label','',['Health','Stamina','Oxygen','Food','Weight','Melee'][i]));
    const inp=el('input',''); inp.type='number'; inp.min='0'; inp.value=line[key][sk]||0;
    inp.oninput=()=>{ line[key][sk]=+inp.value; saveLines(); };
    f.appendChild(inp); grid.appendChild(f);
  });
  sec.appendChild(grid); return sec;
}

function buildTargets(line){
  const sec=el('div',''); sec.appendChild(el('div','stat-section-title','MUTATION TARGETS (+2 LEVELS)'));
  const grid=el('div','targets-grid');
  ['health','stamina','oxygen','food','weight','melee'].forEach((sk,i)=>{
    const ti=el('div','target-item');
    if(line.targetStat.toLowerCase()===sk) ti.classList.add('is-target');
    const lbl=el('div','target-label'); lbl.innerHTML=`${ ['Health','Stamina','Oxygen','Food','Weight','Melee'][i]} <span class="target-star">★</span>`;
    ti.appendChild(lbl);
    const ctrl=el('div','target-controls');

    function counter(valKey){
      const span=el('span','gender',valKey==='fM'?'♂':'♀');
      const minus=el('button','btn btn-icon btn-sm','–');
      const inp=el('input','target-val'); inp.type='number'; inp.min='0'; inp.value=line.targets[sk][valKey]||0;
      const plus=el('button','btn btn-icon btn-sm','+');
      minus.onclick=()=>{ line.targets[sk][valKey]=Math.max(0,(+inp.value||0)-1); inp.value=line.targets[sk][valKey]; saveLines(); };
      plus.onclick =()=>{ line.targets[sk][valKey]=(+inp.value||0)+1; inp.value=line.targets[sk][valKey]; saveLines(); };
      inp.oninput  =()=>{ line.targets[sk][valKey]=+inp.value; saveLines(); };
      ctrl.appendChild(span); ctrl.appendChild(minus); ctrl.appendChild(inp); ctrl.appendChild(plus);
    }
    counter('fM'); counter('mM');
    ti.appendChild(ctrl); grid.appendChild(ti);
  });
  sec.appendChild(grid); return sec;
}

function buildMutCheck(line){
  const sec=el('div','mutation-check');
  const tStat=line.targetStat||'Melee';
  sec.appendChild(el('div','mutation-check-title',`Baby ${tStat} Stat — Is it a Mutation?`));
  const row=el('div','check-row');
  const inp=el('input',''); inp.type='number'; inp.placeholder=`Enter baby's ${tStat} level…`; inp.value=line.checkVal||'';
  const btn=el('button','btn btn-primary','Check');
  const res=el('div','check-result','');
  function check(){
    const val=+inp.value; if(!val&&val!==0){ res.className='check-result'; return; }
    const sk=tStat.toLowerCase();
    const parentMax=Math.max(+(line.fatherStats[sk]||0),+(line.motherStats[sk]||0));
    const isMut=val>parentMax+0.5;
    res.className='check-result '+(isMut?'yes':'no');
    res.innerHTML=isMut?`✅ YES — Mutation! Baby ${tStat} ${val} > parent max ${parentMax}`:`❌ No mutation. Baby ${tStat} ${val} ≤ parent max ${parentMax}`;
    line.checkVal=inp.value; saveLines();
  }
  btn.onclick=check; inp.onkeydown=e=>{ if(e.key==='Enter')check(); }; inp.oninput=()=>{ line.checkVal=inp.value; saveLines(); };
  row.appendChild(inp); row.appendChild(btn); sec.appendChild(row); sec.appendChild(res); return sec;
}

function buildStack(line){
  const sec=el('div','stack-section');
  const lbl=el('div','stack-label'); lbl.innerHTML='Mutation Stack <span class="stack-max-label">Max: </span>';
  const maxInp=el('input','stack-max-input'); maxInp.type='number'; maxInp.min='1'; maxInp.value=line.mutMax||20;
  maxInp.oninput=()=>{ line.mutMax=+maxInp.value||20; updateStack(); saveLines(); };
  qs('.stack-max-label',lbl).appendChild(maxInp); sec.appendChild(lbl);
  const ctrl=el('div','stack-controls');
  const minus=el('button','stack-btn','–');
  const valEl=el('div','stack-val',line.mutStack||0);
  const plus=el('button','stack-btn','+');
  const outOf=el('span','');
  function updateStack(){ valEl.textContent=line.mutStack; const mx=line.mutMax||20; valEl.className='stack-val'+(line.mutStack>mx?' over':''); outOf.textContent=' / '+mx; }
  updateStack();
  minus.onclick=()=>{ line.mutStack=Math.max(0,(line.mutStack||0)-1); updateStack(); saveLines(); };
  plus.onclick =()=>{ line.mutStack=(line.mutStack||0)+1; updateStack(); saveLines(); };
  ctrl.appendChild(minus); ctrl.appendChild(valEl); ctrl.appendChild(outOf); ctrl.appendChild(plus);
  sec.appendChild(ctrl); return sec;
}

// ─── STAT CALCULATOR ─────────────────────────────────────────
let calcDino=null;
let calcMode='wild';

const CALC_STATS = STATS.slice(0,6);
const CALC_STAT_META = [
  { key:'health', abbr:'HP' },
  { key:'stamina', abbr:'ST' },
  { key:'oxygen', abbr:'OX' },
  { key:'food', abbr:'FO' },
  { key:'weight', abbr:'WT' },
  { key:'melee', abbr:'DMG' },
];

function renderCalc(){
  const dinoList=document.getElementById('calc-dino-list');
  const calcSearch=document.getElementById('calc-search');
  function renderList(filter){
    dinoList.innerHTML='';
    const q=filter.toLowerCase();
    UNIQUE_DINOS.filter(d=>!q||d.name.toLowerCase().includes(q)).forEach(d=>{
      const item=el('button','calc-dino-item'+(calcDino&&calcDino.name===d.name?' selected':''),d.name);
      item.type='button';
      item.onclick=()=>{ calcDino=d; updateCalcRight(); renderList(calcSearch.value); };
      dinoList.appendChild(item);
    });
  }
  renderList(''); calcSearch.oninput=()=>renderList(calcSearch.value);
}

function formatStatValue(value,index){
  if(!Number.isFinite(value)) return '—';
  if(index===5 || index===6) return `${roundTo(value,1)}%`;
  if(Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
  return Number.isInteger(value) ? String(value) : String(roundTo(value,1));
}

function roundTo(value,places){
  const factor=10**places;
  return Math.round((value+Number.EPSILON)*factor)/factor;
}

function tamingAddForStat(dino,index){
  const defaultAdd = index === 0 ? 0.07 : (index === 5 ? 7 : 0);
  return Array.isArray(dino.tameAdd) ? (dino.tameAdd[index] || 0) : defaultAdd;
}

function tamingMultForStat(dino,index){
  const defaultMult = index === 5 ? 0.176 : 0;
  return Array.isArray(dino.tameMult) ? (dino.tameMult[index] || 0) : defaultMult;
}

function tamedBaseHealthMultiplierForStat(dino,index){
  return index === 0 && Number.isFinite(dino.tamedBaseHealthMultiplier)
    ? dino.tamedBaseHealthMultiplier
    : 1;
}

function calculateWildPoints(statValue,dino,index){
  const value=Number(statValue);
  const base=dino.base[index];
  const perPoint=dino.wild[index];
  if(!Number.isFinite(value) || value <= 0 || !Number.isFinite(perPoint) || perPoint <= 0) return null;
  return Math.max(0,Math.round((value-base)/perPoint));
}

function calculateHatchedPoints(statValue,dino,index){
  const value=Number(statValue);
  const base=dino.base[index];
  const perPoint=dino.wild[index];
  if(!Number.isFinite(value) || value <= 0 || !Number.isFinite(base) || base <= 0 || !Number.isFinite(perPoint) || perPoint <= 0) return null;
  const tameAdd=tamingAddForStat(dino,index);
  const tameMult=tamingMultForStat(dino,index);
  const tamedBaseHealthMultiplier=tamedBaseHealthMultiplierForStat(dino,index);
  const preTameValue=((value/(1+tameMult))-tameAdd)/tamedBaseHealthMultiplier;
  return Math.max(0,Math.round((preTameValue-base)/perPoint));
}

function calculateStatPoints(statValue,dino,index,mode){
  return mode === 'hatched' ? calculateHatchedPoints(statValue,dino,index) : calculateWildPoints(statValue,dino,index);
}

function inferWildPoints(statValue,dino,index){
  return calculateWildPoints(statValue,dino,index);
}

function valueForWildPoints(dino,index,points){
  return dino.base[index] + dino.wild[index] * points;
}

function valueForHatchedPoints(dino,index,points){
  const wildValue=valueForWildPoints(dino,index,points);
  const tamedBaseHealthMultiplier=tamedBaseHealthMultiplierForStat(dino,index);
  return (wildValue * tamedBaseHealthMultiplier + tamingAddForStat(dino,index)) * (1 + tamingMultForStat(dino,index));
}

function valueForStatPoints(dino,index,points,mode){
  return mode === 'hatched' ? valueForHatchedPoints(dino,index,points) : valueForWildPoints(dino,index,points);
}

function increaseForStatPoint(dino,index,mode){
  return valueForStatPoints(dino,index,1,mode)-valueForStatPoints(dino,index,0,mode);
}

function formatStatInputValue(value,index){
  if(!Number.isFinite(value)) return '';
  const rounded=roundTo(value,index===5 ? 1 : 2);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function statRatingClass(points){
  if(points === null) return 'unknown';
  if(points >= 45) return 'amazing';
  if(points >= 35) return 'great';
  if(points >= 25) return 'good';
  return 'low';
}

function statRatingLabel(points){
  if(points === null) return 'Enter stat';
  if(points >= 45) return 'Amazing';
  if(points >= 35) return 'Great';
  if(points >= 25) return 'Good';
  return 'Low';
}

function updateCalcRight(){
  const right=document.getElementById('calc-right'); right.innerHTML='';
  if(!calcDino){ right.innerHTML='<div class="calc-hint">Select a dinosaur to start calculating stat points.</div>'; return; }
  const d=calcDino;

  const info=el('section','calc-info');
  info.appendChild(el('h3','','Base Stats (Level 1 Wild)'));
  info.appendChild(el('div','selected-dino-name',d.name));
  const bst=el('div','base-stat-table');
  CALC_STATS.forEach((s,i)=>{
    const row=el('div','base-stat-row');
    row.innerHTML=`<span class="stat-name">${s}</span><span class="stat-val">${formatStatValue(d.base[i],i)}</span>`;
    bst.appendChild(row);
  });
  info.appendChild(bst); right.appendChild(info);

  const calc=el('section','calc-inputs');
  calc.appendChild(el('h3','',calcMode === 'hatched' ? 'Hatched Point Calculator' : 'Wild Point Calculator'));

  const modeRow=el('div','level-type-row');
  const wildBtn=el('button','level-type-btn'+(calcMode === 'wild' ? ' active' : ''),'Wild Dino');
  wildBtn.type='button';
  const hatchedBtn=el('button','level-type-btn'+(calcMode === 'hatched' ? ' active' : ''),'Freshly Hatched Dino');
  hatchedBtn.type='button';
  wildBtn.onclick=()=>{ calcMode='wild'; updateCalcRight(); };
  hatchedBtn.onclick=()=>{ calcMode='hatched'; updateCalcRight(); };
  modeRow.appendChild(wildBtn); modeRow.appendChild(hatchedBtn);
  calc.appendChild(modeRow);

  const top=el('div','wild-calc-top');
  const levelField=el('label','wild-level-field');
  levelField.innerHTML=`<span>${calcMode === 'hatched' ? 'Baby Level (Fresh / Unleveled)' : 'Creature Level (Wild Only)'}</span>`;
  const levelInput=el('input','calc-stat-input'); levelInput.type='number'; levelInput.min='1'; levelInput.value='150';
  levelField.appendChild(levelInput);
  top.appendChild(levelField);
  const summary=el('div','calc-summary','');
  top.appendChild(summary);
  calc.appendChild(top);

  const grid=el('div','dododex-grid');
  const rows=[];
  CALC_STATS.forEach((stat,i)=>{
    const row=el('div','dododex-row');
    row.innerHTML=`
      <div class="stat-icon">${CALC_STAT_META[i].abbr}</div>
      <div class="stat-name-wrap"><strong>${stat}</strong><span>${calcMode === 'hatched' ? `Fresh hatch: ${formatStatValue(valueForHatchedPoints(d,i,0),i)} at 0 pts` : `Base ${formatStatValue(d.base[i],i)}`} · +${formatStatValue(increaseForStatPoint(d,i,calcMode),i)} displayed per ${calcMode === 'hatched' ? 'inherited' : 'wild'} point</span></div>
    `;
    const statInput=el('input','calc-stat-input observed-stat');
    statInput.type='number'; statInput.min='0'; statInput.step='any';
    statInput.placeholder=formatStatValue(valueForStatPoints(d,i,0,calcMode),i).replace('%','');
    const controls=el('div','point-stepper');
    const minus=el('button','point-step-btn','−'); minus.type='button'; minus.setAttribute('aria-label',`Remove one ${stat} point`);
    const pointBox=el('span','point-step-value','0 pts');
    const plus=el('button','point-step-btn','+'); plus.type='button'; plus.setAttribute('aria-label',`Add one ${stat} point`);
    controls.appendChild(minus); controls.appendChild(pointBox); controls.appendChild(plus);
    const result=el('div','point-result');
    const bar=el('div','point-bar'); bar.innerHTML='<span></span>';
    function nudgePoint(delta){
      const current=calculateStatPoints(statInput.value,d,i,calcMode);
      const next=Math.max(0,(current ?? 0)+delta);
      statInput.value=formatStatInputValue(valueForStatPoints(d,i,next,calcMode),i);
      recalc();
    }
    minus.onclick=()=>nudgePoint(-1);
    plus.onclick=()=>nudgePoint(1);
    row.appendChild(statInput); row.appendChild(controls); row.appendChild(result); row.appendChild(bar);
    grid.appendChild(row);
    rows.push({statInput,pointBox,result,bar,i});
  });
  calc.appendChild(grid);

  const graphCard=el('section','calc-graph-card');
  graphCard.appendChild(el('h3','','Stat Graph'));
  const graph=el('div','stat-graph');
  graph.innerHTML='<canvas id="stat-graph-canvas" width="360" height="280" aria-label="Stat points graph"></canvas>';
  graphCard.appendChild(graph);

  const explainer=el('section','calc-info calc-explainer');
  explainer.innerHTML=`
    <h3>How This Ark Stat Calculator Works</h3>
    <p>For wild creatures, ARK gives one point to a random stat for every level after level 1, so a level 120 wild creature has 119 wild points total. For each stat, ASEM uses the data.js base stat and per-wild-point increase, then calculates <strong>points = round((entered stat − base stat) ÷ increase per point)</strong>.</p>
    <p>For freshly hatched/born creatures, ARK inherits the parents' natural stat levels, not the parents' displayed values. A fresh baby is then displayed with the post-tame formula at 100% taming effectiveness and zero player-added domestic levels: wild value × any tamed-base-health multiplier, plus additive tame bonus, then multiplicative tame bonus. ASEM reverses that formula to recover inherited breeding points.</p>
    <p>The −/+ buttons move the calculated point count one point at a time and fill in the matching stat value. Movement speed normally cannot be checked from visible stats, so any unaccounted level points are shown as <strong>wasted/hidden speed points</strong>. Results assume default server stat multipliers and a fresh creature with no imprint, manual level-ups, or single-player stat overrides.</p>
  `;

  function recalc(){
    const level=Math.max(1,+levelInput.value||1);
    const maxPoints=Math.max(0,level-1);
    let used=0;
    const points=[];
    rows.forEach(({statInput,pointBox,result,bar,i})=>{
      const pts=calculateStatPoints(statInput.value,d,i,calcMode);
      points[i]=pts;
      if(pts !== null) used += pts;
      if(pointBox) pointBox.textContent=pts === null ? '0 pts' : `${pts} pts`;
      const expected=pts === null ? null : valueForStatPoints(d,i,pts,calcMode);
      const rating=statRatingClass(pts);
      result.className=`point-result ${rating}`;
      result.innerHTML=pts === null
        ? '<strong>—</strong><span>points</span>'
        : `<strong>${pts}</strong><span>pts · ${statRatingLabel(pts)}</span><small>= ${formatStatValue(expected,i)}</small>`;
      const pct=pts === null ? 0 : Math.min(100,(pts/Math.max(1,maxPoints))*100);
      qs('span',bar).style.width=`${pct}%`;
    });
    const wasted=Math.max(0,maxPoints-used);
    const overBy=Math.max(0,used-maxPoints);
    summary.className='calc-summary'+(overBy?' over':'');
    summary.innerHTML=overBy
      ? `<strong>${used}</strong> entered points is <strong>${overBy}</strong> over a level ${level} ${calcMode === 'hatched' ? 'fresh baby' : 'wild creature'}.`
      : `<strong>${used}</strong> / ${maxPoints} visible points · <strong>${wasted}</strong> possible ${calcMode === 'hatched' ? 'hidden inherited speed' : 'wasted speed'} points`;
    drawStatGraph(points,maxPoints);
  }

  function drawStatGraph(points,maxPoints){
    const canvas=qs('#stat-graph-canvas',graph);
    const ctx=canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h);
    const cx=w/2, cy=h/2+6, radius=95;
    const labels=CALC_STATS;
    const maxGraph=Math.max(1,Math.min(maxPoints,60));

    ctx.strokeStyle='rgba(37,99,235,0.2)';
    ctx.fillStyle='rgba(37,99,235,0.05)';
    [0.33,0.66,1].forEach(scale=>{
      ctx.beginPath();
      labels.forEach((_,i)=>{
        const angle=(-Math.PI/2)+(i*2*Math.PI/labels.length);
        const x=cx+Math.cos(angle)*radius*scale;
        const y=cy+Math.sin(angle)*radius*scale;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });

    labels.forEach((label,i)=>{
      const angle=(-Math.PI/2)+(i*2*Math.PI/labels.length);
      ctx.strokeStyle='rgba(37,99,235,0.14)';
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius); ctx.stroke();
      ctx.fillStyle='#172033'; ctx.font='12px Segoe UI, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      const lx=cx+Math.cos(angle)*(radius+28);
      const ly=cy+Math.sin(angle)*(radius+24);
      ctx.fillText(label.toUpperCase(),lx,ly);
    });

    ctx.beginPath();
    labels.forEach((_,i)=>{
      const pts=points[i] || 0;
      const scale=Math.min(1,pts/maxGraph);
      const angle=(-Math.PI/2)+(i*2*Math.PI/labels.length);
      const x=cx+Math.cos(angle)*radius*scale;
      const y=cy+Math.sin(angle)*radius*scale;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle='rgba(22, 163, 74, 0.22)';
    ctx.strokeStyle='rgba(37, 99, 235, 0.95)';
    ctx.lineWidth=3;
    ctx.fill(); ctx.stroke();
  }

  levelInput.oninput=recalc;
  rows.forEach(({statInput})=>{ statInput.oninput=recalc; });
  recalc();

  right.appendChild(calc);
  right.appendChild(graphCard);
  right.appendChild(explainer);
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-tab').forEach(tab=>{ tab.onclick=()=>switchPage(tab.dataset.page); });
  document.getElementById('add-line-btn').onclick=()=>{ lines.push(newLine()); saveLines(); renderLines(); };
  renderLines(); renderCalc(); updateCalcRight();
});
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

  const delBtn = el('button','btn btn-danger btn-sm','🗑');
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

function renderCalc(){
  const dinoList=document.getElementById('calc-dino-list');
  const calcSearch=document.getElementById('calc-search');
  function renderList(filter){
    dinoList.innerHTML='';
    const q=filter.toLowerCase();
    UNIQUE_DINOS.filter(d=>!q||d.name.toLowerCase().includes(q)).forEach(d=>{
      const item=el('div','calc-dino-item'+(calcDino&&calcDino.name===d.name?' selected':''),d.name);
      item.onclick=()=>{ calcDino=d; document.querySelectorAll('.calc-dino-item').forEach(x=>x.classList.remove('selected')); item.classList.add('selected'); updateCalcRight(); };
      dinoList.appendChild(item);
    });
  }
  renderList(''); calcSearch.oninput=()=>renderList(calcSearch.value);
}

function updateCalcRight(){
  const right=document.getElementById('calc-right'); right.innerHTML='';
  if(!calcDino){ right.innerHTML='<div class="calc-hint">← Select a dinosaur to calculate stats</div>'; return; }
  const d=calcDino;

  const info=el('div','calc-info');
  info.appendChild(el('h3','','Base Stats (Lvl 1 Tamed)'));
  info.appendChild(el('div','selected-dino-name',d.name));
  const bst=el('div','base-stat-table');
  STATS.slice(0,6).forEach((s,i)=>{
    const row=el('div','base-stat-row');
    row.innerHTML=`<span class="stat-name">${s}</span><span class="stat-val">${d.base[i]}</span>`;
    bst.appendChild(row);
  });
  info.appendChild(bst); right.appendChild(info);

  const inp=el('div','calc-inputs'); inp.appendChild(el('h3','','Stat Calculator'));
  const ltRow=el('div','level-type-row'); let isTamed=true;
  const wildBtn=el('div','level-type-btn','Wild'); const tamedBtn=el('div','level-type-btn active','Tamed');
  wildBtn.onclick =()=>{ isTamed=false; wildBtn.classList.add('active');  tamedBtn.classList.remove('active'); recalc(); };
  tamedBtn.onclick=()=>{ isTamed=true;  tamedBtn.classList.add('active'); wildBtn.classList.remove('active');  recalc(); };
  ltRow.appendChild(wildBtn); ltRow.appendChild(tamedBtn); inp.appendChild(ltRow);

  const hdr=el('div','calc-stat-row header');
  ['Stat','Wild Lvl','Dom Lvl','TE%','Result'].forEach(h=>hdr.appendChild(el('span','',h)));
  inp.appendChild(hdr);

  const rows=[];
  STATS.slice(0,7).forEach((s,i)=>{
    const row=el('div','calc-stat-row');
    const wIn=el('input','calc-stat-input'); wIn.type='number'; wIn.min='0'; wIn.value='0';
    const dIn=el('input','calc-stat-input'); dIn.type='number'; dIn.min='0'; dIn.value='0';
    const tIn=el('input','calc-stat-input'); tIn.type='number'; tIn.min='0'; tIn.max='100'; tIn.value='100';
    const resSpan=el('span','calc-result-val neutral','—');
    [wIn,dIn,tIn].forEach(x=>x.oninput=recalc);
    row.appendChild(el('span','calc-stat-name',s));
    row.appendChild(wIn); row.appendChild(dIn); row.appendChild(tIn); row.appendChild(resSpan);
    inp.appendChild(row); rows.push({wIn,dIn,tIn,resSpan,i});
  });

  function recalc(){
    rows.forEach(({wIn,dIn,tIn,resSpan,i})=>{
      const wLvl=+wIn.value||0, dLvl=+dIn.value||0;
      const te=Math.min(100,Math.max(0,+tIn.value||100))/100;
      const B=d.base[i],Iw=d.wild[i],Id=d.dom[i],tb=d.tameBonus[i];
      const result=isTamed ? (B+Iw*wLvl)*(1+tb*te)*(1+Id*dLvl) : B+Iw*wLvl;
      resSpan.textContent=(i===5||i===6)?result.toFixed(1)+'%':Math.round(result);
      resSpan.className='calc-result-val'+(result>B*2?' warn':'');
    });
  }
  recalc(); right.appendChild(inp);
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-tab').forEach(tab=>{ tab.onclick=()=>switchPage(tab.dataset.page); });
  document.getElementById('add-line-btn').onclick=()=>{ lines.push(newLine()); saveLines(); renderLines(); };
  renderLines(); renderCalc(); updateCalcRight();
});

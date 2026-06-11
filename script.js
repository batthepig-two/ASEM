// ══════════════════════════════════════════════════════════════
//  ASEM — ARK Stat & Evolution Manager
//  Application behavior and UI logic. Dinosaur data lives in data.js.
// ══════════════════════════════════════════════════════════════

// ─── STORAGE ──────────────────────────────────────────────────
const STORAGE_KEY = 'asem_lines_v2';
const SAVED_CREATURES_KEY = 'asem_saved_creatures_v1';
function loadLines() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveLines() { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); }
function loadSavedCreatures() { try { return JSON.parse(localStorage.getItem(SAVED_CREATURES_KEY)) || []; } catch { return []; } }
function saveSavedCreatures() { localStorage.setItem(SAVED_CREATURES_KEY, JSON.stringify(savedCreatures)); }

// ─── STATE ────────────────────────────────────────────────────
let lines = loadLines();
if (!lines.length) lines = [newLine()];
let savedCreatures = loadSavedCreatures();
let activeSavedCreatureId = null;
let calcDraft = null;

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
    babyStats: {health:'',stamina:'',oxygen:'',food:'',weight:'',melee:''},
    checkVal:'', mutStack:0, mutMax:20, generation:1, notes:'', collapsed:false,
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
const HELPER_STAT_KEYS = ['health','stamina','oxygen','food','weight','melee'];
const HELPER_STAT_LABELS = ['Health','Stamina','Oxygen','Food','Weight','Melee'];

function renderLines() {
  const container = document.getElementById('lines-container');
  if(!container) return;
  container.innerHTML = '';
  lines.forEach(line => container.appendChild(buildLineCard(line)));
}

function buildLineCard(line) {
  line.fatherStats ||= {health:0,stamina:0,oxygen:0,food:0,weight:0,melee:0};
  line.motherStats ||= {health:0,stamina:0,oxygen:0,food:0,weight:0,melee:0};
  line.babyStats ||= {health:'',stamina:'',oxygen:'',food:'',weight:'',melee:''};
  line.targetStat ||= 'Melee';
  line.mutMax ||= 20;
  line.mutStack ||= 0;
  line.generation ||= 1;

  const card = el('div','line-card breeding-project');
  card.dataset.id = line.id;

  const hdr = el('div','line-header project-header');
  const left = el('div','line-header-left');
  const colBtn = el('button','collapse-btn', line.collapsed?'▶':'▼');
  if(line.collapsed) colBtn.classList.add('collapsed');
  colBtn.onclick = () => { line.collapsed=!line.collapsed; saveLines(); renderLines(); };
  const titleEl = el('span','line-title project-title', line.name||'Breeding Project');
  titleEl.contentEditable=true;
  titleEl.spellcheck=false;
  titleEl.title='Click to rename this breeding project';
  titleEl.oninput = () => { line.name=titleEl.innerText.trim(); saveLines(); };
  const meta = el('span','project-meta', `${line.dino || 'No dino selected'} · ${line.targetStat} line`);
  left.appendChild(colBtn); left.appendChild(titleEl); left.appendChild(meta);

  const delBtn = el('button','btn btn-danger btn-sm','Delete');
  delBtn.onclick = () => { lines=lines.length===1?[newLine()]:lines.filter(l=>l.id!==line.id); saveLines(); renderLines(); };
  hdr.appendChild(left); hdr.appendChild(delBtn); card.appendChild(hdr);

  const body = el('div','line-body project-body');
  if(line.collapsed){ body.style.display='none'; card.appendChild(body); return card; }

  body.appendChild(buildProjectSetup(line));
  body.appendChild(buildParentComparison(line));
  body.appendChild(buildBabyStatChecker(line));
  body.appendChild(buildStack(line));

  const noteWrap=el('div','notes-wrap project-notes');
  const noteLabel=el('div','stat-section-title','PROJECT NOTES');
  const ta=el('textarea','');
  ta.placeholder='Plan the next raise: clean male, target HP, keep females with 49+ melee, etc.';
  ta.value=line.notes||'';
  ta.oninput=()=>{ line.notes=ta.value; saveLines(); };
  noteWrap.appendChild(noteLabel); noteWrap.appendChild(ta); body.appendChild(noteWrap);
  card.appendChild(body);
  return card;
}

function buildProjectSetup(line){
  const sec=el('section','project-section project-setup');
  sec.appendChild(el('div','stat-section-title','PROJECT SETUP'));
  const grid=el('div','project-setup-grid');

  const dinoField=el('label','project-field');
  dinoField.innerHTML='<span>Dinosaur</span>';
  const dinoSelect=el('select','');
  dinoSelect.appendChild(el('option','','Choose dino…'));
  dinoSelect.firstChild.value='';
  UNIQUE_DINOS.forEach(d=>{
    const o=el('option','',d.name); o.value=d.name; if(line.dino===d.name)o.selected=true; dinoSelect.appendChild(o);
  });
  dinoSelect.onchange=()=>{ line.dino=dinoSelect.value; if(!line.name || line.name==='New Breeding Line' || line.name==='Breeding Project') line.name=line.dino ? `${line.dino} Line` : 'Breeding Project'; saveLines(); renderLines(); };
  dinoField.appendChild(dinoSelect);

  const targetField=el('label','project-field');
  targetField.innerHTML='<span>Target Stat</span>';
  const targetSelect=el('select','');
  HELPER_STAT_LABELS.forEach(label=>{ const o=el('option','',label); o.value=label; if(line.targetStat===label)o.selected=true; targetSelect.appendChild(o); });
  targetSelect.onchange=()=>{ line.targetStat=targetSelect.value; saveLines(); renderLines(); };
  targetField.appendChild(targetSelect);

  const genField=el('label','project-field');
  genField.innerHTML='<span>Generation</span>';
  const genInput=el('input',''); genInput.type='number'; genInput.min='1'; genInput.value=line.generation||1;
  genInput.oninput=()=>{ line.generation=Math.max(1,+genInput.value||1); saveLines(); };
  genField.appendChild(genInput);

  const summary=el('div','project-summary');
  const targetKey=line.targetStat.toLowerCase();
  const best=Math.max(+(line.fatherStats[targetKey]||0),+(line.motherStats[targetKey]||0));
  summary.innerHTML=`<strong>${best+2}</strong><span>next ${line.targetStat} mutation target</span><small>Best parent ${line.targetStat}: ${best} pts</small>`;

  grid.appendChild(dinoField); grid.appendChild(targetField); grid.appendChild(genField); grid.appendChild(summary);
  sec.appendChild(grid);
  return sec;
}

function buildParentComparison(line){
  const sec=el('section','project-section');
  sec.appendChild(el('div','stat-section-title','PARENT STAT LEVELS & MUTATION TARGETS'));
  const table=el('div','breeding-table');
  table.innerHTML='<div class="breeding-row breeding-head"><span>Stat</span><span>Father</span><span>Mother</span><span>Best</span><span>+2 Target</span></div>';
  HELPER_STAT_KEYS.forEach((key,i)=>{
    const row=el('div','breeding-row'+(line.targetStat.toLowerCase()===key?' is-target':''));
    const father=el('input',''); father.type='number'; father.min='0'; father.value=line.fatherStats[key]||0;
    const mother=el('input',''); mother.type='number'; mother.min='0'; mother.value=line.motherStats[key]||0;
    const bestEl=el('strong','');
    const targetEl=el('strong','target-number');
    function sync(){
      line.fatherStats[key]=Math.max(0,+father.value||0);
      line.motherStats[key]=Math.max(0,+mother.value||0);
      const best=Math.max(line.fatherStats[key],line.motherStats[key]);
      bestEl.textContent=best;
      targetEl.textContent=best+2;
      saveLines();
    }
    father.oninput=sync; mother.oninput=sync; sync();
    row.appendChild(el('span','breeding-stat-name',HELPER_STAT_LABELS[i]));
    row.appendChild(father); row.appendChild(mother); row.appendChild(bestEl); row.appendChild(targetEl);
    table.appendChild(row);
  });
  sec.appendChild(table);
  return sec;
}

function buildBabyStatChecker(line){
  const sec=el('section','project-section baby-checker');
  sec.appendChild(el('div','stat-section-title','BABY CHECKER — ENTER BABY POINT LEVELS'));
  const grid=el('div','baby-check-grid');
  HELPER_STAT_KEYS.forEach((key,i)=>{
    const card=el('div','baby-check-card'+(line.targetStat.toLowerCase()===key?' is-target':''));
    const label=el('label','',HELPER_STAT_LABELS[i]);
    const input=el('input',''); input.type='number'; input.min='0'; input.placeholder='Baby pts'; input.value=line.babyStats[key] ?? '';
    const result=el('div','baby-check-result','—');
    function sync(){
      const raw=input.value;
      line.babyStats[key]=raw;
      const baby=raw==='' ? null : +raw;
      const father=+(line.fatherStats[key]||0);
      const mother=+(line.motherStats[key]||0);
      const best=Math.max(father,mother);
      card.classList.remove('mutated','matched','missed');
      if(baby === null || !Number.isFinite(baby)) result.textContent='Enter baby points';
      else if(baby >= best+2){ card.classList.add('mutated'); result.innerHTML=`✅ New mutation (${baby} / target ${best+2})`; }
      else if(baby === best){ card.classList.add('matched'); result.innerHTML=`Inherited best parent (${best})`; }
      else { card.classList.add('missed'); result.innerHTML=`Below best parent (${best})`; }
      saveLines();
    }
    input.oninput=sync; sync();
    card.appendChild(label); card.appendChild(input); card.appendChild(result); grid.appendChild(card);
  });
  sec.appendChild(grid);
  return sec;
}

function buildStack(line){
  const sec=el('div','stack-section project-stack');
  const lbl=el('div','stack-label'); lbl.innerHTML='Mutation Stack <span class="stack-max-label">Max clean-side target: </span>';
  const maxInp=el('input','stack-max-input'); maxInp.type='number'; maxInp.min='1'; maxInp.value=line.mutMax||20;
  maxInp.oninput=()=>{ line.mutMax=+maxInp.value||20; updateStack(); saveLines(); };
  qs('.stack-max-label',lbl).appendChild(maxInp); sec.appendChild(lbl);
  const ctrl=el('div','stack-controls');
  const minus=el('button','stack-btn','–');
  const valEl=el('div','stack-val',line.mutStack||0);
  const plus=el('button','stack-btn','+');
  const outOf=el('span','');
  const hint=el('small','stack-hint','Keep the active mutation side below the max when possible for normal mutation chances.');
  function updateStack(){ valEl.textContent=line.mutStack; const mx=line.mutMax||20; valEl.className='stack-val'+(line.mutStack>=mx?' over':''); outOf.textContent=' / '+mx; }
  updateStack();
  minus.onclick=()=>{ line.mutStack=Math.max(0,(line.mutStack||0)-1); updateStack(); saveLines(); };
  plus.onclick =()=>{ line.mutStack=(line.mutStack||0)+1; updateStack(); saveLines(); };
  ctrl.appendChild(minus); ctrl.appendChild(valEl); ctrl.appendChild(outOf); ctrl.appendChild(plus);
  sec.appendChild(ctrl); sec.appendChild(hint); return sec;
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

function newCalcDraft(dinoName='',mode='wild'){
  return { dinoName, mode, level:150, stats:['','','','','',''], points:[null,null,null,null,null,null] };
}

function ensureCalcDraft(){
  if(!calcDraft) calcDraft=newCalcDraft(calcDino?.name || '',calcMode);
  calcDraft.dinoName=calcDino?.name || calcDraft.dinoName || '';
  calcDraft.mode=calcMode;
  calcDraft.stats ||= ['','','','','',''];
  calcDraft.points ||= [null,null,null,null,null,null];
  calcDraft.level ||= 150;
  return calcDraft;
}

function renderSavedCreatures(){
  const list=document.getElementById('saved-creature-list');
  if(!list) return;
  list.innerHTML='';
  if(!savedCreatures.length){
    list.innerHTML='<div class="empty-saved">No saved creatures yet. Fill out the calculator and press Save Creature.</div>';
    return;
  }
  savedCreatures.forEach(saved=>{
    const item=el('div','saved-creature-item'+(saved.id===activeSavedCreatureId?' active':''));
    const btn=el('button','saved-creature-open');
    btn.type='button';
    const used=(saved.points || []).filter(p=>p !== null).reduce((sum,p)=>sum+p,0);
    btn.innerHTML=`<strong>${saved.name}</strong><span>${saved.dinoName} · ${saved.mode === 'hatched' ? 'Fresh hatch / egg' : 'Wild'} · L${saved.level}</span><small>${used} visible pts saved</small>`;
    btn.onclick=()=>loadSavedCreature(saved.id);
    const del=el('button','saved-creature-delete','×');
    del.type='button';
    del.setAttribute('aria-label',`Delete ${saved.name}`);
    del.onclick=()=>{ savedCreatures=savedCreatures.filter(c=>c.id!==saved.id); if(activeSavedCreatureId===saved.id) activeSavedCreatureId=null; saveSavedCreatures(); renderSavedCreatures(); };
    item.appendChild(btn); item.appendChild(del); list.appendChild(item);
  });
}

function loadSavedCreature(id){
  const saved=savedCreatures.find(c=>c.id===id);
  if(!saved) return;
  const dino=UNIQUE_DINOS.find(d=>d.name===saved.dinoName);
  if(!dino) return;
  activeSavedCreatureId=id;
  calcDino=dino;
  calcMode=saved.mode || 'wild';
  calcDraft={
    dinoName:saved.dinoName,
    mode:calcMode,
    level:saved.level || 150,
    stats:[...(saved.stats || [])].slice(0,6),
    points:[...(saved.points || [])].slice(0,6),
  };
  while(calcDraft.stats.length<6) calcDraft.stats.push('');
  while(calcDraft.points.length<6) calcDraft.points.push(null);
  renderCalc();
  updateCalcRight();
}

function saveCurrentCreature(level,points,statValues){
  if(!calcDino) return;
  const stats=statValues.map(v=>String(v ?? ''));
  const calculatedPoints=points.map(p=>p === undefined ? null : p);
  const timestamp=new Date().toISOString();
  const existing=activeSavedCreatureId ? savedCreatures.find(c=>c.id===activeSavedCreatureId) : null;
  const nameBase=`${calcDino.name} ${calcMode === 'hatched' ? 'Fresh Hatch' : 'Wild'} L${level}`;
  const saved={
    id: existing?.id || Date.now()+Math.random(),
    name: existing?.name || nameBase,
    dinoName: calcDino.name,
    mode: calcMode,
    level,
    stats,
    points: calculatedPoints,
    updatedAt: timestamp,
  };
  if(existing) Object.assign(existing,saved);
  else savedCreatures.unshift(saved);
  activeSavedCreatureId=saved.id;
  calcDraft={ dinoName:calcDino.name, mode:calcMode, level, stats, points:calculatedPoints };
  saveSavedCreatures();
  renderSavedCreatures();
}

function renderCalc(){
  const dinoList=document.getElementById('calc-dino-list');
  const calcSearch=document.getElementById('calc-search');
  if(!dinoList || !calcSearch) return;
  function renderList(filter){
    dinoList.innerHTML='';
    const q=filter.toLowerCase();
    UNIQUE_DINOS.filter(d=>!q||d.name.toLowerCase().includes(q)).forEach(d=>{
      const item=el('button','calc-dino-item'+(calcDino&&calcDino.name===d.name?' selected':''),d.name);
      item.type='button';
      item.onclick=()=>{
        calcDino=d;
        calcMode=calcDraft?.dinoName===d.name ? calcDraft.mode || calcMode : 'wild';
        calcDraft=newCalcDraft(d.name,calcMode);
        activeSavedCreatureId=null;
        updateCalcRight();
        renderList(calcSearch.value);
        renderSavedCreatures();
      };
      dinoList.appendChild(item);
    });
  }
  renderList(calcSearch.value || '');
  calcSearch.oninput=()=>renderList(calcSearch.value);
  renderSavedCreatures();
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

function calculateWildPoints(finalValue,base,wildStatIncrease,tameAdd=0){
  const value=Number(finalValue);
  const baseValue=Number(base);
  const pointIncrease=Number(wildStatIncrease);
  const additiveBonus=Number(tameAdd) || 0;
  if(!Number.isFinite(value) || value <= 0 || !Number.isFinite(baseValue) || baseValue <= 0 || !Number.isFinite(pointIncrease) || pointIncrease <= 0) return null;

  const rawPoints=(value-additiveBonus-baseValue)/pointIncrease;

  return Number.isFinite(rawPoints) ? Math.max(0,Math.round(rawPoints)) : null;
}

const EGG_HATCH_CREATURE_NAMES = new Set([
  'Deinonychus',
  'Magmasaur',
  'Rock Drake',
  'Wyvern (Fire)',
  'Wyvern (Ice)',
  'Wyvern (Lightning)',
  'Wyvern (Poison)',
]);

const EGG_HATCH_CREATURE_ALIASES = {
  wyvern: 'Wyvern (Fire)',
  'fire wyvern': 'Wyvern (Fire)',
  'ice wyvern': 'Wyvern (Ice)',
  'lightning wyvern': 'Wyvern (Lightning)',
  'poison wyvern': 'Wyvern (Poison)',
};

const STAT_INDEX_BY_NAME = STATS.reduce((lookup,stat,index) => {
  lookup[stat.toLowerCase()] = index;
  return lookup;
},{});
STAT_INDEX_BY_NAME.damage = 5;
STAT_INDEX_BY_NAME['melee damage'] = 5;

function normalizeLookupName(name){
  return String(name || '').trim().toLowerCase();
}

function findDinoByName(creatureName){
  const lookupName=normalizeLookupName(creatureName);
  const alias=EGG_HATCH_CREATURE_ALIASES[lookupName];
  return UNIQUE_DINOS.find(d => d.name === alias || normalizeLookupName(d.name) === lookupName) || null;
}

function statIndexForName(statName){
  return STAT_INDEX_BY_NAME[normalizeLookupName(statName)] ?? null;
}

function isEggHatchCreature(dino){
  return !!dino && EGG_HATCH_CREATURE_NAMES.has(dino.name);
}

function eggHatchFormulaValue(value,index){
  return index === 5 ? value/100 : value;
}

const MAX_EGG_HATCH_POINTS = 250;

function eggHatchStatConfig(dino,index){
  const baseValue=eggHatchFormulaValue(Number(dino.base[index]),index);
  const wildIncrease=Number(dino.wild[index])/Number(dino.base[index]);
  const tameAdd=eggHatchFormulaValue(tamingAddForStat(dino,index),index);
  const tameMult=tamingMultForStat(dino,index);
  if(!Number.isFinite(baseValue) || baseValue <= 0 || !Number.isFinite(wildIncrease) || wildIncrease <= 0 || !Number.isFinite(tameAdd) || !Number.isFinite(tameMult) || tameMult <= -1) return null;

  return {
    baseValue,
    wildIncrease,
    tameAdd,
    tameMult,
    stepValue: baseValue * wildIncrease * (1 + tameMult),
  };
}

function eggHatchTestValue({baseValue,wildIncrease,tameAdd,tameMult},points){
  return (baseValue * (1 + (points * wildIncrease)) + tameAdd) * (1 + tameMult);
}

function calculateEggHatchPoints(creatureName,statName,inGameValue){
  const dino=findDinoByName(creatureName);
  const index=statIndexForName(statName);
  const value=eggHatchFormulaValue(Number(inGameValue),index);
  if(!isEggHatchCreature(dino) || index === null || !Number.isFinite(value) || value <= 0) return null;

  const config=eggHatchStatConfig(dino,index);
  if(!config || !Number.isFinite(config.stepValue) || config.stepValue <= 0) return null;

  let closestPoint=0;
  let smallestDifference=Infinity;
  for(let points=0; points<=MAX_EGG_HATCH_POINTS; points++){
    const testValue=eggHatchTestValue(config,points);
    const difference=Math.abs(value-testValue);
    if(difference < smallestDifference){
      smallestDifference=difference;
      closestPoint=points;
    }
  }

  return closestPoint;
}

function calculateDisplayedStatPoints(statValue,dino,index){
  return calculateWildPoints(statValue,dino.base[index],dino.wild[index]);
}

function calculateHatchedPoints(statValue,dino,index){
  if(isEggHatchCreature(dino)) return calculateEggHatchPoints(dino.name,STATS[index],statValue);

  const value=Number(statValue);
  const tameMult=tamingMultForStat(dino,index);
  const tamedBaseHealthMultiplier=tamedBaseHealthMultiplierForStat(dino,index);
  if(!Number.isFinite(value) || value <= 0 || !Number.isFinite(tameMult) || tameMult <= -1 || !Number.isFinite(tamedBaseHealthMultiplier) || tamedBaseHealthMultiplier <= 0) return null;

  const preTameValue=value/(1+tameMult)/tamedBaseHealthMultiplier;
  return calculateWildPoints(preTameValue,dino.base[index],dino.wild[index],tamingAddForStat(dino,index)/tamedBaseHealthMultiplier);
}

function calculateStatPoints(statValue,dino,index,mode){
  return mode === 'hatched' ? calculateHatchedPoints(statValue,dino,index) : calculateDisplayedStatPoints(statValue,dino,index);
}

function inferWildPoints(statValue,dino,index){
  return calculateDisplayedStatPoints(statValue,dino,index);
}

function valueForWildPoints(dino,index,points){
  return dino.base[index] + dino.wild[index] * points;
}

function valueForHatchedPoints(dino,index,points){
  if(isEggHatchCreature(dino)){
    const config=eggHatchStatConfig(dino,index);
    if(!config) return NaN;
    const value=eggHatchTestValue(config,points);
    return index === 5 ? value*100 : value;
  }

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
  const draft=ensureCalcDraft();

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
  wildBtn.onclick=()=>{ calcMode='wild'; draft.mode=calcMode; activeSavedCreatureId=null; updateCalcRight(); renderSavedCreatures(); };
  hatchedBtn.onclick=()=>{ calcMode='hatched'; draft.mode=calcMode; activeSavedCreatureId=null; updateCalcRight(); renderSavedCreatures(); };
  modeRow.appendChild(wildBtn); modeRow.appendChild(hatchedBtn);
  calc.appendChild(modeRow);

  const top=el('div','wild-calc-top');
  const levelField=el('label','wild-level-field');
  levelField.innerHTML=`<span>${calcMode === 'hatched' ? 'Baby Level (Fresh / Unleveled)' : 'Creature Level (Wild Only)'}</span>`;
  const levelInput=el('input','calc-stat-input'); levelInput.type='number'; levelInput.min='1'; levelInput.value=draft.level || 150;
  levelField.appendChild(levelInput);
  top.appendChild(levelField);
  const summary=el('div','calc-summary','');
  top.appendChild(summary);
  calc.appendChild(top);

  const saveRow=el('div','calc-save-row');
  const saveBtn=el('button','btn btn-primary','Save Creature');
  saveBtn.type='button';
  const saveStatus=el('span','save-status','Saved creatures stay in this browser.');
  saveRow.appendChild(saveBtn); saveRow.appendChild(saveStatus);
  calc.appendChild(saveRow);

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
    statInput.value=draft.stats?.[i] ?? '';
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
      activeSavedCreatureId=null;
      recalc();
      renderSavedCreatures();
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
    draft.level=level;
    draft.mode=calcMode;
    draft.dinoName=d.name;
    draft.stats=rows.map(({statInput})=>statInput.value);
    draft.points=points.map(p=>p === undefined ? null : p);
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

  saveBtn.onclick=()=>{
    recalc();
    saveCurrentCreature(Math.max(1,+levelInput.value||1),draft.points,draft.stats);
    saveStatus.textContent='Saved! Click it in the sidebar to reload this chart.';
  };
  levelInput.oninput=()=>{ activeSavedCreatureId=null; recalc(); renderSavedCreatures(); };
  rows.forEach(({statInput})=>{ statInput.oninput=()=>{ activeSavedCreatureId=null; recalc(); renderSavedCreatures(); }; });
  recalc();

  right.appendChild(calc);
  right.appendChild(graphCard);
  right.appendChild(explainer);
}


// ─── TAMING CALCULATOR ───────────────────────────────────────
let tamingDino=null;
let tamingDraft={ level:150, tamingSpeed:1, foodDrain:1, weaponQuality:100, secondsBetweenHits:5, headshots:false };

const ARK_ASSET_BASE = 'https://ark.wiki.gg/wiki/Special:Redirect/file/';
function arkAsset(file){ return `${ARK_ASSET_BASE}${encodeURIComponent(file)}`; }
function assetImg(file,alt){ return `<img src="${arkAsset(file)}" alt="${alt}" loading="lazy" decoding="async">`; }

const TAMING_WEAPONS = [
  { name:'Bow + Tranq Arrow', asset:'Bow.png', ammoAsset:'Tranq_Arrow.png', ammo:'Tranq Arrow', torporInstant:40, torporOverTime:50, duration:4, damage:20, reload:2.6, headshot:false, note:'Early-game arrows. Wait a few seconds between shots so the delayed torpor can finish ticking.' },
  { name:'Crossbow + Tranq Arrow', asset:'Crossbow.png', ammoAsset:'Tranq_Arrow.png', ammo:'Tranq Arrow', torporInstant:70, torporOverTime:87.5, duration:4, damage:35, reload:3.1, headshot:false, note:'Reliable water-safe knockout choice with stronger arrow damage.' },
  { name:'Longneck + Tranq Dart', asset:'Longneck_Rifle.png', ammoAsset:'Tranquilizer_Dart.png', ammo:'Tranquilizer Dart', torporInstant:156, torporOverTime:65, duration:5, damage:26, reload:4.3, headshot:true, note:'Lower damage per torpor for fragile tames.' },
  { name:'Longneck + Shocking Dart', asset:'Longneck_Rifle.png', ammoAsset:'Shocking_Tranquilizer_Dart.png', ammo:'Shocking Tranquilizer Dart', torporInstant:312, torporOverTime:130, duration:5, damage:26, reload:4.3, headshot:true, note:'Expensive, fast, and strong torpor burst.' },
  { name:'Compound Bow + Toxicant Arrow', asset:'Compound_Bow.png', ammoAsset:'Toxicant_Arrow_(Mobile).png', ammo:'Toxicant Arrow', torporInstant:270, torporOverTime:270, duration:5, damage:135, reload:2.9, headshot:false, note:'Very high torpor, but risky direct damage on low-health creatures.' },
  { name:'Harpoon + Tranq Spear Bolt', asset:'Harpoon_Launcher.png', ammoAsset:'Tranq_Spear_Bolt.png', ammo:'Tranq Spear Bolt', torporInstant:144, torporOverTime:72, duration:5, damage:36, reload:3.8, headshot:false, note:'Underwater-compatible knockout option.' },
  { name:'Slingshot + Stone', asset:'Slingshot.png', ammoAsset:'Stone.png', ammo:'Stone', torporInstant:18.9, torporOverTime:0, duration:0, damage:14, reload:1.8, headshot:true, note:'Primitive backup for very small targets.' },
  { name:'Wooden Club', asset:'Wooden_Club.png', ammoAsset:'Wood.png', ammo:'Durability', torporInstant:40, torporOverTime:0, duration:0, damage:5, reload:1.1, headshot:false, note:'Close-range torpor for small creatures.' },
  { name:'Electric Prod', asset:'Electric_Prod.png', ammoAsset:'Sparkpowder.png', ammo:'One charge', torporInstant:266, torporOverTime:0, duration:0, damage:1, reload:2.4, headshot:false, note:'Single-use burst torpor for close-range tames.' },
  { name:'Equus Buck Kick', asset:'Equus.png', ammoAsset:'Equus.png', ammo:'No ammo', torporInstant:180, torporOverTime:0, duration:0, damage:12, reload:2.2, headshot:false, note:'Creature-based torpor with no crafted ammo.' },
];

const TAMING_NARCOTICS = [
  { name:'Bio Toxin', asset:'Bio_Toxin.png', torpor:80, duration:16, stack:100 },
  { name:'Narcotic', asset:'Narcotic.png', torpor:40, duration:8, stack:100 },
  { name:'Ascerbic Mushroom', asset:'Ascerbic_Mushroom.png', torpor:25, duration:2, stack:100 },
  { name:'Narcoberry', asset:'Narcoberry.png', torpor:7.5, duration:3, stack:100 },
];

const TAMING_FOODS = [
  { name:'Extraordinary Kibble', asset:'Extraordinary_Kibble.png', diets:['carnivore','herbivore','omnivore','piscivore'], affinity:900, food:85.2, interval:80, spoil:259200, tier:7 },
  { name:'Exceptional Kibble', asset:'Exceptional_Kibble.png', diets:['carnivore','herbivore','omnivore','piscivore'], affinity:550, food:85.2, interval:80, spoil:259200, tier:6 },
  { name:'Superior Kibble', asset:'Superior_Kibble.png', diets:['carnivore','herbivore','omnivore','piscivore'], affinity:400, food:85.2, interval:75, spoil:259200, tier:5 },
  { name:'Regular Kibble', asset:'Regular_Kibble.png', diets:['carnivore','herbivore','omnivore','piscivore'], affinity:300, food:85.2, interval:70, spoil:259200, tier:4 },
  { name:'Simple Kibble', asset:'Simple_Kibble.png', diets:['carnivore','herbivore','omnivore','piscivore'], affinity:220, food:85.2, interval:65, spoil:259200, tier:3 },
  { name:'Basic Kibble', asset:'Basic_Kibble.png', diets:['carnivore','herbivore','omnivore','piscivore'], affinity:160, food:85.2, interval:60, spoil:259200, tier:2 },
  { name:'Raw Mutton', asset:'Raw_Mutton.png', diets:['carnivore','omnivore'], affinity:190, food:50, interval:50, spoil:600, tier:6 },
  { name:'Raw Prime Meat', asset:'Raw_Prime_Meat.png', diets:['carnivore','omnivore'], affinity:150, food:50, interval:45, spoil:300, tier:5 },
  { name:'Cooked Lamb Chop', asset:'Cooked_Lamb_Chop.png', diets:['carnivore','omnivore'], affinity:95, food:25, interval:45, spoil:1200, tier:4 },
  { name:'Cooked Prime Meat', asset:'Cooked_Prime_Meat.png', diets:['carnivore','omnivore'], affinity:90, food:25, interval:45, spoil:1200, tier:3 },
  { name:'Raw Meat', asset:'Raw_Meat.png', diets:['carnivore','omnivore'], affinity:50, food:50, interval:40, spoil:1200, tier:1 },
  { name:'Raw Prime Fish Meat', asset:'Raw_Prime_Fish_Meat.png', diets:['piscivore','carnivore','omnivore'], affinity:95, food:25, interval:45, spoil:300, tier:4 },
  { name:'Raw Fish Meat', asset:'Raw_Fish_Meat.png', diets:['piscivore','carnivore','omnivore'], affinity:35, food:25, interval:35, spoil:1200, tier:1 },
  { name:'Crops', asset:'Rockarrot.png', diets:['herbivore','omnivore'], affinity:55, food:40, interval:45, spoil:3000, tier:3 },
  { name:'Mejoberry', asset:'Mejoberry.png', diets:['herbivore','omnivore'], affinity:40, food:30, interval:40, spoil:1200, tier:2 },
  { name:'Berries', asset:'Tintoberry.png', diets:['herbivore','omnivore'], affinity:30, food:20, interval:35, spoil:1200, tier:1 },
  { name:'Sweet Vegetable Cake', asset:'Sweet_Vegetable_Cake.png', diets:['herbivore','omnivore','special'], affinity:180, food:500, interval:80, spoil:7200, tier:6 },
  { name:'Rare Mushroom', asset:'Rare_Mushroom.png', diets:['herbivore','omnivore','special'], affinity:75, food:25, interval:50, spoil:12000, tier:3 },
  { name:'Rare Flower', asset:'Rare_Flower.png', diets:['herbivore','omnivore','special'], affinity:70, food:25, interval:50, spoil:12000, tier:3 },
  { name:'Ammonite Bile', asset:'Ammonite_Bile.png', diets:['special'], affinity:250, food:50, interval:60, spoil:7200, tier:5 },
  { name:'Wyvern Milk', asset:'Wyvern_Milk.png', diets:['special'], affinity:400, food:1200, interval:90, spoil:3600, tier:6 },
];

function renderTaming(){
  const dinoList=document.getElementById('taming-dino-list');
  const search=document.getElementById('taming-search');
  if(!dinoList || !search) return;
  function renderList(filter){
    dinoList.innerHTML='';
    const q=filter.toLowerCase();
    UNIQUE_DINOS.filter(d=>!q||d.name.toLowerCase().includes(q)).forEach(d=>{
      const item=el('button','calc-dino-item'+(tamingDino&&tamingDino.name===d.name?' selected':''),d.name);
      item.type='button';
      item.onclick=()=>{ tamingDino=d; updateTamingRight(); renderList(search.value); };
      dinoList.appendChild(item);
    });
  }
  renderList(search.value || '');
  search.oninput=()=>renderList(search.value);
}

function tamingProfileForDino(dino){
  const fallbackFood=Number(dino?.base?.[3]) || 1200;
  const fallbackTorpor=tamingTorporForLevel(dino || {base:[0,0,0,0,0,0,0,100],wild:[0,0,0,0,0,0,0,6]},1);
  return dino?.taming || {
    diet:'carnivore', preferredKibble:'Regular Kibble', foodBase:fallbackFood,
    foodDrainPerSecond:Math.max(0.06, fallbackFood/7200), torporDepletionRate:Math.max(0.15, Math.sqrt(fallbackTorpor)/22), tamingAffinityBase:Math.max(120, fallbackFood/6), affinityPerLevel:6
  };
}

function tamingDietForDino(dino){
  return tamingProfileForDino(dino).diet || 'carnivore';
}

function tamingTorporForLevel(dino,level){
  return Math.max(1,(Number(dino.base[7])||1)+(Number(dino.wild[7])||0)*Math.max(0,level-1));
}

function tamingHealthForLevel(dino,level){
  return Math.max(1,(Number(dino.base[0])||1)+(Number(dino.wild[0])||0)*Math.max(0,Math.round((level-1)/7)));
}

function tamingRequiredAffinity(dino,level){
  const profile=tamingProfileForDino(dino);
  const base=Number(profile.tamingAffinityBase) || Math.max(120,(Number(dino.base[3])||1200)/6);
  const perLevel=Number(profile.affinityPerLevel) || Math.max(3,base*0.025);
  return Math.max(30,base+(Math.max(1,level)-1)*perLevel);
}

function tamingTorporDrainPerSecond(dino){
  return Math.max(0,Number(tamingProfileForDino(dino).torporDepletionRate) || 0.25);
}

function tamingFoodDrainPerSecond(dino){
  return Math.max(0.01,Number(tamingProfileForDino(dino).foodDrainPerSecond) || 0.15);
}

function weaponTorporPerShot(weapon,quality,headMult){
  return (weapon.torporInstant + weapon.torporOverTime) * quality * headMult;
}

function simulateKnockout(maxTorpor,weapon,quality,headMult,secondsBetweenHits,drainPerSecond){
  let torpor=0;
  let time=0;
  let shots=0;
  const perShot=weaponTorporPerShot(weapon,quality,headMult);
  const interval=Math.max(0.1,secondsBetweenHits);
  while(torpor < maxTorpor && shots < 10000){
    torpor += perShot;
    shots++;
    if(torpor >= maxTorpor) break;
    time += interval;
    torpor = Math.max(0,torpor - drainPerSecond*interval);
  }
  return {shots,time:shots ? time + weapon.reload : 0, perShot};
}

function tamingEffectivenessForFood(amount,foodTier){
  const lossPerBite=Math.max(0.35,1.05-(foodTier*0.08));
  return Math.max(0,Math.round(100-(Math.max(0,amount-1)*lossPerBite)));
}

function formatTime(seconds){
  seconds=Math.max(0,Math.round(seconds));
  const h=Math.floor(seconds/3600);
  const m=Math.floor((seconds%3600)/60);
  const s=seconds%60;
  if(h) return `${h}h ${String(m).padStart(2,'0')}m`;
  if(m) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

function updateTamingRight(){
  const right=document.getElementById('taming-right');
  if(!right) return;
  right.innerHTML='';
  if(!tamingDino){ right.innerHTML='<div class="calc-hint">Select a dinosaur to open the taming calculator.</div>'; return; }
  const d=tamingDino;
  const draft=tamingDraft;

  const profile=tamingProfileForDino(d);
  const dietIcon=profile.diet === 'herbivore' ? 'Mejoberry.png' : profile.diet === 'piscivore' ? 'Raw_Fish_Meat.png' : profile.diet === 'special' ? 'Sweet_Vegetable_Cake.png' : 'Raw_Meat.png';
  const hero=el('section','taming-hero');
  hero.innerHTML=`
    <div>
      <p class="eyebrow">Taming Calculator</p>
      <h2>${d.name}</h2>
      <p>Dododex-style planning for knockout shots, torpor upkeep, food, and creature base stats.</p>
    </div>
    <div class="taming-creature-mark">${assetImg(dietIcon, profile.diet + ' diet')}</div>
  `;
  right.appendChild(hero);

  const controls=el('section','taming-card taming-controls');
  controls.innerHTML=`
    <label><span>Wild Level</span><input id="tame-level" type="number" min="1" max="500" value="${draft.level}"></label>
    <label><span>Taming Speed</span><input id="tame-speed" type="number" min="0.1" step="0.1" value="${draft.tamingSpeed}"></label>
    <label><span>Food Drain</span><input id="tame-food-drain" type="number" min="0.1" step="0.1" value="${draft.foodDrain}"></label>
    <label><span>Weapon Quality %</span><input id="tame-quality" type="number" min="1" step="1" value="${draft.weaponQuality}"></label>
    <label><span>Seconds Between Hits</span><input id="tame-hit-gap" type="range" min="0.5" max="12" step="0.5" value="${draft.secondsBetweenHits}"><strong id="tame-hit-gap-value">${draft.secondsBetweenHits}s</strong></label>
    <label class="toggle-row"><span>Headshots available</span><input id="tame-headshots" type="checkbox" ${draft.headshots?'checked':''}></label>
  `;
  right.appendChild(controls);

  const baseCard=el('section','taming-card');
  baseCard.appendChild(el('h3','','Base Stats Used From data.js'));
  const baseGrid=el('div','taming-base-grid');
  STATS.forEach((stat,i)=>{
    const item=el('div','taming-base-stat');
    item.innerHTML=`<span>${stat}</span><strong>${formatStatValue(d.base[i],i)}</strong><small>+${formatStatValue(d.wild[i],i)} / wild lvl</small>`;
    baseGrid.appendChild(item);
  });
  baseCard.appendChild(baseGrid);
  right.appendChild(baseCard);

  const results=el('div','taming-results');
  right.appendChild(results);

  function recalcTaming(){
    draft.level=Math.max(1,+qs('#tame-level',controls).value||1);
    draft.tamingSpeed=Math.max(0.1,+qs('#tame-speed',controls).value||1);
    draft.foodDrain=Math.max(0.1,+qs('#tame-food-drain',controls).value||1);
    draft.weaponQuality=Math.max(1,+qs('#tame-quality',controls).value||100);
    draft.secondsBetweenHits=Math.max(0.5,+qs('#tame-hit-gap',controls).value||5);
    qs('#tame-hit-gap-value',controls).textContent=`${draft.secondsBetweenHits}s`;
    draft.headshots=qs('#tame-headshots',controls).checked;

    const profile=tamingProfileForDino(d);
    const maxTorpor=tamingTorporForLevel(d,draft.level);
    const estHealth=tamingHealthForLevel(d,draft.level);
    const torporDrainPerSecond=tamingTorporDrainPerSecond(d);
    const drainPerMin=torporDrainPerSecond*60;
    const foodDrainPerSecond=tamingFoodDrainPerSecond(d)*draft.foodDrain;
    const koSafeWindow=maxTorpor/Math.max(0.01,torporDrainPerSecond);
    const affinityNeeded=tamingRequiredAffinity(d,draft.level)/draft.tamingSpeed;
    const diet=tamingDietForDino(d);
    const foods=TAMING_FOODS.filter(f=>diet === 'omnivore' ? !f.diets.includes('special') : f.diets.includes(diet)).sort((a,b)=>{
      const preferred=(a.name===profile.preferredKibble ? -1000 : 0) - (b.name===profile.preferredKibble ? -1000 : 0);
      return preferred || b.tier-a.tier || b.affinity-a.affinity;
    }).slice(0,8);

    results.innerHTML='';
    const summary=el('section','taming-card taming-summary-grid');
    summary.innerHTML=`
      <div><span>Max Torpor</span><strong>${Math.round(maxTorpor).toLocaleString()}</strong><small>Base ${formatStatValue(d.base[7],7)} + level torpor</small></div>
      <div><span>Est. Health</span><strong>${Math.round(estHealth).toLocaleString()}</strong><small>Uses ${STATS[0]} base stat</small></div>
      <div><span>Torpor Drain</span><strong>${drainPerMin.toFixed(drainPerMin < 10 ? 1 : 0)}/min</strong><small>${torporDrainPerSecond.toFixed(3)} torpor per second</small></div>
      <div><span>Unconscious Timer</span><strong>${formatTime(koSafeWindow)}</strong><small>Time from full torpor to wake-up</small></div>
    `;
    results.appendChild(summary);

    const weaponCard=el('section','taming-card');
    weaponCard.appendChild(el('h3','','Weapons & Ammunition'));
    const weaponGrid=el('div','taming-weapon-scroller');
    TAMING_WEAPONS.forEach(w=>{
      const quality=draft.weaponQuality/100;
      const headMult=draft.headshots && w.headshot ? 3 : 1;
      const ko=simulateKnockout(maxTorpor,w,quality,headMult,draft.secondsBetweenHits,torporDrainPerSecond);
      const torporPer=ko.perShot;
      const damagePer=w.damage*quality*headMult;
      const shots=ko.shots;
      const totalDamage=shots*damagePer;
      const risk=totalDamage>estHealth*0.75 ? 'danger' : (totalDamage>estHealth*0.45 ? 'warn' : 'safe');
      const row=el('article',`taming-item weapon ${risk}`);
      row.innerHTML=`
        <div class="asset-icon weapon-pair">${assetImg(w.asset,w.name)}${assetImg(w.ammoAsset,w.ammo)}</div>
        <div class="taming-item-main">
          <strong>${w.name}</strong>
          <span>${w.ammo}</span>
          <small>${w.note}</small>
        </div>
        <div class="taming-metric"><strong>${shots}</strong><span>shots</span></div>
        <div class="taming-metric"><strong>${Math.round(torporPer)}</strong><span>torpor/shot</span></div>
        <div class="taming-metric"><strong>${formatTime(ko.time)}</strong><span>KO time</span></div>
      `;
      weaponGrid.appendChild(row);
    });
    weaponCard.appendChild(weaponGrid);
    results.appendChild(weaponCard);

    const narcCard=el('section','taming-card');
    narcCard.appendChild(el('h3','','Narcotics Needed'));
    const longestFoodSeconds=foods.length ? Math.max(...foods.map(f=>Math.ceil(affinityNeeded/f.affinity)*(f.food/foodDrainPerSecond))) : 0;
    const torporToHold=Math.max(0,(longestFoodSeconds*torporDrainPerSecond)-maxTorpor);
    const narcGrid=el('div','taming-grid compact');
    TAMING_NARCOTICS.forEach(n=>{
      const amount=Math.ceil(torporToHold/n.torpor);
      const stacks=Math.ceil(amount/n.stack);
      const row=el('article','taming-item');
      row.innerHTML=`<div class="asset-icon">${assetImg(n.asset,n.name)}</div><div class="taming-item-main"><strong>${n.name}</strong><span>${n.torpor} torpor each</span></div><div class="taming-metric"><strong>${amount}</strong><span>needed</span></div><div class="taming-metric"><strong>${stacks}</strong><span>stacks</span></div>`;
      narcGrid.appendChild(row);
    });
    narcCard.appendChild(narcGrid);
    results.appendChild(narcCard);

    const foodCard=el('section','taming-card');
    foodCard.appendChild(el('h3','',`Food (${diet[0].toUpperCase()+diet.slice(1)})`));
    const foodGrid=el('div','taming-grid');
    foods.forEach(f=>{
      const amount=Math.ceil(affinityNeeded/f.affinity);
      const timeSeconds=amount*(f.food/foodDrainPerSecond);
      const spoilBuffer=f.spoil ? Math.max(0,Math.ceil(timeSeconds/f.spoil)-1) : 0;
      const row=el('article','taming-item food');
      row.innerHTML=`
        <div class="asset-icon">${assetImg(f.asset,f.name)}</div>
        <div class="taming-item-main"><strong>${f.name}</strong><span>${f.affinity} affinity · ${f.food} food</span><small>${spoilBuffer ? `Bring +${spoilBuffer} for spoilage buffer.` : 'No extra spoilage buffer estimated.'}</small></div>
        <div class="taming-metric"><strong>${amount}</strong><span>food</span></div>
        <div class="taming-metric"><strong>${formatTime(timeSeconds)}</strong><span>time</span></div>
        <div class="taming-metric"><strong>${tamingEffectivenessForFood(amount,f.tier)}%</strong><span>effectiveness</span></div>
      `;
      foodGrid.appendChild(row);
    });
    foodCard.appendChild(foodGrid);
    const note=el('p','taming-note','Food and narcotic estimates use each creature’s data.js taming profile: base Food, food-drain rate, torpor-depletion rate, diet, preferred kibble tier, and affinity scaling. Special/passive tames still require in-game judgment.');
    foodCard.appendChild(note);
    results.appendChild(foodCard);
  }

  controls.querySelectorAll('input').forEach(input=>input.oninput=recalcTaming);
  recalcTaming();
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-tab').forEach(tab=>{ tab.onclick=()=>switchPage(tab.dataset.page); });
  document.getElementById('add-line-btn').onclick=()=>{ lines.push(newLine()); saveLines(); renderLines(); };
  renderLines(); renderCalc(); updateCalcRight(); renderTaming(); updateTamingRight();
});
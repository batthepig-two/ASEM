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

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-tab').forEach(tab=>{ tab.onclick=()=>switchPage(tab.dataset.page); });
  document.getElementById('add-line-btn').onclick=()=>{ lines.push(newLine()); saveLines(); renderLines(); };
  renderLines(); renderCalc(); updateCalcRight();
});
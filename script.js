const TYPES={
  circolare:{label:'Circolare',color:'var(--circolare)'},
  consiglio:{label:'Consiglio / Collegio',color:'var(--consiglio)'},
  ricevimento:{label:'Ricevimento genitori',color:'var(--ricevimento)'},
  scadenza:{label:'Scadenza',color:'var(--scadenza)'},
  personale:{label:'Personale',color:'var(--personale)'}
};
const KEY='schoolCalendar.v1', NAME_KEY='schoolCalendar.docente';
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];

let events=[], view=new Date(), selected=iso(new Date()), filters=new Set(Object.keys(TYPES)), query='', editingId=null, confirmId=null;
view.setDate(1);

function store(get,val){try{return get?JSON.parse(localStorage.getItem(KEY)):localStorage.setItem(KEY,JSON.stringify(val))}catch(e){return null}}
function seed(){
  const t=new Date(), y=t.getFullYear(), m=t.getMonth();
  const d=n=>iso(new Date(y,m,n));
  return [
    {id:1,title:'Convocazione Collegio Docenti',type:'consiglio',num:'98',date:d(12),start:'15:00',end:'17:00',place:'Aula Magna',desc:'O.d.g.: approvazione PTOF, verifica programmazione, varie ed eventuali.',sign:true},
    {id:2,title:'Ricevimento generale genitori',type:'ricevimento',num:'101',date:d(18),start:'15:00',end:'18:30',place:'https://meet.google.com/abc-defg-hij',desc:'Prenotazione tramite registro elettronico Argo.',sign:false},
    {id:3,title:'Consegna proposte libri di testo',type:'scadenza',num:'104',date:d(20),start:'',end:'',place:'Segreteria didattica',desc:'Entro le ore 12:00. Modulo scaricabile dalla circolare PDF.',sign:true},
    {id:4,title:'Consiglio di classe 5F TPSIT',type:'consiglio',num:'107',date:d(24),start:'14:30',end:'16:00',place:'Aula 5F',desc:'Andamento didattico e disciplinare, PCTO.',sign:true},
    {id:5,title:'Sciopero del personale – comunicazione alle famiglie',type:'circolare',num:'110',date:d(26),start:'',end:'',place:'Circolare PDF su Argo',desc:'Possibili variazioni di orario. Presa visione obbligatoria.',sign:true},
    {id:6,title:'Visita medica',type:'personale',num:'',date:d(14),start:'09:30',end:'10:30',place:'',desc:'',sign:false}
  ].map(e=>({...e,signedBy:null,signedAt:null}));
}
function load(){events=store(true)||seed();}
function save(){store(false,events)}

function sorted(list){return list.slice().sort((a,b)=>(a.date+(a.start||'')).localeCompare(b.date+(b.start||'')))}
function visible(){
  const q=query.trim().toLowerCase();
  return events.filter(e=>filters.has(e.type)&&(!q||(e.title+' '+e.desc+' '+e.place+' '+e.num).toLowerCase().includes(q)));
}

function renderLegend(){
  $('#legend').innerHTML='<b style="margin-bottom:4px">Categorie</b>'+Object.entries(TYPES).map(([k,t])=>
    `<label class="chip"><input type="checkbox" data-k="${k}" ${filters.has(k)?'checked':''}><span class="dot" style="background:${t.color}"></span>${t.label}</label>`).join('');
}
function renderCalendar(){
  $('#title').textContent=`${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
  $('#dows').innerHTML=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=>`<div class="dow">${x}</div>`).join('');
  const first=new Date(view.getFullYear(),view.getMonth(),1);
  const offset=(first.getDay()+6)%7;
  const start=new Date(first); start.setDate(1-offset);
  const list=visible(), todayIso=iso(new Date());
  let html='';
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const k=iso(d), evs=sorted(list.filter(e=>e.date===k));
    html+=`<button class="day ${d.getMonth()!==view.getMonth()?'out':''} ${k===selected?'sel':''} ${k===todayIso?'today':''} ${evs.some(e=>e.sign&&!e.signedBy)?'need':''}" data-d="${k}" aria-label="${d.getDate()} ${MONTHS[d.getMonth()]}, ${evs.length} eventi">
      <span class="n">${d.getDate()}</span>
      ${evs.slice(0,3).map(e=>`<span class="ev ${e.signedBy?'signed':''}" style="--c:${TYPES[e.type].color}">${esc(e.title)}</span>`).join('')}
      ${evs.length>3?`<span class="more">+${evs.length-3} altri</span>`:''}</button>`;
  }
  $('#grid').innerHTML=html;
}
function renderPanel(){
  const d=new Date(selected+'T00:00:00');
  const evs=sorted(visible().filter(e=>e.date===selected));
  const label=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  $('#panel').innerHTML=`<h3>${label}</h3><div class="sub">${evs.length?evs.length+' elementi':'Nessun elemento'}</div>`+
  (evs.length?evs.map(e=>{
    const t=TYPES[e.type], time=e.start?`${e.start}${e.end?' – '+e.end:''}`:'Tutto il giorno';
    const place=/^https?:\/\//.test(e.place)?`<a href="${esc(e.place)}" target="_blank" rel="noopener">${esc(e.place)}</a>`:esc(e.place);
    return `<article class="item" style="--c:${t.color}">
      <span class="tag">${t.label}${e.num?' · circ. n. '+esc(e.num):''}</span>
      <h4>${esc(e.title)}</h4>
      <div class="meta">🕒 ${time}${e.place?'<br>📍 '+place:''}</div>
      ${e.desc?`<p class="desc">${esc(e.desc)}</p>`:''}
      ${e.sign?(e.signedBy?`<div class="sig">✓ Firmata da ${esc(e.signedBy)} il ${new Date(e.signedAt).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'})}</div>`:'<div class="need">Richiede la tua firma</div>'):''}
      <div class="actions">
        ${e.sign?(e.signedBy?`<button class="btn ghost sm" data-a="unsign" data-id="${e.id}">Annulla firma</button>`:`<button class="btn sm" data-a="sign" data-id="${e.id}">Firma presa visione</button>`):''}
        <button class="btn ghost sm" data-a="edit" data-id="${e.id}">Modifica</button>
        <button class="btn danger sm" data-a="del" data-id="${e.id}">${confirmId===e.id?'Conferma eliminazione':'Elimina'}</button>
      </div></article>`;
  }).join(''):'<div class="empty">Giornata libera.<br>Usa “Nuova circolare / evento” per aggiungerne uno.</div>')+
  `<button class="btn ghost full" id="addHere">+ Aggiungi in questa data</button>`;
}
function renderPending(){$('#pending').textContent=events.filter(e=>e.sign&&!e.signedBy).length}
function render(){renderLegend();renderCalendar();renderPanel();renderPending()}

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2200)}

function openForm(id,date){
  editingId=id||null;
  const e=events.find(x=>x.id===id)||{title:'',type:'circolare',num:'',date:date||selected,start:'',end:'',place:'',desc:'',sign:false};
  $('#dlgTitle').textContent=id?'Modifica elemento':'Nuova circolare';
  $('#fTitle').value=e.title;$('#fType').value=e.type;$('#fNum').value=e.num;$('#fDate').value=e.date;
  $('#fStart').value=e.start;$('#fEnd').value=e.end;$('#fPlace').value=e.place;$('#fDesc').value=e.desc;$('#fSign').checked=e.sign;
  $('#dlg').showModal();$('#fTitle').focus();
}

// Eventi
$('#fType').innerHTML=Object.entries(TYPES).map(([k,t])=>`<option value="${k}">${t.label}</option>`).join('');
$('#btnNew').onclick=()=>openForm(null);
$('#btnCancel').onclick=()=>$('#dlg').close();
$('#form').addEventListener('submit',ev=>{
  ev.preventDefault();
  const end=$('#fEnd').value,start=$('#fStart').value;
  if(start&&end&&end<start){toast('L’ora di fine deve essere dopo l’inizio');return}
  const data={title:$('#fTitle').value.trim(),type:$('#fType').value,num:$('#fNum').value.trim(),date:$('#fDate').value,start,end,
    place:$('#fPlace').value.trim(),desc:$('#fDesc').value.trim(),sign:$('#fSign').checked};
  if(editingId){const e=events.find(x=>x.id===editingId);Object.assign(e,data);if(!e.sign){e.signedBy=null;e.signedAt=null}toast('Modifiche salvate')}
  else{events.push({id:Date.now(),...data,signedBy:null,signedAt:null});toast('Elemento aggiunto')}
  selected=data.date;const d=new Date(data.date+'T00:00:00');view=new Date(d.getFullYear(),d.getMonth(),1);
  save();$('#dlg').close();render();
});
$('#legend').addEventListener('change',e=>{const k=e.target.dataset.k;e.target.checked?filters.add(k):filters.delete(k);render()});
$('#grid').addEventListener('click',e=>{const b=e.target.closest('.day');if(!b)return;selected=b.dataset.d;confirmId=null;render()});
$('#prev').onclick=()=>{view.setMonth(view.getMonth()-1);render()};
$('#next').onclick=()=>{view.setMonth(view.getMonth()+1);render()};
$('#today').onclick=()=>{const n=new Date();view=new Date(n.getFullYear(),n.getMonth(),1);selected=iso(n);render()};
$('#q').oninput=e=>{query=e.target.value;render()};
$('#docente').oninput=e=>{try{localStorage.setItem(NAME_KEY,e.target.value)}catch(x){}};
$('#panel').addEventListener('click',ev=>{
  if(ev.target.id==='addHere'){openForm(null,selected);return}
  const b=ev.target.closest('button[data-a]');if(!b)return;
  const id=+b.dataset.id,e=events.find(x=>x.id===id),a=b.dataset.a;
  if(a==='sign'){
    const n=$('#docente').value.trim();
    if(!n){toast('Inserisci il tuo nome nel campo “Docente” per firmare');$('#docente').focus();return}
    e.signedBy=n;e.signedAt=new Date().toISOString();save();toast('Presa visione firmata');
  }else if(a==='unsign'){e.signedBy=null;e.signedAt=null;save();toast('Firma annullata')}
  else if(a==='edit'){openForm(id);return}
  else if(a==='del'){
    if(confirmId===id){events=events.filter(x=>x.id!==id);confirmId=null;save();toast('Elemento eliminato')}
    else{confirmId=id;render();return}
  }
  confirmId=null;render();
});

try{$('#docente').value=localStorage.getItem(NAME_KEY)||''}catch(e){}
const THEMES={chiaro:'Chiaro',scuro:'Scuro'};
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('schoolCalendar.theme',t)}catch(e){}
  document.querySelectorAll('#themes button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===t))}
$('#themes').innerHTML=Object.entries(THEMES).map(([k,v])=>`<button class="theme" data-t="${k}" aria-pressed="false">${v}</button>`).join('');
$('#themes').onclick=e=>{const b=e.target.closest('button');if(b)setTheme(b.dataset.t)};
let savedTheme=null;try{savedTheme=localStorage.getItem('schoolCalendar.theme')}catch(e){}
setTheme(THEMES[savedTheme]?savedTheme:(matchMedia('(prefers-color-scheme:dark)').matches?'scuro':'chiaro'));
load();render();

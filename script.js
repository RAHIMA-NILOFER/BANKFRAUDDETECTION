/* ============================================================
   SENTRY WATCH — Digital Banking Fraud Investigation Platform
   Frontend-only prototype. No backend. No build tools.
   ============================================================ */

/* ---------------------------------------------------------
   1. UTILITIES
   --------------------------------------------------------- */
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(88172645);
function rnd(){ return rng(); }
function rndInt(min,max){ return Math.floor(rnd()*(max-min+1))+min; }
function pick(arr){ return arr[rndInt(0,arr.length-1)]; }
function pickWeighted(pairs){ // [[item,weight],...]
  const total = pairs.reduce((s,p)=>s+p[1],0);
  let r = rnd()*total;
  for(const [item,w] of pairs){ if(r<w) return item; r-=w; }
  return pairs[0][0];
}
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=rndInt(0,i); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function pad(n,len){ return String(n).padStart(len,'0'); }
function fmtMoney(n,cur='USD'){
  const sym = cur==='USD'?'$':cur==='EUR'?'\u20ac':cur==='GBP'?'\u00a3':cur+' ';
  const neg = n<0;
  const v = Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return (neg?'\u2212':'')+sym+v;
}
function fmtDate(d){
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'});
}
function fmtDateTime(d){
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'})+' \u00b7 '+
    dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
function timeAgo(d){
  const diff = Date.now()-new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if(m<1) return 'just now';
  if(m<60) return m+'m ago';
  const h = Math.floor(m/60);
  if(h<24) return h+'h ago';
  const days = Math.floor(h/24);
  if(days<30) return days+'d ago';
  return fmtDate(d);
}
function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function daysAgo(n){ const d=new Date(NOW); d.setDate(d.getDate()-n); d.setHours(rndInt(0,23),rndInt(0,59),rndInt(0,59)); return d.toISOString(); }
function hoursAgo(n){ const d=new Date(NOW); d.setHours(d.getHours()-n, rndInt(0,59)); return d.toISOString(); }
function uid(prefix){ return prefix; }

const NOW = new Date('2026-09-24T15:40:00');

/* ---------------------------------------------------------
   2. REFERENCE DATA
   --------------------------------------------------------- */
const FIRST_NAMES = ['James','Maria','Robert','Linda','Michael','Patricia','David','Jennifer','Carlos','Sofia','Daniel','Elena','Kevin','Aisha','Thomas','Grace','Peter','Naomi','Samuel','Priya','Ethan','Chloe','Marcus','Olivia','Liam','Noor','Victor','Hana','Ahmed','Isabella'];
const LAST_NAMES = ['Whitfield','Torres','Chen','Okafor','Novak','Reyes','Larsson','Patel','Moreau','Kim','Rossi','Dubois','Nakamura','Silva','Muller','Petrov','Haddad','Ferreira','Kovac','Andersen','Bianchi','Suarez','Lindqvist','Osei','Bergstrom','Costa','Ivanov','Faruqi','Wallace','Delgado'];
const CITIES = [
  {city:'New York', country:'USA', lat:40.71, lng:-74.01, risk:'low'},
  {city:'Chicago', country:'USA', lat:41.88, lng:-87.63, risk:'low'},
  {city:'Austin', country:'USA', lat:30.27, lng:-97.74, risk:'low'},
  {city:'Miami', country:'USA', lat:25.76, lng:-80.19, risk:'medium'},
  {city:'Seattle', country:'USA', lat:47.61, lng:-122.33, risk:'low'},
  {city:'Toronto', country:'Canada', lat:43.65, lng:-79.38, risk:'low'},
  {city:'London', country:'UK', lat:51.51, lng:-0.13, risk:'low'},
  {city:'Berlin', country:'Germany', lat:52.52, lng:13.40, risk:'low'},
  {city:'Lisbon', country:'Portugal', lat:38.72, lng:-9.14, risk:'medium'},
  {city:'Warsaw', country:'Poland', lat:52.23, lng:21.01, risk:'medium'},
  {city:'Lagos', country:'Nigeria', lat:6.52, lng:3.38, risk:'high'},
  {city:'Manila', country:'Philippines', lat:14.60, lng:120.98, risk:'high'},
  {city:'Jakarta', country:'Indonesia', lat:-6.20, lng:106.85, risk:'high'},
  {city:'Lahore', country:'Pakistan', lat:31.55, lng:74.34, risk:'high'},
  {city:'Kyiv', country:'Ukraine', lat:50.45, lng:30.52, risk:'high'},
  {city:'Moscow', country:'Russia', lat:55.75, lng:37.62, risk:'critical'},
  {city:'Lagos Free Zone', country:'Nigeria', lat:6.44, lng:3.39, risk:'critical'},
  {city:'Sao Paulo', country:'Brazil', lat:-23.55, lng:-46.63, risk:'medium'},
  {city:'Dubai', country:'UAE', lat:25.20, lng:55.27, risk:'medium'},
  {city:'Singapore', country:'Singapore', lat:1.35, lng:103.82, risk:'low'},
];
const HOME_CITIES = CITIES.slice(0,6);
const MERCHANTS = [
  {name:'Meridian Grocers', cat:'Groceries'}, {name:'Northwind Electronics', cat:'Electronics'},
  {name:'BluePeak Airlines', cat:'Travel'}, {name:'Cascade Fuel Stop', cat:'Fuel'},
  {name:'Vantage Home Goods', cat:'Retail'}, {name:'Solace Wellness Spa', cat:'Health'},
  {name:'Ironclad Hardware', cat:'Retail'}, {name:'Harbor & Vine Wines', cat:'Dining'},
  {name:'Ledger Coffee Co.', cat:'Dining'}, {name:'Zenith Streaming', cat:'Subscription'},
  {name:'Orbit Mobile Top-Up', cat:'Telecom'}, {name:'Crestline Insurance', cat:'Insurance'},
  {name:'Pinnacle Electronics Direct', cat:'Electronics'}, {name:'Quickcart Express', cat:'Retail'},
  {name:'Fenwick Jewelers', cat:'Luxury'}, {name:'Global Wire Transfer Co.', cat:'Transfer'},
  {name:'Nimbus Cloud Hosting', cat:'Subscription'}, {name:'Silverline Casino Chips', cat:'Gaming'},
  {name:'Atlas Crypto Exchange', cat:'Crypto'}, {name:'Union Rail Tickets', cat:'Travel'},
  {name:'Prime Rate ATM Network', cat:'ATM'}, {name:'Bayshore Auto Parts', cat:'Retail'},
  {name:'Willow Pharmacy', cat:'Health'}, {name:'Trellis Utility Payments', cat:'Utilities'},
  {name:'Beacon Freight Logistics', cat:'Business'},
];
const DEVICE_MODELS = [
  {type:'Mobile', os:'iOS 18.1', model:'iPhone 15 Pro', browser:'Safari Mobile'},
  {type:'Mobile', os:'Android 15', model:'Galaxy S24', browser:'Chrome Mobile'},
  {type:'Mobile', os:'Android 14', model:'Pixel 9', browser:'Chrome Mobile'},
  {type:'Desktop', os:'Windows 11', model:'PC', browser:'Chrome 129'},
  {type:'Desktop', os:'macOS Sequoia', model:'MacBook Pro', browser:'Safari 18'},
  {type:'Desktop', os:'Windows 10', model:'PC', browser:'Edge 128'},
  {type:'Tablet', os:'iPadOS 18', model:'iPad Air', browser:'Safari Mobile'},
  {type:'Desktop', os:'Linux', model:'ThinkPad', browser:'Firefox 130'},
  {type:'Mobile', os:'Android 13', model:'OnePlus 12', browser:'Chrome Mobile'},
];
const INVESTIGATORS = ['R. Mercer','T. Okonjo','S. Balewa','J. Whitcombe','M. Alvarez','K. Sundstrom','A. Farouk'];
const TXN_TYPES = ['Purchase','Transfer','Withdrawal','Deposit','ATM','Online Payment','Wire Transfer','Bill Pay'];
const ALERT_TYPES = [
  'Unusual Transaction Amount','Impossible Travel Detected','Unrecognized Device Login',
  'Repeated Failed Authentication','Suspicious Device Fingerprint','Account Takeover Indicator',
  'High-Risk Geographic Location','Velocity Check Triggered','New Payee High Value Transfer',
  'Card-Not-Present Anomaly','Dormant Account Reactivation','Structuring Pattern Detected'
];

/* ---------------------------------------------------------
   3. DATA GENERATION (deterministic, cross-linked)
   --------------------------------------------------------- */
const CUSTOMER_COUNT = 30, ACCOUNT_COUNT = 30, DEVICE_COUNT = 25,
      TXN_COUNT = 60, ALERT_COUNT = 30, CASE_COUNT = 20, EVIDENCE_COUNT = 30;

let customers=[], accounts=[], devices=[], transactions=[], alerts=[], cases=[], evidence=[], notificationsSeed=[];

function genCustomers(){
  const used = new Set();
  for(let i=1;i<=CUSTOMER_COUNT;i++){
    let name;
    do{ name = pick(FIRST_NAMES)+' '+pick(LAST_NAMES); }while(used.has(name));
    used.add(name);
    const home = pick(HOME_CITIES);
    const risk = pickWeighted([['low',44],['medium',30],['high',18],['critical',8]]);
    const riskScore = risk==='low'?rndInt(5,29):risk==='medium'?rndInt(30,54):risk==='high'?rndInt(55,79):rndInt(80,98);
    const segment = pickWeighted([['Retail',55],['Premium',30],['Business',15]]);
    const status = risk==='critical' && rnd()<0.6 ? 'Flagged' : (risk==='critical' && rnd()<0.3 ? 'Suspended' : 'Active');
    customers.push({
      id:'CUST-'+pad(i,4), name, segment,
      email: name.toLowerCase().replace(/[^a-z ]/g,'').replace(' ','.')+'@'+pick(['maillink.com','postbox.net','coreinbox.com','veridian.io'])+'',
      phone:'+1 ('+rndInt(200,999)+') '+rndInt(200,999)+'-'+pad(rndInt(0,9999),4),
      city:home.city, country:home.country,
      joinDate: daysAgo(rndInt(90,2200)),
      riskScore, riskLevel: risk, status,
      accountIds:[], deviceIds:[],
      kyc: pickWeighted([['Verified',80],['Pending Review',13],['Unverified',7]]),
    });
  }
}

function genAccounts(){
  const types = [['Checking',50],['Savings',30],['Credit Line',20]];
  for(let i=1;i<=ACCOUNT_COUNT;i++){
    const cust = customers[i-1];
    const type = pickWeighted(types);
    const bal = type==='Credit Line' ? -rndInt(200,18000) : rndInt(120,240000);
    const acc = {
      id:'ACC-'+pad(i,5), customerId: cust.id, type,
      number: '\u2022\u2022\u2022\u2022 '+pad(rndInt(0,9999),4),
      balance: bal, currency:'USD',
      openDate: cust.joinDate,
      status: cust.status==='Suspended' ? 'Frozen' : (cust.riskLevel==='critical' && rnd()<0.4 ? 'Under Review' : 'Active'),
      riskScore: Math.min(99, Math.max(2, cust.riskScore + rndInt(-10,10))),
    };
    accounts.push(acc);
    cust.accountIds.push(acc.id);
  }
}

function genDevices(){
  // ensure every customer has at least one device; extra devices assigned to random customers (shared device = takeover signal)
  for(let i=1;i<=DEVICE_COUNT;i++){
    const spec = pick(DEVICE_MODELS);
    const trust = pickWeighted([['Trusted',60],['Unrecognized',25],['Suspicious',15]]);
    devices.push({
      id:'DEV-'+pad(i,4), type:spec.type, os:spec.os, model:spec.model, browser:spec.browser,
      fingerprint: Array.from({length:4},()=>pad(rndInt(0,65535).toString(16),4)).join('-').toUpperCase(),
      ip: rndInt(10,223)+'.'+rndInt(0,255)+'.'+rndInt(0,255)+'.'+rndInt(1,254),
      firstSeen: daysAgo(rndInt(30,900)),
      lastSeen: daysAgo(rndInt(0,20)),
      trustStatus: trust,
      customerIds: [],
    });
  }
  customers.forEach(c=>{
    const n = rnd()<0.18 ? 2 : 1;
    for(let k=0;k<n;k++){
      const d = pick(devices);
      if(!d.customerIds.includes(c.id)) d.customerIds.push(c.id);
      if(!c.deviceIds.includes(d.id)) c.deviceIds.push(d.id);
    }
  });
  devices.forEach(d=>{ if(d.customerIds.length===0){ const c = pick(customers); d.customerIds.push(c.id); c.deviceIds.push(d.id); } });
}

const TXN_FLAG_POOL = ['Unusual Location','Impossible Travel','Unusual Amount','Repeated Failed Attempts','Suspicious Device','Account Takeover Indicator','New Payee','High Velocity'];

function genTransactions(){
  const statuses = [['Approved',52],['Flagged',22],['Blocked',12],['Pending',8],['Reversed',6]];
  for(let i=1;i<=TXN_COUNT;i++){
    const acc = pick(accounts);
    const cust = customers.find(c=>c.id===acc.customerId);
    const dev = devices.find(d=>d.customerIds.includes(cust.id)) || pick(devices);
    const type = pick(TXN_TYPES);
    const merch = pick(MERCHANTS);
    const foreignChance = rnd();
    const loc = foreignChance<0.28 ? pick(CITIES) : pick(HOME_CITIES);
    const amount = pickWeighted([['small',45],['medium',35],['large',15],['huge',5]])==='small'? rndInt(8,180) :
                   (rndInt(0,1)?rndInt(181,1200): rndInt(1201,4800));
    const riskBase = loc.risk==='critical'?70:loc.risk==='high'?50:loc.risk==='medium'?28:8;
    const devRisk = dev.trustStatus==='Suspicious'?28:dev.trustStatus==='Unrecognized'?14:0;
    const amtRisk = amount>3000?22:amount>1200?10:0;
    let riskScore = Math.min(99, Math.max(2, riskBase+devRisk+amtRisk+rndInt(-8,10)));
    const status = pickWeighted(statuses);
    const flags = [];
    if(loc.city!==cust.city && loc.risk!=='low' && rnd()<0.7) flags.push('Unusual Location');
    if(dev.trustStatus!=='Trusted' && rnd()<0.6) flags.push('Suspicious Device');
    if(amount>2200 && rnd()<0.55) flags.push('Unusual Amount');
    if(rnd()<0.12) flags.push('Impossible Travel');
    if(rnd()<0.1) flags.push('Repeated Failed Attempts');
    if(rnd()<0.08) flags.push('Account Takeover Indicator');
    if(status==='Blocked' && flags.length===0) flags.push('Unusual Amount');
    transactions.push({
      id:'TXN-'+pad(i,6), accountId:acc.id, customerId:cust.id, deviceId:dev.id,
      amount, currency:'USD', merchant:merch.name, category:merch.cat,
      city:loc.city, country:loc.country, lat:loc.lat, lng:loc.lng, locRisk:loc.risk,
      type, timestamp: daysAgo(rndInt(0,45)),
      riskScore, status, flags,
    });
  }
  transactions.sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
}

function genAlerts(){
  const highRiskTxns = shuffle(transactions.filter(t=>t.riskScore>=45 || t.flags.length>0));
  const pool = highRiskTxns.length>=ALERT_COUNT ? highRiskTxns.slice(0,ALERT_COUNT) : highRiskTxns.concat(shuffle(transactions).slice(0,ALERT_COUNT-highRiskTxns.length));
  for(let i=1;i<=ALERT_COUNT;i++){
    const txn = pool[i-1] || pick(transactions);
    const cust = customers.find(c=>c.id===txn.customerId);
    const sev = txn.riskScore>=80?'Critical':txn.riskScore>=60?'High':txn.riskScore>=35?'Medium':'Low';
    const status = pickWeighted([['Open',30],['Investigating',30],['Resolved',28],['Dismissed',12]]);
    alerts.push({
      id:'ALT-'+pad(i,4),
      type: txn.flags[0] ? mapFlagToAlertType(txn.flags[0]) : pick(ALERT_TYPES),
      severity: sev,
      transactionId: txn.id, customerId: cust.id, accountId: txn.accountId,
      description: buildAlertDescription(txn,cust),
      createdAt: txn.timestamp,
      status, assignedTo: status==='Open'? null : pick(INVESTIGATORS),
    });
  }
}
function mapFlagToAlertType(flag){
  const map = {
    'Unusual Location':'High-Risk Geographic Location','Impossible Travel':'Impossible Travel Detected',
    'Unusual Amount':'Unusual Transaction Amount','Repeated Failed Attempts':'Repeated Failed Authentication',
    'Suspicious Device':'Suspicious Device Fingerprint','Account Takeover Indicator':'Account Takeover Indicator',
    'New Payee':'New Payee High Value Transfer','High Velocity':'Velocity Check Triggered',
  };
  return map[flag] || pick(ALERT_TYPES);
}
function buildAlertDescription(txn,cust){
  return `Transaction ${txn.id} of ${fmtMoney(txn.amount)} at ${txn.merchant} (${txn.city}, ${txn.country}) flagged for ${cust.name}'s account with a risk score of ${txn.riskScore}.`;
}

const CASE_TITLES = [
  'Suspected account takeover via new device','Card-not-present fraud ring investigation',
  'Cross-border wire structuring pattern','Impossible travel on POS transactions',
  'Synthetic identity onboarding review','Mule account fund flow analysis',
  'Repeated ATM velocity abuse','Phishing-linked credential compromise',
  'Unauthorized recurring subscription charges','High-value jewelry purchase anomaly',
  'Crypto exchange off-ramp laundering check','Dormant account reactivation fraud',
  'Business email compromise wire fraud','Elder financial exploitation review',
  'Chargeback abuse pattern across merchants','Insider access anomaly on account data',
  'Loyalty points redemption fraud','New payee large transfer escalation',
  'Multi-account bust-out scheme','Romance scam fund transfer pattern',
];

function genCases(){
  const critAlerts = shuffle(alerts.filter(a=>a.severity==='Critical' || a.severity==='High'));
  for(let i=1;i<=CASE_COUNT;i++){
    const alert = critAlerts[i%critAlerts.length] || pick(alerts);
    const cust = customers.find(c=>c.id===alert.customerId);
    const acc = accounts.find(a=>a.id===alert.accountId);
    const sev = pickWeighted([['Critical',20],['High',35],['Medium',30],['Low',15]]);
    const status = pickWeighted([['Open',25],['In Progress',35],['Escalated',15],['Closed',25]]);
    const created = daysAgo(rndInt(2,60));
    const relatedTxns = shuffle(transactions.filter(t=>t.customerId===cust.id)).slice(0,rndInt(1,4)).map(t=>t.id);
    if(!relatedTxns.includes(alert.transactionId)) relatedTxns.push(alert.transactionId);
    const relatedAlerts = shuffle(alerts.filter(a=>a.customerId===cust.id)).slice(0,rndInt(1,3)).map(a=>a.id);
    if(!relatedAlerts.includes(alert.id)) relatedAlerts.push(alert.id);
    const investigator = status==='Open' ? null : pick(INVESTIGATORS);
    const c = {
      id:'CASE-'+pad(i,4), title: CASE_TITLES[i-1], severity: sev, status,
      investigator, customerId: cust.id, accountId: acc? acc.id : cust.accountIds[0],
      relatedTransactionIds:[...new Set(relatedTxns)], relatedAlertIds:[...new Set(relatedAlerts)],
      evidenceIds:[], createdAt: created, updatedAt: daysAgo(rndInt(0,2)),
      notes:[], timeline:[],
    };
    c.timeline.push({time:created, title:'Case opened', desc:`Case created from alert ${alert.id} (${alert.type}).`, actor:'System', kind:'ok'});
    if(status!=='Open'){
      c.timeline.push({time: daysAgo(rndInt(1,Math.max(1,Math.floor((Date.now()-new Date(created))/86400000)))), title:'Investigator assigned', desc:`${investigator} assigned to investigate.`, actor:'System', kind:'ok'});
    }
    if(status==='Escalated'){
      c.timeline.push({time: daysAgo(1), title:'Escalated to senior review', desc:'Case escalated due to elevated loss exposure.', actor: investigator, kind:'crit'});
    }
    if(status==='Closed'){
      c.timeline.push({time: daysAgo(0), title:'Case closed', desc: rnd()<0.5 ? 'Confirmed fraud \u2014 funds recovery initiated.' : 'Investigation concluded \u2014 no fraud confirmed.', actor: investigator, kind:'ok'});
    }
    if(status!=='Open' && rnd()<0.7){
      c.notes.push({author:investigator, time:daysAgo(rndInt(0,3)), text: pick([
        'Customer confirmed they did not authorize this transaction. Proceeding with chargeback filing.',
        'Device fingerprint does not match any previously trusted device for this customer.',
        'Reached out to customer via verified phone number on file \u2014 awaiting callback.',
        'IP geolocation inconsistent with customer\u2019s stated travel itinerary.',
        'Cross-referenced with prior case history \u2014 no similar pattern found for this customer.',
        'Recommend temporary account restriction pending further review.',
      ])});
    }
    cases.push(c);
  }
}

const EVIDENCE_TYPES = ['Transaction Log','Device Fingerprint','Communication Record','Identity Document','Screenshot Capture','Authentication Log','Geolocation Record','Merchant Statement'];
const EVIDENCE_SOURCES = ['Core Banking System','Fraud Detection Engine','Customer Call Recording','Mobile App Telemetry','Network Security Log','KYC Vendor API','Card Network Alert','Email Gateway Log'];

function genEvidence(){
  for(let i=1;i<=EVIDENCE_COUNT;i++){
    const c = cases[i % cases.length];
    const integ = pickWeighted([['Verified',72],['Pending',20],['Compromised',8]]);
    const ev = {
      id:'EVD-'+pad(i,4), type: pick(EVIDENCE_TYPES), source: pick(EVIDENCE_SOURCES),
      collectedBy: pick(INVESTIGATORS), timestamp: daysAgo(rndInt(0,55)),
      integrityStatus: integ,
      hash: Array.from({length:8},()=>pad(rndInt(0,4294967295).toString(16),8)).join('').slice(0,64).padEnd(64,'0'),
      caseId: c.id,
    };
    evidence.push(ev);
    c.evidenceIds.push(ev.id);
  }
  // ensure every case has at least one piece of evidence
  cases.forEach(c=>{
    if(c.evidenceIds.length===0){
      const ev = pick(evidence);
      ev.caseId = c.id;
      c.evidenceIds.push(ev.id);
    }
  });
}

function generateAllData(){
  genCustomers(); genAccounts(); genDevices(); genTransactions(); genAlerts(); genCases(); genEvidence();
}
generateAllData();

/* ---------------------------------------------------------
   4. STATE / PERSISTENCE (localStorage overrides)
   --------------------------------------------------------- */
const LS_KEY = 'sentrywatch_state_v1';
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function saveState(){
  const state = {
    txnStatus: Object.fromEntries(transactions.map(t=>[t.id,t.status])),
    alerts: Object.fromEntries(alerts.map(a=>[a.id,{status:a.status, assignedTo:a.assignedTo}])),
    cases: Object.fromEntries(cases.map(c=>[c.id,{status:c.status, investigator:c.investigator, notes:c.notes, timeline:c.timeline}])),
    notifReadIds: Array.from(notifReadIds),
  };
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){ /* storage unavailable */ }
}
let notifReadIds = new Set();
function applySavedState(){
  const s = loadState();
  if(!s) return;
  if(s.txnStatus) transactions.forEach(t=>{ if(s.txnStatus[t.id]) t.status = s.txnStatus[t.id]; });
  if(s.alerts) alerts.forEach(a=>{ const o=s.alerts[a.id]; if(o){ a.status=o.status; a.assignedTo=o.assignedTo; } });
  if(s.cases) cases.forEach(c=>{ const o=s.cases[c.id]; if(o){ c.status=o.status; c.investigator=o.investigator; if(o.notes) c.notes=o.notes; if(o.timeline) c.timeline=o.timeline; } });
  if(s.evidence) evidence.forEach(e=>{ const o=s.evidence[e.id]; if(o) e.integrityStatus=o.integrityStatus; });
  if(s.notifReadIds) notifReadIds = new Set(s.notifReadIds);
}
applySavedState();

/* ---------------------------------------------------------
   5. NOTIFICATIONS
   --------------------------------------------------------- */
function buildNotifications(){
  const list = [];
  shuffle(alerts.filter(a=>a.severity==='Critical'||a.severity==='High')).slice(0,6).forEach(a=>{
    list.push({id:'NTF-A-'+a.id, kind:'alert', time:a.createdAt, text:`New ${a.severity.toLowerCase()} alert: ${a.type} on ${a.customerId}.`, route:`alerts/${a.id}`});
  });
  shuffle(cases.filter(c=>c.status==='Escalated'||c.status==='In Progress')).slice(0,5).forEach(c=>{
    list.push({id:'NTF-C-'+c.id, kind:'case', time:c.updatedAt, text:`Case ${c.id} updated: ${c.title}.`, route:`cases/${c.id}`});
  });
  shuffle(transactions.filter(t=>t.status==='Blocked')).slice(0,4).forEach(t=>{
    list.push({id:'NTF-T-'+t.id, kind:'txn', time:t.timestamp, text:`Transaction ${t.id} blocked \u2014 ${fmtMoney(t.amount)} at ${t.merchant}.`, route:`transactions/${t.id}`});
  });
  list.sort((a,b)=> new Date(b.time)-new Date(a.time));
  return list;
}
const NOTIFICATIONS = buildNotifications();

/* ---------------------------------------------------------
   6. LOOKUP HELPERS
   --------------------------------------------------------- */
const custById = id => customers.find(c=>c.id===id);
const accById = id => accounts.find(a=>a.id===id);
const devById = id => devices.find(d=>d.id===id);
const txnById = id => transactions.find(t=>t.id===id);
const alertById = id => alerts.find(a=>a.id===id);
const caseById = id => cases.find(c=>c.id===id);
const evById = id => evidence.find(e=>e.id===id);

function riskColorVar(level){
  level = (level||'').toLowerCase();
  if(level==='critical') return 'var(--risk-critical)';
  if(level==='high') return 'var(--risk-high)';
  if(level==='medium') return 'var(--risk-medium)';
  return 'var(--risk-low)';
}
function riskLevelFromScore(score){
  if(score>=80) return 'critical';
  if(score>=55) return 'high';
  if(score>=30) return 'medium';
  return 'low';
}
function badgeClassFor(text){
  const t=(text||'').toLowerCase();
  if(['critical','blocked','suspended','compromised','dismissed'].includes(t)) return 'badge-critical';
  if(['high','flagged','escalated','open','unrecognized','under review'].includes(t)) return 'badge-high';
  if(['medium','investigating','pending','pending review','frozen'].includes(t)) return 'badge-medium';
  if(['low','approved','active','resolved','closed','verified','trusted'].includes(t)) return 'badge-low';
  return 'badge-neutral';
}
function badge(text, override){
  const cls = override || badgeClassFor(text);
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}
function riskMeter(score){
  const level = riskLevelFromScore(score);
  const color = riskColorVar(level);
  return `<div class="risk-meter"><div class="risk-bar"><div class="risk-bar-fill" style="width:${score}%;background:${color}"></div></div><span class="risk-num" style="color:${color}">${score}</span></div>`;
}

/* ---------------------------------------------------------
   7. TOASTS
   --------------------------------------------------------- */
function toast(msg, type=''){
  const region = document.getElementById('toast-region');
  const el = document.createElement('div');
  el.className = 'toast'+(type?' '+type:'');
  el.textContent = msg;
  region.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; setTimeout(()=>el.remove(),260); }, 3200);
}

/* ---------------------------------------------------------
   8. DRAWER / MODAL
   --------------------------------------------------------- */
function openDrawer(titleHTML, bodyHTML){
  document.getElementById('drawer-title').innerHTML = titleHTML;
  document.getElementById('drawer-body').innerHTML = bodyHTML;
  document.getElementById('drawer-overlay').hidden = false;
}
function closeDrawer(){ document.getElementById('drawer-overlay').hidden = true; }
function openModal(titleHTML, bodyHTML){
  document.getElementById('modal-title').innerHTML = titleHTML;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').hidden = false;
}
function closeModal(){ document.getElementById('modal-overlay').hidden = true; }

document.getElementById('drawer-close').addEventListener('click', closeDrawer);
document.getElementById('drawer-overlay').addEventListener('click', e=>{ if(e.target.id==='drawer-overlay') closeDrawer(); });
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e=>{ if(e.target.id==='modal-overlay') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeDrawer(); closeModal(); } });

/* ---------------------------------------------------------
   9. GENERIC DATA TABLE COMPONENT
   --------------------------------------------------------- */
/*
  config = {
    key: unique string for state persistence within session
    columns: [{key,label,sortable,render(row)}]
    data: array of row objects
    idField: field name for row id
    onRowClick(row)
    searchFields: [fieldNames] for text search
    filters: [{key,label,options:[{value,label}], match(row,value)}]
    pageSize: number
  }
*/
const tableStates = {};
function renderDataTable(config){
  const st = tableStates[config.key] || (tableStates[config.key] = {
    search:'', filters:{}, sortKey: config.defaultSort || null, sortDir: config.defaultDir || 'desc', page:1, pageSize: config.pageSize || 10
  });

  function computeRows(){
    let rows = config.data.slice();
    if(st.search.trim()){
      const q = st.search.trim().toLowerCase();
      rows = rows.filter(r => (config.searchFields||[]).some(f=> String(r[f]||'').toLowerCase().includes(q)));
    }
    (config.filters||[]).forEach(f=>{
      const val = st.filters[f.key];
      if(val && val!=='all') rows = rows.filter(r=>f.match(r,val));
    });
    if(st.sortKey){
      const col = config.columns.find(c=>c.key===st.sortKey);
      rows.sort((a,b)=>{
        let av = col.sortVal? col.sortVal(a) : a[st.sortKey];
        let bv = col.sortVal? col.sortVal(b) : b[st.sortKey];
        if(typeof av==='string') av=av.toLowerCase();
        if(typeof bv==='string') bv=bv.toLowerCase();
        if(av<bv) return st.sortDir==='asc'?-1:1;
        if(av>bv) return st.sortDir==='asc'?1:-1;
        return 0;
      });
    }
    return rows;
  }

  function html(){
    const allRows = computeRows();
    const total = allRows.length;
    const pages = Math.max(1, Math.ceil(total/st.pageSize));
    st.page = Math.min(st.page, pages);
    const start = (st.page-1)*st.pageSize;
    const pageRows = allRows.slice(start, start+st.pageSize);

    let out = `<div class="table-toolbar">`;
    if(config.searchFields){
      out += `<div class="tt-search"><svg viewBox="0 0 20 20" width="14" height="14"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        <input type="text" data-tt="search" placeholder="${esc(config.searchPlaceholder||'Search…')}" value="${esc(st.search)}"></div>`;
    }
    (config.filters||[]).forEach(f=>{
      out += `<select class="tt-filter" data-tt="filter" data-filter-key="${f.key}"><option value="all">${esc(f.label)}: All</option>`;
      f.options.forEach(o=>{ out += `<option value="${esc(o.value)}" ${st.filters[f.key]===o.value?'selected':''}>${esc(o.label)}</option>`; });
      out += `</select>`;
    });
    out += `<div class="tt-spacer"></div><div class="tt-count">${total} result${total===1?'':'s'}</div></div>`;

    out += `<div class="table-scroll"><table class="data-table"><thead><tr>`;
    config.columns.forEach(c=>{
      const sorted = st.sortKey===c.key;
      out += `<th data-tt="sort" data-key="${c.key}" class="${sorted?'sorted':''}">${esc(c.label)}${c.sortable===false?'':`<span class="sort-arrow">${sorted?(st.sortDir==='asc'?'\u25b2':'\u25bc'):'\u2195'}</span>`}</th>`;
    });
    out += `</tr></thead><tbody>`;
    if(pageRows.length===0){
      out += `<tr class="row-empty"><td colspan="${config.columns.length}">No results match your filters.</td></tr>`;
    } else {
      pageRows.forEach(row=>{
        out += `<tr data-tt="row" data-id="${esc(row[config.idField])}">`;
        config.columns.forEach(c=>{ out += `<td>${c.render(row)}</td>`; });
        out += `</tr>`;
      });
    }
    out += `</tbody></table></div>`;

    out += `<div class="pagination"><span class="tt-count">Showing ${total===0?0:start+1}\u2013${Math.min(start+st.pageSize,total)} of ${total}</span><div class="page-btns">`;
    out += `<button class="page-btn" data-tt="page" data-p="${st.page-1}" ${st.page<=1?'disabled':''}>\u2039</button>`;
    const pageNums = [];
    for(let p=1;p<=pages;p++){ if(p===1||p===pages||Math.abs(p-st.page)<=1) pageNums.push(p); else if(pageNums[pageNums.length-1]!=='...') pageNums.push('...'); }
    pageNums.forEach(p=>{
      if(p==='...') out += `<span class="page-btn" style="border:none;background:none;cursor:default">\u2026</span>`;
      else out += `<button class="page-btn ${p===st.page?'active':''}" data-tt="page" data-p="${p}">${p}</button>`;
    });
    out += `<button class="page-btn" data-tt="page" data-p="${st.page+1}" ${st.page>=pages?'disabled':''}>\u203a</button>`;
    out += `</div></div>`;
    return out;
  }

  function mount(container){
    container.innerHTML = html();
    container.querySelectorAll('[data-tt="search"]').forEach(inp=>{
      inp.addEventListener('input', e=>{ st.search = e.target.value; st.page=1; const cursorPos = e.target.selectionStart; container.innerHTML = html(); const ni = container.querySelector('[data-tt="search"]'); if(ni){ ni.focus(); ni.setSelectionRange(cursorPos,cursorPos); } attach(); });
    });
    container.querySelectorAll('[data-tt="filter"]').forEach(sel=>{
      sel.addEventListener('change', e=>{ st.filters[e.target.dataset.filterKey]=e.target.value; st.page=1; container.innerHTML=html(); attach(); });
    });
    container.querySelectorAll('[data-tt="sort"]').forEach(th=>{
      th.addEventListener('click', ()=>{
        const key = th.dataset.key;
        const col = config.columns.find(c=>c.key===key);
        if(col.sortable===false) return;
        if(st.sortKey===key) st.sortDir = st.sortDir==='asc'?'desc':'asc';
        else { st.sortKey=key; st.sortDir='desc'; }
        container.innerHTML = html(); attach();
      });
    });
    container.querySelectorAll('[data-tt="page"]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ st.page = parseInt(btn.dataset.p,10); container.innerHTML=html(); attach(); });
    });
    container.querySelectorAll('[data-tt="row"]').forEach(tr=>{
      tr.addEventListener('click', ()=>{ config.onRowClick(tr.dataset.id); });
    });
    function attach(){ mount(container); }
  }
  return { mount };
}

/* ---------------------------------------------------------
   10. CHART REGISTRY (destroy on re-render to avoid leaks)
   --------------------------------------------------------- */
const chartRegistry = {};
function makeChart(canvasId, cfg){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return;
  if(typeof Chart === 'undefined'){
    // Chart.js CDN did not load (e.g. offline) — degrade gracefully instead of breaking the page.
    const wrap = ctx.closest('.chart-wrap');
    if(wrap) wrap.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-state-title">Chart unavailable</div><div>Chart.js could not be loaded from the CDN.</div></div>';
    return;
  }
  try{
    if(chartRegistry[canvasId]){ chartRegistry[canvasId].destroy(); }
    chartRegistry[canvasId] = new Chart(ctx, cfg);
  }catch(e){ console.error('Chart render failed for', canvasId, e); }
}
const CHART_GRID = 'rgba(255,255,255,0.06)';
const CHART_TEXT = '#8B9AB8';
if(typeof Chart !== 'undefined'){
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = CHART_TEXT;
}

/* ---------------------------------------------------------
   11. ROUTER
   --------------------------------------------------------- */
const ROUTES = {
  dashboard: renderDashboard,
  transactions: renderTransactionsList,
  'transactions/:id': renderTransactionDetail,
  customers: renderCustomersList,
  'customers/:id': renderCustomerDetail,
  devices: renderDevicesList,
  alerts: renderAlertsList,
  'alerts/:id': renderAlertDetail,
  cases: renderCasesList,
  'cases/:id': renderCaseDetail,
  evidence: renderEvidenceList,
  risk: renderRiskAnalysis,
  reports: renderReports,
};

function parseHash(){
  let h = location.hash.replace(/^#\/?/, '');
  if(!h) h = 'dashboard';
  const parts = h.split('/');
  return { route: parts[0], id: parts[1] ? decodeURIComponent(parts[1]) : null };
}

function navigate(path){ location.hash = '#/'+path; }

function router(){
  const { route, id } = parseHash();
  document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active', a.dataset.route===route));
  const key = id ? route+'/:id' : route;
  const fn = ROUTES[key] || ROUTES[route] || renderDashboard;
  updateNavCounts();
  const root = document.getElementById('view-root');
  root.scrollTop = 0;
  try{
    fn(id);
  }catch(err){
    console.error(err);
    root.innerHTML = `<div class="empty-state"><div class="empty-state-title">Something went wrong rendering this view</div><div>${esc(err.message)}</div></div>`;
  }
  closeDrawer(); closeModal();
  document.getElementById('sidebar').classList.remove('open');
}
window.addEventListener('hashchange', router);

function setPageHead({crumbs, title, desc, actions}){
  const head = document.getElementById('page-head');
  let crumbHTML = crumbs.map((c,i)=> i<crumbs.length-1 ? `<a href="#/${c.href}">${esc(c.label)}</a><span>/</span>` : `<span>${esc(c.label)}</span>`).join(' ');
  head.innerHTML = `
    <div class="breadcrumb">${crumbHTML}</div>
    <div class="page-title-row">
      <div><div class="page-title">${esc(title)}</div>${desc?`<div class="page-desc">${esc(desc)}</div>`:''}</div>
      <div class="page-actions">${actions||''}</div>
    </div>`;
}

function updateNavCounts(){
  const openAlerts = alerts.filter(a=>a.status==='Open').length;
  const openCases = cases.filter(c=>c.status==='Open'||c.status==='In Progress'||c.status==='Escalated').length;
  const ea = document.getElementById('nav-count-alerts');
  const ec = document.getElementById('nav-count-cases');
  if(ea) ea.textContent = openAlerts>0 ? openAlerts : '';
  if(ec) ec.textContent = openCases>0 ? openCases : '';
}

/* ---------------------------------------------------------
   12. DASHBOARD VIEW
   --------------------------------------------------------- */
function renderDashboard(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Fraud Dashboard'}],
    title:'Fraud Dashboard',
    desc:'Real-time overview of fraud exposure across transactions, accounts, and active investigations.',
    actions:`<button class="btn btn-primary" id="dash-refresh">Refresh feed</button>`
  });

  const suspicious = transactions.filter(t=>t.riskScore>=55 || t.flags.length>0);
  const blocked = transactions.filter(t=>t.status==='Blocked');
  const activeCases = cases.filter(c=>c.status==='Open'||c.status==='In Progress');
  const highRiskAccounts = accounts.filter(a=>a.riskScore>=55);
  const highRiskCustomers = customers.filter(c=>c.riskLevel==='high'||c.riskLevel==='critical');
  const openAlerts = alerts.filter(a=>a.status==='Open'||a.status==='Investigating');
  const fraudLoss = blocked.reduce((s,t)=>s+t.amount,0) + transactions.filter(t=>t.status==='Reversed').reduce((s,t)=>s+t.amount*0.6,0);
  const resolvedAlerts = alerts.filter(a=>a.status==='Resolved').length;
  const detectionRate = Math.round((resolvedAlerts + blocked.length) / (alerts.length + blocked.length) * 100);

  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard('Suspicious Transactions', suspicious.length, 'up', '+'+rndStable(6,14)+'% vs last week', iconAlertTriangle(), 'var(--risk-high)')}
      ${kpiCard('Blocked Transactions', blocked.length, 'down', fmtMoney(blocked.reduce((s,t)=>s+t.amount,0))+' prevented', iconBlock(), 'var(--risk-critical)')}
      ${kpiCard('Active Investigations', activeCases.length, 'flat', cases.filter(c=>c.status==='Escalated').length+' escalated', iconCase(), 'var(--accent)')}
      ${kpiCard('Estimated Fraud Loss', fmtMoney(fraudLoss), 'down', '30-day trailing', iconDollar(), 'var(--risk-critical)')}
      ${kpiCard('High-Risk Accounts', highRiskAccounts.length, 'up', 'of '+accounts.length+' total accounts', iconShield(), 'var(--risk-high)')}
      ${kpiCard('High-Risk Customers', highRiskCustomers.length, 'flat', 'flagged risk tier', iconUser(), 'var(--risk-high)')}
      ${kpiCard('Open Fraud Alerts', openAlerts.length, 'up', alerts.filter(a=>a.severity==='Critical').length+' critical severity', iconBell(), 'var(--risk-medium)')}
      ${kpiCard('Detection Rate', detectionRate+'%', 'down', 'alerts resolved or blocked', iconTarget(), 'var(--success)')}
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Transaction Risk Trend</div><div class="panel-sub">Daily volume by risk tier, last 14 days</div></div></div>
        <div class="chart-wrap tall"><canvas id="chart-risk-trend"></canvas></div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Alert Severity Mix</div><div class="panel-sub">${alerts.length} total alerts</div></div></div>
        <div class="chart-wrap tall"><canvas id="chart-alert-severity"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head">
          <div><div class="panel-title">Recent Fraud Alerts</div><div class="panel-sub">Newest first</div></div>
          <a class="btn btn-sm" href="#/alerts">View all</a>
        </div>
        <div id="dash-alerts-list"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div><div class="panel-title">Flagged Transaction Map</div><div class="panel-sub">Geographic spread of high-risk activity</div></div>
        </div>
        <div class="chart-wrap tall"><canvas id="chart-geo-risk"></canvas></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <div><div class="panel-title">Active Investigations Requiring Attention</div><div class="panel-sub">Sorted by severity</div></div>
        <a class="btn btn-sm" href="#/cases">View all cases</a>
      </div>
      <div id="dash-cases-table"></div>
    </div>
  `;

  document.getElementById('dash-refresh').addEventListener('click', ()=>{ toast('Feed refreshed \u2014 data is current.'); });

  // Recent alerts list
  const recentAlerts = alerts.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
  document.getElementById('dash-alerts-list').innerHTML = recentAlerts.map(a=>{
    const cust = custById(a.customerId);
    return `<div class="tl-item" style="padding-bottom:14px;cursor:pointer" data-nav="alerts/${a.id}">
      <div class="tl-head"><span class="tl-title">${badge(a.severity)} &nbsp;${esc(a.type)}</span><span class="tl-time">${timeAgo(a.createdAt)}</span></div>
      <div class="tl-desc">${esc(cust.name)} \u00b7 ${esc(a.id)} \u00b7 ${badge(a.status)}</div>
    </div>`;
  }).join('') || `<div class="empty-state">No alerts.</div>`;
  document.querySelectorAll('#dash-alerts-list [data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));

  // Cases table (mini)
  const attnCases = cases.filter(c=>c.status!=='Closed').sort((a,b)=>sevRank(b.severity)-sevRank(a.severity)).slice(0,8);
  const wrap = document.getElementById('dash-cases-table');
  wrap.innerHTML = `<div class="table-scroll"><table class="data-table"><thead><tr><th>Case</th><th>Title</th><th>Severity</th><th>Status</th><th>Investigator</th><th>Customer</th></tr></thead><tbody>
    ${attnCases.map(c=>{
      const cust = custById(c.customerId);
      return `<tr data-nav="cases/${c.id}"><td class="cell-mono">${c.id}</td><td class="cell-strong">${esc(c.title)}</td><td>${badge(c.severity)}</td><td>${badge(c.status)}</td><td class="cell-muted">${c.investigator?esc(c.investigator):'Unassigned'}</td><td>${esc(cust.name)}</td></tr>`;
    }).join('')}
  </tbody></table></div>`;
  wrap.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));

  // Charts
  const days = Array.from({length:14},(_,i)=>13-i);
  const dayLabels = days.map(d=>{ const dt=new Date(NOW); dt.setDate(dt.getDate()-d); return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}); });
  const lowSeries=[], medSeries=[], highSeries=[];
  days.forEach(d=>{
    const dayTxns = transactions.filter(t=>{ const diff = Math.floor((NOW-new Date(t.timestamp))/86400000); return diff===d; });
    lowSeries.push(dayTxns.filter(t=>riskLevelFromScore(t.riskScore)==='low').length);
    medSeries.push(dayTxns.filter(t=>riskLevelFromScore(t.riskScore)==='medium').length);
    highSeries.push(dayTxns.filter(t=>['high','critical'].includes(riskLevelFromScore(t.riskScore))).length);
  });
  makeChart('chart-risk-trend', {
    type:'bar',
    data:{ labels:dayLabels, datasets:[
      {label:'Low risk', data:lowSeries, backgroundColor:'#3DD9C7', stack:'s'},
      {label:'Medium risk', data:medSeries, backgroundColor:'#F5D547', stack:'s'},
      {label:'High/Critical', data:highSeries, backgroundColor:'#FF5470', stack:'s'},
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{boxWidth:10,padding:14} } },
      scales:{ x:{ stacked:true, grid:{display:false}, ticks:{maxRotation:0} }, y:{ stacked:true, grid:{color:CHART_GRID}, beginAtZero:true } }
    }
  });

  const sevCounts = ['Critical','High','Medium','Low'].map(s=>alerts.filter(a=>a.severity===s).length);
  makeChart('chart-alert-severity', {
    type:'doughnut',
    data:{ labels:['Critical','High','Medium','Low'], datasets:[{ data:sevCounts, backgroundColor:['#FF5470','#FF9F4A','#F5D547','#3DD9C7'], borderColor:'#101C36', borderWidth:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{ legend:{ position:'bottom', labels:{boxWidth:10,padding:14} } } }
  });

  const geoMap = {};
  transactions.filter(t=>t.riskScore>=45).forEach(t=>{ geoMap[t.country] = (geoMap[t.country]||0)+1; });
  const geoEntries = Object.entries(geoMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  makeChart('chart-geo-risk', {
    type:'bar',
    data:{ labels:geoEntries.map(e=>e[0]), datasets:[{ label:'Flagged transactions', data:geoEntries.map(e=>e[1]), backgroundColor:'#FF9F4A', borderRadius:4 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ grid:{color:CHART_GRID}, beginAtZero:true }, y:{ grid:{display:false} } } }
  });
}
function sevRank(s){ return {Critical:4,High:3,Medium:2,Low:1}[s]||0; }
function rndStable(min,max){ return min + ((CUSTOMER_COUNT*7)%(max-min+1)); }

function kpiCard(label,value,trend,sub,icon,color){
  const trendIcon = trend==='up' ? '\u25b2' : trend==='down' ? '\u25bc' : '\u2013';
  return `<div class="kpi-card">
    <div class="kpi-top"><span class="kpi-label">${esc(label)}</span><span class="kpi-icon" style="background:${color}22;color:${color}">${icon}</span></div>
    <div class="kpi-value">${value}</div>
    <div class="kpi-foot"><span class="kpi-delta ${trend}">${trendIcon}</span><span class="kpi-sub">${esc(sub)}</span></div>
  </div>`;
}
function iconAlertTriangle(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><path d="M10 3l8 14H2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8.5v3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14.5" r="0.9" fill="currentColor"/></svg>`; }
function iconBlock(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 5.5l9 9" stroke="currentColor" stroke-width="1.6"/></svg>`; }
function iconCase(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><rect x="3" y="6" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 6V4.8A1.8 1.8 0 018.8 3h2.4A1.8 1.8 0 0113 4.8V6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`; }
function iconDollar(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><path d="M10 2.5v15M13.5 6c0-1.4-1.6-2.5-3.5-2.5S6.5 4.6 6.5 6c0 3 7 1.5 7 4.5 0 1.4-1.6 2.5-3.5 2.5S6.5 12 6.5 10.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`; }
function iconShield(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><path d="M10 2.5l6.5 2.5v4.2c0 4.3-2.8 7-6.5 8.3-3.7-1.3-6.5-4-6.5-8.3V5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`; }
function iconUser(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><circle cx="10" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }
function iconBell(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><path d="M5 8a5 5 0 0110 0c0 3.2 1 4.5 1.5 5H3.5C4 12.5 5 11.2 5 8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`; }
function iconTarget(){ return `<svg viewBox="0 0 20 20" width="15" height="15"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="10" r="0.8" fill="currentColor"/></svg>`; }

/* ---------------------------------------------------------
   13. TRANSACTIONS
   --------------------------------------------------------- */
function renderTransactionsList(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Transactions'}],
    title:'Transactions',
    desc:`${transactions.length} transactions across ${accounts.length} accounts`,
  });
  const root = document.getElementById('view-root');
  root.innerHTML = `<div class="panel"><div id="txn-table"></div></div>`;

  const table = renderDataTable({
    key:'transactions', idField:'id', pageSize:10,
    searchFields:['id','merchant','city','country'],
    searchPlaceholder:'Search by ID, merchant, or location…',
    defaultSort:'timestamp', defaultDir:'desc',
    filters:[
      {key:'status', label:'Status', options:['Approved','Flagged','Blocked','Pending','Reversed'].map(v=>({value:v,label:v})), match:(r,v)=>r.status===v},
      {key:'type', label:'Type', options:[...new Set(transactions.map(t=>t.type))].map(v=>({value:v,label:v})), match:(r,v)=>r.type===v},
      {key:'risk', label:'Risk', options:[{value:'critical',label:'Critical'},{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}], match:(r,v)=>riskLevelFromScore(r.riskScore)===v},
    ],
    data: transactions,
    columns:[
      {key:'id', label:'Transaction ID', render:r=>`<span class="link-id">${r.id}</span>`},
      {key:'customerId', label:'Customer', sortVal:r=>custById(r.customerId).name, render:r=>esc(custById(r.customerId).name)},
      {key:'amount', label:'Amount', render:r=>`<span class="cell-mono cell-strong">${fmtMoney(r.amount,r.currency)}</span>`},
      {key:'merchant', label:'Merchant', render:r=>`${esc(r.merchant)}<div class="cell-muted" style="font-size:11px">${esc(r.category)}</div>`},
      {key:'city', label:'Location', sortVal:r=>r.city, render:r=>`${esc(r.city)}, ${esc(r.country)}`},
      {key:'type', label:'Type', render:r=>esc(r.type)},
      {key:'timestamp', label:'Time', render:r=>`<span class="cell-mono cell-muted">${fmtDateTime(r.timestamp)}</span>`},
      {key:'riskScore', label:'Risk', render:r=>riskMeter(r.riskScore)},
      {key:'status', label:'Status', render:r=>badge(r.status)},
    ],
    onRowClick: id => navigate('transactions/'+id),
  });
  table.mount(document.getElementById('txn-table'));
}

function renderTransactionDetail(id){
  const t = txnById(id);
  const root = document.getElementById('view-root');
  if(!t){ root.innerHTML = emptyState('Transaction not found', 'This transaction ID does not exist in the current dataset.'); return; }
  const cust = customers[(customers.findIndex(x=>x.id===t.customerId)+1)%customers.length], acc = accById(t.accountId), dev = devById(t.deviceId);
  const relatedAlert = alerts.find(a=>a.transactionId===t.id);

  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Transactions', href:'transactions'},{label:t.id}],
    title:t.id,
    desc:`${fmtMoney(t.amount)} \u00b7 ${t.merchant} \u00b7 ${fmtDateTime(t.timestamp)}`,
    actions: txnActionButtons(t),
  });

  root.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">Transaction Overview</div>${badge(t.status)}</div>
          <div class="two-col">
            <div class="info-list">
              <div class="info-row"><span class="info-label">Amount</span><span class="info-value mono">${fmtMoney(t.amount,t.currency)}</span></div>
              <div class="info-row"><span class="info-label">Type</span><span class="info-value">${esc(t.type)}</span></div>
              <div class="info-row"><span class="info-label">Merchant</span><span class="info-value">${esc(t.merchant)}</span></div>
              <div class="info-row"><span class="info-label">Category</span><span class="info-value">${esc(t.category)}</span></div>
            </div>
            <div class="info-list">
              <div class="info-row"><span class="info-label">Location</span><span class="info-value">${esc(t.city)}, ${esc(t.country)}</span></div>
              <div class="info-row"><span class="info-label">Timestamp</span><span class="info-value mono">${fmtDateTime(t.timestamp)}</span></div>
              <div class="info-row"><span class="info-label">Risk Score</span><span class="info-value">${riskMeter(t.riskScore)}</span></div>
              <div class="info-row"><span class="info-label">Status</span><span class="info-value">${badge(t.status)}</span></div>
            </div>
          </div>
          ${t.flags.length? `<div style="margin-top:14px"><div class="info-label" style="margin-bottom:8px">Fraud Indicators</div>${t.flags.map(f=>`<span class="flag-chip ${riskLevelFromScore(t.riskScore)==='critical'?'crit':''}">\u26a0 ${esc(f)}</span>`).join('')}</div>` : ''}
        </div>

        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Related Records</div>
          <div class="info-list">
            <div class="info-row"><span class="info-label">Account</span><span class="info-value"><span class="link-id" data-nav="customers/${cust.id}">${acc.id}</span></span></div>
            <div class="info-row"><span class="info-label">Customer</span><span class="info-value"><span class="link-id" data-nav="customers/${cust.id}">${esc(cust.name)}</span></span></div>
            <div class="info-row"><span class="info-label">Device</span><span class="info-value"><span class="link-id" data-nav="devices">${dev.id}</span></span></div>
            ${relatedAlert? `<div class="info-row"><span class="info-label">Linked Alert</span><span class="info-value"><span class="link-id" data-nav="alerts/${relatedAlert.id}">${relatedAlert.id}</span></span></div>` : ''}
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Device Used</div>
          <div class="info-list">
            <div class="info-row"><span class="info-label">Device</span><span class="info-value">${esc(dev.model)}</span></div>
            <div class="info-row"><span class="info-label">OS</span><span class="info-value">${esc(dev.os)}</span></div>
            <div class="info-row"><span class="info-label">Browser</span><span class="info-value">${esc(dev.browser)}</span></div>
            <div class="info-row"><span class="info-label">IP Address</span><span class="info-value mono">${esc(dev.ip)}</span></div>
            <div class="info-row"><span class="info-label">Trust Status</span><span class="info-value">${badge(dev.trustStatus)}</span></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Customer Snapshot</div>
          <div class="info-list">
            <div class="info-row"><span class="info-label">Segment</span><span class="info-value">${esc(cust.segment)}</span></div>
            <div class="info-row"><span class="info-label">Home Location</span><span class="info-value">${esc(cust.city)}, ${esc(cust.country)}</span></div>
            <div class="info-row"><span class="info-label">Customer Risk</span><span class="info-value">${riskMeter(cust.riskScore)}</span></div>
            <div class="info-row"><span class="info-label">Account Status</span><span class="info-value">${badge(acc.status)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
  wireTxnActions(t);
}

function txnActionButtons(t){
  let btns = '';
  if(t.status!=='Blocked') btns += `<button class="btn btn-danger btn-sm" data-txn-action="block">Block transaction</button>`;
  if(t.status!=='Approved') btns += `<button class="btn btn-sm" data-txn-action="approve">Mark approved</button>`;
  if(t.status!=='Flagged') btns += `<button class="btn btn-sm" data-txn-action="flag">Flag for review</button>`;
  return btns;
}
function wireTxnActions(t){
  document.querySelectorAll('[data-txn-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const action = btn.dataset.txnAction;
      t.status = action==='block'?'Blocked':action==='approve'?'Approved':'Flagged';
      saveState();
      toast(`${t.id} marked as ${t.status}.`, action==='block'?'danger':'success');
      renderTransactionDetail(t.id);
    });
  });
}
function emptyState(title, desc){
  return `<div class="empty-state"><svg viewBox="0 0 20 20" width="34" height="34"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><div class="empty-state-title">${esc(title)}</div><div>${esc(desc)}</div></div>`;
}

/* ---------------------------------------------------------
   14. CUSTOMERS
   --------------------------------------------------------- */
function renderCustomersList(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Customer Accounts'}],
    title:'Customer Accounts',
    desc:`${customers.length} customers \u00b7 ${accounts.length} accounts`,
  });
  const root = document.getElementById('view-root');
  root.innerHTML = `<div class="panel"><div id="cust-table"></div></div>`;
  const table = renderDataTable({
    key:'customers', idField:'id', pageSize:10,
    searchFields:['id','name','email','city'],
    searchPlaceholder:'Search by name, email, or ID…',
    defaultSort:'riskScore', defaultDir:'desc',
    filters:[
      {key:'risk', label:'Risk', options:['critical','high','medium','low'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)})), match:(r,v)=>r.riskLevel===v},
      {key:'status', label:'Status', options:['Active','Flagged','Suspended'].map(v=>({value:v,label:v})), match:(r,v)=>r.status===v},
      {key:'segment', label:'Segment', options:['Retail','Premium','Business'].map(v=>({value:v,label:v})), match:(r,v)=>r.segment===v},
    ],
    data: customers,
    columns:[
      {key:'id', label:'Customer ID', render:r=>`<span class="link-id">${r.id}</span>`},
      {key:'name', label:'Name', render:r=>`<span class="cell-strong">${esc(r.name)}</span><div class="cell-muted" style="font-size:11px">${esc(r.email)}</div>`},
      {key:'segment', label:'Segment', render:r=>esc(r.segment)},
      {key:'city', label:'Location', render:r=>`${esc(r.city)}, ${esc(r.country)}`},
      {key:'accountIds', label:'Accounts', sortVal:r=>r.accountIds.length, render:r=>r.accountIds.length},
      {key:'riskScore', label:'Risk Score', render:r=>riskMeter(r.riskScore)},
      {key:'status', label:'Status', render:r=>badge(r.status)},
    ],
    onRowClick: id => navigate('customers/'+id),
  });
  table.mount(document.getElementById('cust-table'));
}

function renderCustomerDetail(id){
  const c = custById(id);
  const root = document.getElementById('view-root');
  if(!c){ root.innerHTML = emptyState('Customer not found','This customer ID does not exist.'); return; }
  const custAccounts = accounts.filter(a=>a.customerId===c.id);
  const custTxns = transactions.filter(t=>t.customerId===c.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const custDevices = devices.filter(d=>d.customerIds.includes(c.id));
  const custAlerts = alerts.filter(a=>a.customerId===c.id);
  const custCases = cases.filter(cs=>cs.customerId===c.id);

  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Customer Accounts', href:'customers'},{label:c.name}],
    title:c.name,
    desc:`${c.id} \u00b7 ${c.segment} \u00b7 Joined ${fmtDate(c.joinDate)}`,
    actions:`${badge(c.status)}`,
  });

  root.innerHTML = `
    <div class="tabs" id="cust-tabs">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="accounts">Accounts (${custAccounts.length})</button>
      <button class="tab-btn" data-tab="transactions">Transactions (${custTxns.length})</button>
      <button class="tab-btn" data-tab="devices">Devices (${custDevices.length})</button>
      <button class="tab-btn" data-tab="alerts">Alerts (${custAlerts.length})</button>
      <button class="tab-btn" data-tab="cases">Cases (${custCases.length})</button>
    </div>
    <div id="cust-tab-body"></div>
  `;

  function renderTab(tab){
    const body = document.getElementById('cust-tab-body');
    if(tab==='overview'){
      body.innerHTML = `
        <div class="detail-grid">
          <div>
            <div class="panel">
              <div class="panel-title" style="margin-bottom:10px">Customer Profile</div>
              <div class="two-col">
                <div class="info-list">
                  <div class="info-row"><span class="info-label">Full Name</span><span class="info-value">${esc(c.name)}</span></div>
                  <div class="info-row"><span class="info-label">Email</span><span class="info-value">${esc(c.email)}</span></div>
                  <div class="info-row"><span class="info-label">Phone</span><span class="info-value mono">${esc(c.phone)}</span></div>
                  <div class="info-row"><span class="info-label">KYC Status</span><span class="info-value">${badge(c.kyc)}</span></div>
                </div>
                <div class="info-list">
                  <div class="info-row"><span class="info-label">Home Location</span><span class="info-value">${esc(c.city)}, ${esc(c.country)}</span></div>
                  <div class="info-row"><span class="info-label">Segment</span><span class="info-value">${esc(c.segment)}</span></div>
                  <div class="info-row"><span class="info-label">Joined</span><span class="info-value">${fmtDate(c.joinDate)}</span></div>
                  <div class="info-row"><span class="info-label">Account Status</span><span class="info-value">${badge(c.status)}</span></div>
                </div>
              </div>
            </div>
            <div class="panel">
              <div class="panel-title" style="margin-bottom:10px">Recent Activity</div>
              <div class="timeline">
                ${custTxns.slice(0,6).map(t=>`<div class="tl-item"><div class="tl-dot ${t.status==='Blocked'?'crit':t.status==='Approved'?'ok':''}"></div>
                  <div class="tl-head"><span class="tl-title link-id" data-nav="transactions/${t.id}">${fmtMoney(t.amount)} at ${esc(t.merchant)}</span><span class="tl-time">${timeAgo(t.timestamp)}</span></div>
                  <div class="tl-desc">${badge(t.status)} \u00b7 Risk ${t.riskScore}</div></div>`).join('') || '<div class="cell-muted">No recent transactions.</div>'}
              </div>
            </div>
          </div>
          <div>
            <div class="panel">
              <div class="panel-title" style="margin-bottom:10px">Risk Snapshot</div>
              <div style="text-align:center;padding:10px 0 6px">${riskGauge(c.riskScore)}</div>
              <div class="info-list">
                <div class="info-row"><span class="info-label">Overall Risk</span><span class="info-value">${badge(c.riskLevel[0].toUpperCase()+c.riskLevel.slice(1))}</span></div>
                <div class="info-row"><span class="info-label">Total Accounts</span><span class="info-value">${custAccounts.length}</span></div>
                <div class="info-row"><span class="info-label">Total Balance</span><span class="info-value mono">${fmtMoney(custAccounts.reduce((s,a)=>s+a.balance,0))}</span></div>
                <div class="info-row"><span class="info-label">Devices Linked</span><span class="info-value">${custDevices.length}</span></div>
                <div class="info-row"><span class="info-label">Open Alerts</span><span class="info-value">${custAlerts.filter(a=>a.status==='Open').length}</span></div>
              </div>
            </div>
          </div>
        </div>`;
    } else if(tab==='accounts'){
      body.innerHTML = `<div class="panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>Account</th><th>Type</th><th>Number</th><th>Balance</th><th>Risk</th><th>Status</th></tr></thead><tbody>
        ${custAccounts.map(a=>`<tr data-nav="customers/${c.id}"><td class="cell-mono">${a.id}</td><td>${esc(a.type)}</td><td class="cell-mono">${esc(a.number)}</td><td class="cell-mono cell-strong">${fmtMoney(a.balance)}</td><td>${riskMeter(a.riskScore)}</td><td>${badge(a.status)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
    } else if(tab==='transactions'){
      body.innerHTML = `<div class="panel"><div id="cust-txn-table"></div></div>`;
      const table = renderDataTable({
        key:'cust-txn-'+c.id, idField:'id', pageSize:8, searchFields:['id','merchant'],
        searchPlaceholder:'Search transactions…', defaultSort:'timestamp', defaultDir:'desc',
        data: custTxns,
        columns:[
          {key:'id', label:'ID', render:r=>`<span class="link-id">${r.id}</span>`},
          {key:'amount', label:'Amount', render:r=>`<span class="cell-mono">${fmtMoney(r.amount)}</span>`},
          {key:'merchant', label:'Merchant', render:r=>esc(r.merchant)},
          {key:'timestamp', label:'Time', render:r=>`<span class="cell-mono cell-muted">${fmtDateTime(r.timestamp)}</span>`},
          {key:'riskScore', label:'Risk', render:r=>riskMeter(r.riskScore)},
          {key:'status', label:'Status', render:r=>badge(r.status)},
        ],
        onRowClick: id => navigate('transactions/'+id),
      });
      table.mount(document.getElementById('cust-txn-table'));
    } else if(tab==='devices'){
      body.innerHTML = `<div class="panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>Device</th><th>Model</th><th>OS</th><th>IP</th><th>Last Seen</th><th>Trust</th></tr></thead><tbody>
        ${custDevices.map(d=>`<tr data-nav="devices"><td class="cell-mono">${d.id}</td><td>${esc(d.model)}</td><td class="cell-muted">${esc(d.os)}</td><td class="cell-mono">${esc(d.ip)}</td><td class="cell-muted">${timeAgo(d.lastSeen)}</td><td>${badge(d.trustStatus)}</td></tr>`).join('') || '<tr><td colspan="6" class="cell-muted" style="text-align:center;padding:24px">No devices linked.</td></tr>'}
      </tbody></table></div></div>`;
    } else if(tab==='alerts'){
      body.innerHTML = `<div class="panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>Alert</th><th>Type</th><th>Severity</th><th>Status</th><th>Created</th></tr></thead><tbody>
        ${custAlerts.map(a=>`<tr data-nav="alerts/${a.id}"><td class="cell-mono">${a.id}</td><td>${esc(a.type)}</td><td>${badge(a.severity)}</td><td>${badge(a.status)}</td><td class="cell-muted">${timeAgo(a.createdAt)}</td></tr>`).join('') || '<tr><td colspan="5" class="cell-muted" style="text-align:center;padding:24px">No alerts for this customer.</td></tr>'}
      </tbody></table></div></div>`;
      body.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
    } else if(tab==='cases'){
      body.innerHTML = `<div class="panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>Case</th><th>Title</th><th>Severity</th><th>Status</th><th>Investigator</th></tr></thead><tbody>
        ${custCases.map(cs=>`<tr data-nav="cases/${cs.id}"><td class="cell-mono">${cs.id}</td><td>${esc(cs.title)}</td><td>${badge(cs.severity)}</td><td>${badge(cs.status)}</td><td class="cell-muted">${cs.investigator?esc(cs.investigator):'Unassigned'}</td></tr>`).join('') || '<tr><td colspan="5" class="cell-muted" style="text-align:center;padding:24px">No cases opened for this customer.</td></tr>'}
      </tbody></table></div></div>`;
      body.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
    }
    body.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
  }

  document.querySelectorAll('#cust-tabs .tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#cust-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.dataset.tab);
    });
  });
  renderTab('overview');
}
function riskGauge(score){
  const level = riskLevelFromScore(score);
  const color = riskColorVar(level);
  return `<div style="display:inline-flex;flex-direction:column;align-items:center">
    <div style="width:110px;height:110px;border-radius:50%;background:conic-gradient(${color} ${score*3.6}deg, var(--border) 0deg);display:flex;align-items:center;justify-content:center;">
      <div style="width:82px;height:82px;border-radius:50%;background:var(--bg-panel);display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${color}">${score}</span>
        <span style="font-size:9.5px;color:var(--text-muted)">RISK</span>
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------
   15. DEVICES
   --------------------------------------------------------- */
function renderDevicesList(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Devices'}],
    title:'Devices',
    desc:`${devices.length} unique devices observed across the customer base`,
  });
  const root = document.getElementById('view-root');
  root.innerHTML = `<div class="panel"><div id="dev-table"></div></div>`;
  const table = renderDataTable({
    key:'devices', idField:'id', pageSize:10,
    searchFields:['id','model','ip','fingerprint'],
    searchPlaceholder:'Search by device ID, model, or IP…',
    defaultSort:'lastSeen', defaultDir:'desc',
    filters:[
      {key:'trust', label:'Trust', options:['Trusted','Unrecognized','Suspicious'].map(v=>({value:v,label:v})), match:(r,v)=>r.trustStatus===v},
      {key:'type', label:'Type', options:['Mobile','Desktop','Tablet'].map(v=>({value:v,label:v})), match:(r,v)=>r.type===v},
    ],
    data: devices,
    columns:[
      {key:'id', label:'Device ID', render:r=>`<span class="link-id">${r.id}</span>`},
      {key:'model', label:'Device', render:r=>`${esc(r.model)}<div class="cell-muted" style="font-size:11px">${esc(r.os)} \u00b7 ${esc(r.browser)}</div>`},
      {key:'ip', label:'IP Address', render:r=>`<span class="cell-mono">${esc(r.ip)}</span>`},
      {key:'fingerprint', label:'Fingerprint', render:r=>`<span class="cell-mono cell-muted">${esc(r.fingerprint)}</span>`},
      {key:'customerIds', label:'Linked Customers', sortVal:r=>r.customerIds.length, render:r=>r.customerIds.length>1? `<span class="badge badge-high">${r.customerIds.length} customers</span>` : '1 customer'},
      {key:'lastSeen', label:'Last Seen', render:r=>`<span class="cell-muted">${timeAgo(r.lastSeen)}</span>`},
      {key:'trustStatus', label:'Trust', render:r=>badge(r.trustStatus)},
    ],
    onRowClick: id => openDeviceDrawer(id),
  });
  table.mount(document.getElementById('dev-table'));
}
function openDeviceDrawer(id){
  const d = devById(id);
  const owners = customers.filter(c=>d.customerIds.includes(c.id));
  const relatedTxns = transactions.filter(t=>t.deviceId===d.id).slice(0,8);
  openDrawer(
    `<div><div class="drawer-title-main">${esc(d.model)}</div><div class="drawer-title-sub">${d.id}</div></div>`,
    `<div class="info-list" style="margin-bottom:16px">
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">${esc(d.type)}</span></div>
      <div class="info-row"><span class="info-label">OS</span><span class="info-value">${esc(d.os)}</span></div>
      <div class="info-row"><span class="info-label">Browser</span><span class="info-value">${esc(d.browser)}</span></div>
      <div class="info-row"><span class="info-label">IP Address</span><span class="info-value mono">${esc(d.ip)}</span></div>
      <div class="info-row"><span class="info-label">Fingerprint</span><span class="info-value mono">${esc(d.fingerprint)}</span></div>
      <div class="info-row"><span class="info-label">First Seen</span><span class="info-value">${fmtDate(d.firstSeen)}</span></div>
      <div class="info-row"><span class="info-label">Last Seen</span><span class="info-value">${timeAgo(d.lastSeen)}</span></div>
      <div class="info-row"><span class="info-label">Trust Status</span><span class="info-value">${badge(d.trustStatus)}</span></div>
    </div>
    <div class="panel-title" style="margin-bottom:8px;font-size:12.5px">Linked Customers (${owners.length})</div>
    ${owners.map(o=>`<div class="note-item" style="cursor:pointer" data-nav="customers/${o.id}"><div class="note-author">${esc(o.name)}</div><div class="cell-muted" style="font-size:11.5px">${o.id} \u00b7 ${esc(o.segment)}</div></div>`).join('')}
    <div class="panel-title" style="margin:16px 0 8px;font-size:12.5px">Recent Transactions on this Device</div>
    ${relatedTxns.map(t=>`<div class="note-item" style="cursor:pointer" data-nav="transactions/${t.id}"><div class="note-head"><span class="note-author">${t.id}</span><span>${badge(t.status)}</span></div><div class="note-text">${fmtMoney(t.amount)} at ${esc(t.merchant)} \u2014 ${timeAgo(t.timestamp)}</div></div>`).join('') || '<div class="cell-muted">No transactions recorded.</div>'}
    `
  );
  document.querySelectorAll('.drawer [data-nav]').forEach(el=>el.addEventListener('click',()=>{ closeDrawer(); navigate(el.dataset.nav); }));
}

/* ---------------------------------------------------------
   16. FRAUD ALERTS
   --------------------------------------------------------- */
function renderAlertsList(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Fraud Alerts'}],
    title:'Fraud Alerts',
    desc:`${alerts.filter(a=>a.status==='Open').length} open \u00b7 ${alerts.filter(a=>a.status==='Investigating').length} investigating \u00b7 ${alerts.length} total`,
  });
  const root = document.getElementById('view-root');
  root.innerHTML = `<div class="panel"><div id="alert-table"></div></div>`;
  const table = renderDataTable({
    key:'alerts', idField:'id', pageSize:10,
    searchFields:['id','type'],
    searchPlaceholder:'Search alerts by type or ID…',
    defaultSort:'createdAt', defaultDir:'desc',
    filters:[
      {key:'severity', label:'Severity', options:['Critical','High','Medium','Low'].map(v=>({value:v,label:v})), match:(r,v)=> v==='Low' ? (r.severity==='Low'||r.severity==='Medium') : r.severity===v},
      {key:'status', label:'Status', options:['Open','Investigating','Resolved','Dismissed'].map(v=>({value:v,label:v})), match:(r,v)=>r.status===v},
    ],
    data: alerts,
    columns:[
      {key:'id', label:'Alert ID', render:r=>`<span class="link-id">${r.id}</span>`},
      {key:'type', label:'Alert Type', render:r=>esc(r.type)},
      {key:'customerId', label:'Customer', sortVal:r=>custById(r.customerId).name, render:r=>esc(custById(r.customerId).name)},
      {key:'transactionId', label:'Transaction', render:r=>`<span class="cell-mono">${r.transactionId}</span>`},
      {key:'severity', label:'Severity', render:r=>badge(r.severity)},
      {key:'createdAt', label:'Created', render:r=>`<span class="cell-muted">${timeAgo(r.createdAt)}</span>`},
      {key:'assignedTo', label:'Assigned', render:r=>r.assignedTo?esc(r.assignedTo):'<span class="cell-muted">Unassigned</span>'},
      {key:'status', label:'Status', render:r=>badge(r.status)},
    ],
    onRowClick: id => navigate('alerts/'+id),
  });
  table.mount(document.getElementById('alert-table'));
}

function renderAlertDetail(id){
  const a = alertById(id);
  const root = document.getElementById('view-root');
  if(!a){ root.innerHTML = emptyState('Alert not found','This alert ID does not exist.'); return; }
  const t = txnById(a.transactionId), cust = custById(a.customerId), acc = accById(a.accountId);
  const linkedCase = cases.find(c=>c.relatedAlertIds.includes(a.id));

  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Fraud Alerts', href:'alerts'},{label:a.id}],
    title:a.type,
    desc:`${a.id} \u00b7 Raised ${timeAgo(a.createdAt)}`,
    actions:`${badge(a.severity)}`,
  });

  root.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">Alert Details</div>${badge(a.status)}</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 0 14px">${esc(a.description)}</p>
          <div class="info-list">
            <div class="info-row"><span class="info-label">Customer</span><span class="info-value"><span class="link-id" data-nav="customers/${cust.id}">${esc(cust.name)}</span></span></div>
            <div class="info-row"><span class="info-label">Account</span><span class="info-value mono">${acc.id}</span></div>
            <div class="info-row"><span class="info-label">Transaction</span><span class="info-value"><span class="link-id" data-nav="transactions/${t.id}">${t.id}</span></span></div>
            <div class="info-row"><span class="info-label">Transaction Amount</span><span class="info-value mono">${fmtMoney(t.amount)}</span></div>
            <div class="info-row"><span class="info-label">Assigned Investigator</span><span class="info-value">${a.assignedTo?esc(a.assignedTo):'Unassigned'}</span></div>
            ${linkedCase? `<div class="info-row"><span class="info-label">Linked Case</span><span class="info-value"><span class="link-id" data-nav="cases/${linkedCase.id}">${linkedCase.id}</span></span></div>` : ''}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Update Alert</div>
          <div class="form-row">
            <label class="form-label">Status</label>
            <select class="form-select" id="alert-status-select">
              ${['Open','Investigating','Resolved','Dismissed'].map(s=>`<option value="${s}" ${a.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">Assign Investigator</label>
            <select class="form-select" id="alert-assignee-select">
              <option value="">Unassigned</option>
              ${INVESTIGATORS.map(i=>`<option value="${esc(i)}" ${a.assignedTo===i?'selected':''}>${esc(i)}</option>`).join('')}
            </select>
          </div>
          <div class="form-actions" style="justify-content:flex-start;margin-top:8px">
            <button class="btn btn-primary" id="alert-save">Save changes</button>
            ${!linkedCase? `<button class="btn" id="alert-create-case">Escalate to new case</button>` : ''}
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Risk Snapshot</div>
          <div style="text-align:center;padding:6px 0">${riskGauge(t.riskScore)}</div>
          ${t.flags.length? `<div style="margin-top:10px">${t.flags.map(f=>`<span class="flag-chip">${esc(f)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Similar Alerts for this Customer</div>
          ${alerts.filter(x=>x.customerId===cust.id && x.id!==a.id).slice(0,5).map(x=>`<div class="note-item" style="cursor:pointer" data-nav="alerts/${x.id}"><div class="note-head"><span class="note-author">${x.id}</span>${badge(x.severity)}</div><div class="note-text">${esc(x.type)}</div></div>`).join('') || '<div class="cell-muted">No other alerts for this customer.</div>'}
        </div>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));

  document.getElementById('alert-save').addEventListener('click', ()=>{
    a.status = document.getElementById('alert-status-select').value;
    a.assignedTo = document.getElementById('alert-assignee-select').value || null;
    saveState();
    toast(`Alert ${a.id} updated.`, 'success');
    renderAlertDetail(a.id);
  });
  const escalateBtn = document.getElementById('alert-create-case');
  if(escalateBtn){
    escalateBtn.addEventListener('click', ()=>{
      const newId = 'CASE-'+pad(cases.length+1,4);
      const newCase = {
        id:newId, title:`Escalation from alert ${a.id}: ${a.type}`, severity:a.severity, status:'Open',
        investigator:null, customerId:cust.id, accountId:acc.id,
        relatedTransactionIds:[t.id], relatedAlertIds:[a.id], evidenceIds:[],
        createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
        notes:[], timeline:[{time:new Date().toISOString(), title:'Case opened', desc:`Escalated from alert ${a.id}.`, actor:'R. Mercer', kind:'ok'}],
      };
      cases.push(newCase);
      a.status='Investigating';
      saveState();
      toast(`Case ${newId} created from this alert.`,'success');
      navigate('cases/'+newId);
    });
  }
}

/* ---------------------------------------------------------
   17. INVESTIGATION CASES
   --------------------------------------------------------- */
function renderCasesList(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Investigation Cases'}],
    title:'Investigation Cases',
    desc:`${cases.filter(c=>c.status!=='Closed').length} active \u00b7 ${cases.length} total cases`,
    actions:`<button class="btn btn-primary" id="new-case-btn">New case</button>`,
  });
  const root = document.getElementById('view-root');
  root.innerHTML = `<div class="panel"><div id="case-table"></div></div>`;
  const table = renderDataTable({
    key:'cases', idField:'id', pageSize:10,
    searchFields:['id','title'],
    searchPlaceholder:'Search cases by title or ID…',
    defaultSort:'updatedAt', defaultDir:'desc',
    filters:[
      {key:'severity', label:'Severity', options:['Critical','High','Medium','Low'].map(v=>({value:v,label:v})), match:(r,v)=>r.severity===v},
      {key:'status', label:'Status', options:['Open','In Progress','Escalated','Closed'].map(v=>({value:v,label:v})), match:(r,v)=>r.status===v},
    ],
    data: cases,
    columns:[
      {key:'id', label:'Case ID', render:r=>`<span class="link-id">${r.id}</span>`},
      {key:'title', label:'Title', render:r=>esc(r.title)},
      {key:'customerId', label:'Customer', sortVal:r=>custById(r.customerId).name, render:r=>esc(custById(r.customerId).name)},
      {key:'severity', label:'Severity', render:r=>badge(r.severity)},
      {key:'investigator', label:'Investigator', render:r=>r.investigator?esc(r.investigator):'<span class="cell-muted">Unassigned</span>'},
      {key:'updatedAt', label:'Updated', render:r=>`<span class="cell-muted">${timeAgo(r.updatedAt)}</span>`},
      {key:'status', label:'Status', render:r=>badge(r.status)},
    ],
    onRowClick: id => navigate('cases/'+id),
  });
  table.mount(document.getElementById('case-table'));
  document.getElementById('new-case-btn').addEventListener('click', openNewCaseModal);
}
function openNewCaseModal(){
  openModal('New Investigation Case', `
    <div class="form-row"><label class="form-label">Case Title</label><input class="form-input" id="nc-title" placeholder="e.g. Suspicious wire transfer pattern"></div>
    <div class="form-row"><label class="form-label">Customer</label><select class="form-select" id="nc-customer">${customers.map(c=>`<option value="${c.id}">${esc(c.name)} (${c.id})</option>`).join('')}</select></div>
    <div class="form-row"><label class="form-label">Severity</label><select class="form-select" id="nc-severity">${['Critical','High','Medium','Low'].map(s=>`<option>${s}</option>`).join('')}</select></div>
    <div class="form-row"><label class="form-label">Initial Notes</label><textarea class="form-textarea" id="nc-notes" placeholder="Describe the reason for opening this case…"></textarea></div>
    <div class="form-actions"><button class="btn" id="nc-cancel">Cancel</button><button class="btn btn-primary" id="nc-create">Create case</button></div>
  `);
  document.getElementById('nc-cancel').addEventListener('click', closeModal);
  document.getElementById('nc-create').addEventListener('click', ()=>{
    const title = document.getElementById('nc-title').value.trim() || 'Untitled investigation';
    const customerId = document.getElementById('nc-customer').value;
    const severity = document.getElementById('nc-severity').value;
    const notesText = document.getElementById('nc-notes').value.trim();
    const cust = custById(customerId);
    const newId = 'CASE-'+pad(cases.length+1,4);
    const newCase = {
      id:newId, title, severity, status:'Open', investigator:null,
      customerId, accountId: cust.accountIds[0],
      relatedTransactionIds: transactions.filter(t=>t.customerId===customerId).slice(0,2).map(t=>t.id),
      relatedAlertIds: alerts.filter(a=>a.customerId===customerId).slice(0,1).map(a=>a.id),
      evidenceIds:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      notes: notesText? [{author:'R. Mercer', time:new Date().toISOString(), text:notesText}] : [],
      timeline:[{time:new Date().toISOString(), title:'Case opened', desc:'Case manually opened by analyst.', actor:'R. Mercer', kind:'ok'}],
    };
    cases.push(newCase);
    saveState();
    closeModal();
    toast(`Case ${newId} created.`,'success');
    navigate('cases/'+newId);
  });
}

function renderCaseDetail(id){
  const c = caseById(id);
  const root = document.getElementById('view-root');
  if(!c){ root.innerHTML = emptyState('Case not found','This case ID does not exist.'); return; }
  const cust = custById(c.customerId), acc = accById(c.accountId);
  const relTxns = c.relatedTransactionIds.map(txnById).filter(Boolean);
  const relAlerts = c.relatedAlertIds.map(alertById).filter(Boolean);
  const relEvidence = c.evidenceIds.map(evById).filter(Boolean);

  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Investigation Cases', href:'cases'},{label:c.id}],
    title:c.title,
    desc:`${c.id} \u00b7 Opened ${fmtDate(c.createdAt)} \u00b7 Customer: ${cust.name}`,
    actions:`${badge(c.severity)} ${badge(c.status)}`,
  });

  root.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:12px">Case Timeline</div>
          <div class="timeline">
            ${c.timeline.slice().sort((a,b)=>a.title.localeCompare(b.title)).map(tl=>`<div class="tl-item"><div class="tl-dot ${tl.kind==='crit'?'crit':tl.kind==='ok'?'ok':''}"></div>
              <div class="tl-head"><span class="tl-title">${esc(tl.title)}</span><span class="tl-time">${timeAgo(tl.time)}</span></div>
              <div class="tl-desc">${esc(tl.desc)}</div>
              ${tl.actor? `<div class="tl-actor">by ${esc(tl.actor)}</div>` : ''}
            </div>`).join('')}
          </div>
        </div>

        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Investigator Notes</div>
          <div id="case-notes-list">
            ${c.notes.slice().reverse().map(n=>`<div class="note-item"><div class="note-head"><span class="note-author">${esc(n.author)}</span><span>${timeAgo(n.time)}</span></div><div class="note-text">${esc(n.text)}</div></div>`).join('') || '<div class="cell-muted">No notes yet.</div>'}
          </div>
          <div class="note-form">
            <textarea id="case-note-input" placeholder="Add an investigation note…"></textarea>
            <button class="btn btn-primary btn-sm" id="case-note-add" style="align-self:flex-end">Add note</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Related Transactions</div>
          <div class="table-scroll"><table class="data-table"><thead><tr><th>ID</th><th>Amount</th><th>Merchant</th><th>Risk</th><th>Status</th></tr></thead><tbody>
            ${relTxns.map(t=>`<tr data-nav="transactions/${t.id}"><td class="link-id">${t.id}</td><td class="cell-mono">${fmtMoney(t.amount)}</td><td>${esc(t.merchant)}</td><td>${riskMeter(t.riskScore)}</td><td>${badge(t.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="cell-muted" style="text-align:center;padding:20px">No linked transactions.</td></tr>'}
          </tbody></table></div>
        </div>

        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Evidence (${relEvidence.length})</div>
          ${relEvidence.map(e=>`<div class="note-item" style="cursor:pointer" data-ev="${e.id}"><div class="note-head"><span class="note-author">${e.id} \u00b7 ${esc(e.type)}</span>${badge(e.integrityStatus)}</div><div class="note-text">Source: ${esc(e.source)} \u00b7 Collected by ${esc(e.collectedBy)} \u00b7 ${fmtDate(e.timestamp)}</div></div>`).join('') || '<div class="cell-muted">No evidence attached yet.</div>'}
          <button class="btn btn-sm" id="case-add-evidence" style="margin-top:8px">Attach evidence</button>
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Case Controls</div>
          <div class="form-row"><label class="form-label">Status</label>
            <select class="form-select" id="case-status-select">${['Open','In Progress','Escalated','Closed'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="form-row"><label class="form-label">Assign Investigator</label>
            <select class="form-select" id="case-investigator-select"><option value="">Unassigned</option>${INVESTIGATORS.map(i=>`<option ${c.investigator===i?'selected':''}>${esc(i)}</option>`).join('')}</select>
          </div>
          <button class="btn btn-primary" id="case-save-btn" style="width:100%;justify-content:center">Save case</button>
        </div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Subject</div>
          <div class="info-list">
            <div class="info-row"><span class="info-label">Customer</span><span class="info-value"><span class="link-id" data-nav="customers/${cust.id}">${esc(cust.name)}</span></span></div>
            <div class="info-row"><span class="info-label">Account</span><span class="info-value mono">${acc?acc.id:'\u2014'}</span></div>
            <div class="info-row"><span class="info-label">Customer Risk</span><span class="info-value">${riskMeter(cust.riskScore)}</span></div>
            <div class="info-row"><span class="info-label">Related Alerts</span><span class="info-value">${relAlerts.length}</span></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title" style="margin-bottom:10px">Related Alerts</div>
          ${relAlerts.map(a=>`<div class="note-item" style="cursor:pointer" data-nav="alerts/${a.id}"><div class="note-head"><span class="note-author">${a.id}</span>${badge(a.severity)}</div><div class="note-text">${esc(a.type)}</div></div>`).join('') || '<div class="cell-muted">None linked.</div>'}
        </div>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
  root.querySelectorAll('[data-ev]').forEach(el=>el.addEventListener('click',()=>openEvidenceDrawer(el.dataset.ev)));

  document.getElementById('case-note-add').addEventListener('click', ()=>{
    const val = document.getElementById('case-note-input').value.trim();
    if(!val) return;
    c.notes.push({author:'R. Mercer', time:new Date().toISOString(), text:val});
    c.timeline.push({time:new Date().toISOString(), title:'Note added', desc: val.slice(0,90)+(val.length>90?'…':''), actor:'R. Mercer', kind:''});
    c.updatedAt = new Date().toISOString();
    saveState();
    toast('Note added to case.','success');
    renderCaseDetail(c.id);
  });
  document.getElementById('case-save-btn').addEventListener('click', ()=>{
    const newStatus = document.getElementById('case-status-select').value;
    const newInv = document.getElementById('case-investigator-select').value || null;
    if(newStatus!==c.status){
      c.timeline.push({time:new Date().toISOString(), title:'Status changed', desc:`Status changed from ${c.status} to ${newStatus}.`, actor:'R. Mercer', kind: newStatus==='Closed'?'ok':(newStatus==='Escalated'?'crit':'')});
    }
    if(newInv!==c.investigator){
      c.timeline.push({time:new Date().toISOString(), title:'Investigator assigned', desc:`${newInv||'Unassigned'} is now handling this case.`, actor:'R. Mercer', kind:''});
    }
    c.status = newStatus; c.investigator = newInv;
    saveState();
    toast(`Case ${c.id} saved.`,'success');
    renderCaseDetail(c.id);
  });
  document.getElementById('case-add-evidence').addEventListener('click', ()=>{
    const unassigned = shuffle(evidence.filter(e=>e.caseId!==c.id)).slice(0,8);
    openModal('Attach Evidence', `
      <div class="form-row"><label class="form-label">Select evidence record</label>
        <select class="form-select" id="attach-ev-select">${unassigned.map(e=>`<option value="${e.id}">${e.id} \u2014 ${esc(e.type)} (${esc(e.source)})</option>`).join('')}</select>
      </div>
      <div class="form-actions"><button class="btn" id="attach-cancel">Cancel</button><button class="btn btn-primary" id="attach-confirm">Attach</button></div>
    `);
    document.getElementById('attach-cancel').addEventListener('click', closeModal);
    document.getElementById('attach-confirm').addEventListener('click', ()=>{
      const evId = document.getElementById('attach-ev-select').value;
      const ev = evById(evId);
      ev.caseId = c.id;
      c.timeline.push({time:new Date().toISOString(), title:'Evidence attached', desc:`${evId} (${ev.type}) attached to case.`, actor:'R. Mercer', kind:''});
      c.updatedAt = new Date().toISOString();
      saveState();
      closeModal();
      toast('Evidence attached to case.','success');
      renderCaseDetail(c.id);
    });
  });
}

/* ---------------------------------------------------------
   18. EVIDENCE CENTER
   --------------------------------------------------------- */
function renderEvidenceList(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Evidence Center'}],
    title:'Evidence Center',
    desc:`${evidence.length} evidence records across ${cases.length} cases`,
  });
  const root = document.getElementById('view-root');
  root.innerHTML = `<div class="panel"><div id="ev-table"></div></div>`;
  const table = renderDataTable({
    key:'evidence', idField:'id', pageSize:10,
    searchFields:['id','type','source','collectedBy','caseId'],
    searchPlaceholder:'Search by evidence ID, type, or source…',
    defaultSort:'timestamp', defaultDir:'desc',
    filters:[
      {key:'type', label:'Type', options:[...new Set(evidence.map(e=>e.type))].map(v=>({value:v,label:v})), match:(r,v)=>r.type===v},
      {key:'integrity', label:'Integrity', options:['Verified','Pending','Compromised'].map(v=>({value:v,label:v})), match:(r,v)=>r.integrityStatus===v},
    ],
    data: evidence,
    columns:[
      {key:'id', label:'Evidence ID', render:r=>`<span class="link-id">${r.id}</span>`},
      {key:'type', label:'Type', render:r=>esc(r.type)},
      {key:'source', label:'Source', render:r=>esc(r.source)},
      {key:'collectedBy', label:'Collected By', render:r=>esc(r.collectedBy)},
      {key:'timestamp', label:'Collected', render:r=>`<span class="cell-muted">${fmtDate(r.timestamp)}</span>`},
      {key:'caseId', label:'Case', render:r=>`<span class="cell-mono">${r.caseId}</span>`},
      {key:'integrityStatus', label:'Integrity', render:r=>badge(r.integrityStatus)},
    ],
    onRowClick: id => openEvidenceDrawer(id),
  });
  table.mount(document.getElementById('ev-table'));
}
function openEvidenceDrawer(id){
  const e = evById(id);
  const c = caseById(e.caseId);
  openDrawer(
    `<div><div class="drawer-title-main">${esc(e.type)}</div><div class="drawer-title-sub">${e.id}</div></div>`,
    `<div class="info-list" style="margin-bottom:16px">
      <div class="info-row"><span class="info-label">Source</span><span class="info-value">${esc(e.source)}</span></div>
      <div class="info-row"><span class="info-label">Collected By</span><span class="info-value">${esc(e.collectedBy)}</span></div>
      <div class="info-row"><span class="info-label">Collected On</span><span class="info-value">${fmtDateTime(e.timestamp)}</span></div>
      <div class="info-row"><span class="info-label">Related Case</span><span class="info-value"><span class="link-id" data-nav="cases/${c.id}">${c.id}</span></span></div>
      <div class="info-row"><span class="info-label">Integrity Status</span><span class="info-value">${badge(e.integrityStatus)}</span></div>
    </div>
    <div class="panel-title" style="margin-bottom:8px;font-size:12.5px">Chain-of-Custody Hash (SHA-256)</div>
    <div class="hash-text" style="background:var(--bg-raised);padding:10px 12px;border-radius:6px;border:1px solid var(--border-soft)">${e.hash}</div>
    <div class="form-row" style="margin-top:18px">
      <label class="form-label">Verify Integrity</label>
      <select class="form-select" id="ev-integrity-select">${['Verified','Pending','Compromised'].map(s=>`<option ${e.integrityStatus===s?'selected':''}>${s}</option>`).join('')}</select>
    </div>
    <button class="btn btn-primary" id="ev-save-integrity" style="width:100%;justify-content:center">Update status</button>
    `
  );
  document.querySelectorAll('.drawer [data-nav]').forEach(el=>el.addEventListener('click',()=>{ closeDrawer(); navigate(el.dataset.nav); }));
  document.getElementById('ev-save-integrity').addEventListener('click', ()=>{
    e.integrityStatus = document.getElementById('ev-integrity-select').value;
    saveState();
    toast(`${e.id} integrity status updated.`,'success');
    closeDrawer();
    if(parseHash().route==='evidence') renderEvidenceList();
  });
}

/* ---------------------------------------------------------
   19. RISK ANALYSIS
   --------------------------------------------------------- */
function renderRiskAnalysis(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Risk Analysis'}],
    title:'Risk Analysis',
    desc:'Composite fraud risk scoring across customers, accounts, transactions, devices, and geography.',
  });
  const root = document.getElementById('view-root');

  const avgCustRisk = Math.round(customers.reduce((s,c)=>s+c.riskScore,0)/customers.length);
  const avgAccRisk = Math.round(accounts.reduce((s,a)=>s+a.riskScore,0)/accounts.length);
  const avgTxnRisk = Math.round(transactions.reduce((s,t)=>s+t.riskScore,0)/transactions.length);
  const suspiciousDevices = devices.filter(d=>d.trustStatus==='Suspicious').length;
  const highRiskGeo = [...new Set(transactions.filter(t=>t.locRisk==='high'||t.locRisk==='critical').map(t=>t.country))];

  root.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard('Avg. Customer Risk', avgCustRisk, 'flat', 'across '+customers.length+' customers', iconUser(), riskColorVar(riskLevelFromScore(avgCustRisk)))}
      ${kpiCard('Avg. Account Risk', avgAccRisk, 'flat', 'across '+accounts.length+' accounts', iconShield(), riskColorVar(riskLevelFromScore(avgAccRisk)))}
      ${kpiCard('Avg. Transaction Risk', avgTxnRisk, 'flat', 'across '+transactions.length+' transactions', iconAlertTriangle(), riskColorVar(riskLevelFromScore(avgTxnRisk)))}
      ${kpiCard('Suspicious Devices', suspiciousDevices, 'up', 'of '+devices.length+' total devices', iconBlock(), 'var(--risk-critical)')}
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Risk Distribution by Entity Type</div><div class="panel-sub">Share of records in each risk tier</div></div></div>
        <div class="chart-wrap tall"><canvas id="chart-risk-dist"></canvas></div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Risk Factor Contribution</div><div class="panel-sub">Relative weight of each factor in the composite score</div></div></div>
        <div class="chart-wrap tall"><canvas id="chart-risk-factors"></canvas></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title" style="margin-bottom:6px">How the Composite Fraud Risk Score Works</div>
      <div class="panel-sub" style="margin-bottom:14px">Every transaction, account, and customer receives a 0\u201399 score built from six weighted factors. Higher scores route to alerts and, when combined with existing case activity, to investigation queues.</div>
      <div class="grid-3">
        ${riskFactorCard('Geographic Risk', '25%', 'Transaction origin country and city risk tier, weighted against the customer\u2019s home location. Cross-border activity in high-risk corridors raises this factor sharply.')}
        ${riskFactorCard('Device Risk', '20%', 'Trust status of the originating device \u2014 whether it is a recognized, previously trusted device, or one seen for the first time or flagged as suspicious.')}
        ${riskFactorCard('Transaction Risk', '20%', 'Amount relative to the customer\u2019s typical spending pattern, transaction type, and merchant category risk.')}
        ${riskFactorCard('Behavioral Velocity', '15%', 'Frequency of transactions or login attempts in a short window, including repeated failures and rapid successive transfers.')}
        ${riskFactorCard('Account Risk', '10%', 'Account status, age, and recent history of holds, freezes, or prior confirmed fraud.')}
        ${riskFactorCard('Customer Risk', '10%', 'KYC verification status, account tenure, and historical alert or case volume tied to the customer.')}
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><div><div class="panel-title">Highest-Risk Customers</div><div class="panel-sub">Ranked by composite risk score</div></div><a class="btn btn-sm" href="#/customers">View all customers</a></div>
      <div class="table-scroll"><table class="data-table"><thead><tr><th>Customer</th><th>Segment</th><th>Home Location</th><th>Open Alerts</th><th>Risk Factors</th><th>Score</th></tr></thead><tbody>
      ${customers.slice().sort((a,b)=>a.riskScore-b.riskScore).slice(0,10).map(c=>{
        const custAlerts = alerts.filter(a=>a.customerId===c.id);
        const factors = [];
        if(c.riskLevel==='critical'||c.riskLevel==='high') factors.push('Elevated tier');
        if(devices.some(d=>d.customerIds.includes(c.id) && d.trustStatus==='Suspicious')) factors.push('Suspicious device');
        if(transactions.some(t=>t.customerId===c.id && t.locRisk==='high')) factors.push('High-risk geography');
        if(custAlerts.length>=2) factors.push('Repeat alerts');
        return `<tr data-nav="customers/${c.id}"><td class="cell-strong">${esc(c.name)}</td><td>${esc(c.segment)}</td><td>${esc(c.city)}, ${esc(c.country)}</td><td>${custAlerts.filter(a=>a.status==='Open').length}</td><td>${factors.map(f=>`<span class="flag-chip" style="margin-bottom:2px">${esc(f)}</span>`).join('')||'<span class="cell-muted">\u2014</span>'}</td><td>${riskMeter(c.riskScore)}</td></tr>`;
      }).join('')}
      </tbody></table></div>
    </div>
  `;
  root.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));

  const tiers = ['low','medium','high','critical'];
  const custDist = tiers.map(t=>customers.filter(c=>c.riskLevel===t).length);
  const accDist = tiers.map(t=>accounts.filter(a=>riskLevelFromScore(a.riskScore)===t).length);
  const txnDist = tiers.map(t=>transactions.filter(tx=>riskLevelFromScore(tx.riskScore)===t).length);
  makeChart('chart-risk-dist', {
    type:'bar',
    data:{ labels:['Low','Medium','High','Critical'], datasets:[
      {label:'Customers', data:custDist, backgroundColor:'#3DD9C7'},
      {label:'Accounts', data:accDist, backgroundColor:'#F5D547'},
      {label:'Transactions', data:txnDist, backgroundColor:'#FF9F4A'},
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:14}}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:CHART_GRID},beginAtZero:true} } }
  });
  makeChart('chart-risk-factors', {
    type:'radar',
    data:{ labels:['Geographic','Device','Transaction','Velocity','Account','Customer'], datasets:[{
      label:'Weight in composite score', data:[25,20,20,15,10,10],
      backgroundColor:'rgba(61,217,199,0.18)', borderColor:'#3DD9C7', pointBackgroundColor:'#3DD9C7',
    }]},
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ r:{ angleLines:{color:CHART_GRID}, grid:{color:CHART_GRID}, pointLabels:{color:CHART_TEXT,font:{size:11}}, ticks:{display:false}, suggestedMin:0 } },
      plugins:{ legend:{display:false} }
    }
  });
}
function riskFactorCard(title, weight, desc){
  return `<div class="report-card" style="padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h4 style="margin:0">${esc(title)}</h4><span class="cell-mono" style="color:var(--accent);font-weight:700;font-size:12.5px">${weight}</span></div><p style="margin:0">${esc(desc)}</p></div>`;
}

/* ---------------------------------------------------------
   20. REPORTS
   --------------------------------------------------------- */
function renderReports(){
  setPageHead({
    crumbs:[{label:'Sentry Watch', href:'dashboard'},{label:'Reports'}],
    title:'Reports',
    desc:'Generate summary reports across fraud operations for stakeholders and compliance review.',
  });
  const root = document.getElementById('view-root');
  const reports = [
    {id:'fraud-summary', title:'Fraud Summary', desc:'Executive overview of suspicious activity, blocked transactions, and estimated loss over the selected period.'},
    {id:'investigation-report', title:'Investigation Report', desc:'Status and outcomes of all open, escalated, and closed investigation cases.'},
    {id:'txn-risk-report', title:'Transaction Risk Report', desc:'Distribution of transaction risk scores, flag types, and blocked-transaction detail.'},
    {id:'customer-risk-report', title:'Customer Risk Report', desc:'Customer risk tiering, KYC status, and account-level exposure summary.'},
    {id:'fraud-trends', title:'Fraud Trends', desc:'Trend lines for alert volume, detection rate, and geographic hotspots over time.'},
  ];
  root.innerHTML = `<div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
    ${reports.map(r=>`<div class="report-card"><h4>${esc(r.title)}</h4><p>${esc(r.desc)}</p><button class="btn btn-primary btn-sm" data-report="${r.id}">Generate report</button></div>`).join('')}
  </div>
  <div class="panel" id="report-output" style="display:none;margin-top:18px"></div>`;

  root.querySelectorAll('[data-report]').forEach(btn=>{
    btn.addEventListener('click', ()=>generateReport(btn.dataset.report));
  });
}
function generateReport(kind){
  const out = document.getElementById('report-output');
  out.style.display = 'block';
  const genTime = fmtDateTime(new Date());
  if(kind==='fraud-summary'){
    const blocked = transactions.filter(t=>t.status==='Blocked');
    const flagged = transactions.filter(t=>t.status==='Flagged');
    out.innerHTML = reportHeader('Fraud Summary Report', genTime) + `
      <div class="stat-inline">
        <div><div class="s-val">${flagged.length+blocked.length}</div><div class="s-lab">Suspicious transactions</div></div>
        <div><div class="s-val">${blocked.length}</div><div class="s-lab">Blocked</div></div>
        <div><div class="s-val">${fmtMoney(blocked.reduce((s,t)=>s+t.amount,0))}</div><div class="s-lab">Loss prevented</div></div>
        <div><div class="s-val">${alerts.filter(a=>a.status==='Open').length}</div><div class="s-lab">Open alerts</div></div>
        <div><div class="s-val">${cases.filter(c=>c.status!=='Closed').length}</div><div class="s-lab">Active cases</div></div>
      </div>
      <p style="color:var(--text-secondary);font-size:12.8px;line-height:1.7;margin-top:16px">Over the trailing 45-day observation window, the platform logged ${transactions.length} transactions across ${accounts.length} accounts. Of these, ${flagged.length+blocked.length} were flagged by the detection engine, and ${blocked.length} were blocked outright before settlement. The most common contributing indicator was unusual geographic location, followed by device trust anomalies and transaction amount deviation.</p>
    `;
  } else if(kind==='investigation-report'){
    const byStatus = ['Open','In Progress','Escalated','Closed'].map(s=>({s,n:cases.filter(c=>c.status===s).length}));
    out.innerHTML = reportHeader('Investigation Report', genTime) + `
      <div class="stat-inline">${byStatus.map(x=>`<div><div class="s-val">${x.n}</div><div class="s-lab">${x.s}</div></div>`).join('')}</div>
      <div class="table-scroll" style="margin-top:16px"><table class="data-table"><thead><tr><th>Case</th><th>Title</th><th>Severity</th><th>Status</th><th>Investigator</th><th>Opened</th></tr></thead><tbody>
      ${cases.slice().sort((a,b)=>sevRank(b.severity)-sevRank(a.severity)).map(c=>`<tr data-nav="cases/${c.id}"><td class="cell-mono">${c.id}</td><td>${esc(c.title)}</td><td>${badge(c.severity)}</td><td>${badge(c.status)}</td><td class="cell-muted">${c.investigator?esc(c.investigator):'Unassigned'}</td><td class="cell-muted">${fmtDate(c.createdAt)}</td></tr>`).join('')}
      </tbody></table></div>
    `;
  } else if(kind==='txn-risk-report'){
    const tiers=['low','medium','high','critical'];
    const dist = tiers.map(t=>transactions.filter(tx=>riskLevelFromScore(tx.riskScore)===t).length);
    out.innerHTML = reportHeader('Transaction Risk Report', genTime) + `
      <div class="stat-inline">${tiers.map((t,i)=>`<div><div class="s-val" style="color:${riskColorVar(t)}">${dist[i]}</div><div class="s-lab">${t[0].toUpperCase()+t.slice(1)} risk</div></div>`).join('')}</div>
      <div class="table-scroll" style="margin-top:16px"><table class="data-table"><thead><tr><th>Transaction</th><th>Amount</th><th>Flags</th><th>Risk</th><th>Status</th></tr></thead><tbody>
      ${transactions.filter(t=>t.riskScore>=55).slice(0,15).map(t=>`<tr data-nav="transactions/${t.id}"><td class="cell-mono">${t.id}</td><td class="cell-mono">${fmtMoney(t.amount)}</td><td>${t.flags.slice(0,2).map(f=>`<span class="flag-chip">${esc(f)}</span>`).join('')||'\u2014'}</td><td>${riskMeter(t.riskScore)}</td><td>${badge(t.status)}</td></tr>`).join('')}
      </tbody></table></div>
    `;
  } else if(kind==='customer-risk-report'){
    const tiers=['low','medium','high','critical'];
    const dist = tiers.map(t=>customers.filter(c=>c.riskLevel===t).length);
    out.innerHTML = reportHeader('Customer Risk Report', genTime) + `
      <div class="stat-inline">${tiers.map((t,i)=>`<div><div class="s-val" style="color:${riskColorVar(t)}">${dist[i]}</div><div class="s-lab">${t[0].toUpperCase()+t.slice(1)} risk</div></div>`).join('')}</div>
      <div class="table-scroll" style="margin-top:16px"><table class="data-table"><thead><tr><th>Customer</th><th>Segment</th><th>KYC</th><th>Risk</th><th>Status</th></tr></thead><tbody>
      ${customers.slice().sort((a,b)=>b.riskScore-a.riskScore).slice(0,15).map(c=>`<tr data-nav="customers/${c.id}"><td class="cell-strong">${esc(c.name)}</td><td>${esc(c.segment)}</td><td>${badge(c.kyc)}</td><td>${riskMeter(c.riskScore)}</td><td>${badge(c.status)}</td></tr>`).join('')}
      </tbody></table></div>
    `;
  } else if(kind==='fraud-trends'){
    out.innerHTML = reportHeader('Fraud Trends Report', genTime) + `
      <div class="chart-wrap tall"><canvas id="chart-report-trend"></canvas></div>
      <p style="color:var(--text-secondary);font-size:12.8px;line-height:1.7;margin-top:14px">Alert volume has been concentrated among customers transacting through high-risk geographic corridors, with a secondary cluster tied to unrecognized-device logins. Detection rate has remained stable, driven primarily by rules targeting unusual transaction amounts and impossible-travel patterns.</p>
    `;
    const days = Array.from({length:14},(_,i)=>13-i);
    const dayLabels = days.map(d=>{ const dt=new Date(NOW); dt.setDate(dt.getDate()-d); return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}); });
    const alertSeries = days.map(d=>alerts.filter(a=>Math.floor((NOW-new Date(a.createdAt))/86400000)===d).length);
    makeChart('chart-report-trend', {
      type:'line',
      data:{ labels:dayLabels, datasets:[{ label:'Alerts raised', data:alertSeries, borderColor:'#3DD9C7', backgroundColor:'rgba(61,217,199,0.12)', fill:true, tension:.35, pointRadius:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:CHART_GRID},beginAtZero:true} } }
    });
  }
  out.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.nav)));
  out.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function reportHeader(title, time){
  return `<div class="panel-head"><div><div class="panel-title">${esc(title)}</div><div class="panel-sub">Generated ${time} \u00b7 Sentry Watch Fraud Platform</div></div><button class="btn btn-sm" onclick="window.print()">Print / Export</button></div>`;
}

/* ---------------------------------------------------------
   21. GLOBAL SEARCH
   --------------------------------------------------------- */
const searchInput = document.getElementById('global-search-input');
const searchResults = document.getElementById('search-results');

function runGlobalSearch(q){
  q = q.trim().toLowerCase();
  if(!q){ searchResults.hidden = true; return; }
  const groups = [];

  const custMatches = customers.filter(c=>c.name.toLowerCase().includes(q)||c.id.toLowerCase().includes(q)||c.email.toLowerCase().includes(q)).slice(0,4);
  if(custMatches.length) groups.push({label:'Customers', items:custMatches.map(c=>({title:c.name, sub:`${c.id} \u00b7 ${c.segment}`, route:`customers/${c.id}`}))});

  const txnMatches = transactions.filter(t=>t.id.toLowerCase().includes(q)||t.merchant.toLowerCase().includes(q)).slice(0,4);
  if(txnMatches.length) groups.push({label:'Transactions', items:txnMatches.map(t=>({title:t.id, sub:`${fmtMoney(t.amount)} at ${t.merchant}`, route:`transactions/${t.id}`}))});

  const accMatches = accounts.filter(a=>a.id.toLowerCase().includes(q)).slice(0,3);
  if(accMatches.length) groups.push({label:'Accounts', items:accMatches.map(a=>({title:a.id, sub:`${a.type} \u00b7 ${custById(a.customerId).name}`, route:`customers/${a.customerId}`}))});

  const devMatches = devices.filter(d=>d.id.toLowerCase().includes(q)||d.model.toLowerCase().includes(q)||d.ip.includes(q)).slice(0,3);
  if(devMatches.length) groups.push({label:'Devices', items:devMatches.map(d=>({title:d.id, sub:`${d.model} \u00b7 ${d.ip}`, route:`devices`}))});

  const alertMatches = alerts.filter(a=>a.id.toLowerCase().includes(q)||a.type.toLowerCase().includes(q)).slice(0,3);
  if(alertMatches.length) groups.push({label:'Fraud Alerts', items:alertMatches.map(a=>({title:a.id, sub:a.type, route:`transactions/${a.transactionId}`}))});

  const caseMatches = cases.filter(c=>c.id.toLowerCase().includes(q)||c.title.toLowerCase().includes(q)).slice(0,3);
  if(caseMatches.length) groups.push({label:'Investigation Cases', items:caseMatches.map(c=>({title:c.id, sub:c.title, route:`cases/${c.id}`}))});

  if(groups.length===0){
    searchResults.innerHTML = `<div class="search-empty">No matches for "${esc(q)}"</div>`;
  } else {
    searchResults.innerHTML = groups.map(g=>`<div class="search-group-label">${esc(g.label)}</div>${g.items.map(it=>`<div class="search-item" data-nav="${it.route}"><div class="search-item-main"><span class="search-item-title">${esc(it.title)}</span><span class="search-item-sub">${esc(it.sub)}</span></div></div>`).join('')}`).join('');
  }
  searchResults.hidden = false;
  searchResults.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', ()=>{ navigate(el.dataset.nav); searchInput.value=''; searchResults.hidden=true; });
  });
}
searchInput.addEventListener('input', e=>runGlobalSearch(e.target.value));
searchInput.addEventListener('focus', e=>{ if(e.target.value.trim()) runGlobalSearch(e.target.value); });
document.addEventListener('click', e=>{
  if(!e.target.closest('.global-search')) searchResults.hidden = true;
});
document.addEventListener('keydown', e=>{
  if(e.key==='/' && document.activeElement!==searchInput && !e.target.closest('input,textarea,select')){
    e.preventDefault(); searchInput.focus();
  }
});

/* ---------------------------------------------------------
   22. NOTIFICATIONS UI
   --------------------------------------------------------- */
function notifIcon(kind){
  if(kind==='alert') return {ic:'\u26a0', bg:'var(--risk-high-bg)', col:'var(--risk-high)'};
  if(kind==='case') return {ic:'\ud83d\udcc1', bg:'var(--accent-glow)', col:'var(--accent)'};
  return {ic:'\u26d4', bg:'var(--risk-critical-bg)', col:'var(--risk-critical)'};
}
function renderNotifPanel(){
  const list = document.getElementById('notif-list');
  const dot = document.getElementById('notif-dot');
  const unread = NOTIFICATIONS.filter(n=>!notifReadIds.has(n.id));
  dot.hidden = unread.length===0;
  if(NOTIFICATIONS.length===0){ list.innerHTML = `<div class="notif-empty">No notifications.</div>`; return; }
  list.innerHTML = NOTIFICATIONS.map(n=>{
    const isUnread = !notifReadIds.has(n.id);
    const style = notifIcon(n.kind);
    return `<div class="notif-item ${isUnread?'unread':''}" data-notif="${n.id}" data-route="${n.route}">
      <span class="notif-ico" style="background:${style.bg};color:${style.col}">${style.ic}</span>
      <div class="notif-body"><div class="notif-text">${esc(n.text)}</div><div class="notif-time">${timeAgo(n.time)}</div></div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-notif]').forEach(el=>{
    el.addEventListener('click', ()=>{
      notifReadIds.add(el.dataset.notif);
      saveState();
      renderNotifPanel();
      navigate(el.dataset.route);
      document.getElementById('notif-panel').hidden = true;
    });
  });
}
document.getElementById('notif-btn').addEventListener('click', e=>{
  e.stopPropagation();
  const panel = document.getElementById('notif-panel');
  panel.hidden = !panel.hidden;
  if(!panel.hidden) renderNotifPanel();
});
document.getElementById('notif-mark-all').addEventListener('click', e=>{
  e.stopPropagation();
  NOTIFICATIONS.forEach(n=>notifReadIds.add(n.id));
  saveState();
  renderNotifPanel();
  toast('All notifications marked as read.');
});
document.addEventListener('click', e=>{
  if(!e.target.closest('#notif-wrap')) document.getElementById('notif-panel').hidden = true;
});

/* ---------------------------------------------------------
   23. SIDEBAR TOGGLE (mobile)
   --------------------------------------------------------- */
document.getElementById('sidebar-toggle').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('open');
});

/* ---------------------------------------------------------
   24. INIT
   --------------------------------------------------------- */
renderNotifPanel();
router();

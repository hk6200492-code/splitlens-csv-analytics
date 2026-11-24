'use strict';
function parseCSV(text) {
  text=text.replace(/^\uFEFF/,'');
  const rows=[]; let row=[], field='', quoted=false, closed=false;
  function finishField(){row.push(field.trim());field='';closed=false;}
  function finishRow(){finishField();if(row.some(x=>x!==''))rows.push(row);row=[];}
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(c==='"'&&text[i+1]==='"'){field+='"';i++;}
      else if(c==='"'){quoted=false;closed=true;}
      else field+=c;
    }else if(c===',')finishField();
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;finishRow();}
    else if(c==='"'&&field===''&&!closed)quoted=true;
    else if(closed||c==='"')throw Error('Check the quotation marks in your CSV.');
    else field+=c;
  }
  if(quoted)throw Error('A quoted field is missing its closing quotation mark.');
  finishRow();const headers=rows.shift()||[];
  if(headers.some(h=>!h)||new Set(headers).size!==headers.length||headers.length<3)throw Error('Use at least three distinctly named columns.');
  if(rows.length<2||rows.some(r=>r.length!==headers.length))throw Error('Every data row needs one field per column.');
  return {headers,rows};
}
function avg(values){return values.reduce((a,b)=>a+b,0)/values.length;}
function scan(rows,arm,target,segment){
  const clean=rows.filter(r=>r[arm]&&r[segment]&&r[target]!==''&&Number.isFinite(Number(r[target])));
  const names=[...new Set(clean.map(r=>r[arm]))].sort();
  if(names.length!==2)throw Error('Choose a comparison column containing two categories.');
  const groups=new Map(),total=[[],[]];
  clean.forEach(r=>{
    const a=names.indexOf(r[arm]),v=Number(r[target]);
    if(!groups.has(r[segment]))groups.set(r[segment],[[],[]]);
    groups.get(r[segment])[a].push(v);total[a].push(v);
  });
  const parts=[...groups].map(([label,g])=>({label,counts:g.map(x=>x.length),means:g.map(x=>x.length?avg(x):null)}));
  const paired=parts.filter(p=>p.counts.every(Boolean));
  const means=total.map(avg),gap=means[1]-means[0];
  const delta=p=>p.means[1]-p.means[0];
  const n=paired.reduce((s,p)=>s+p.counts[0]+p.counts[1],0);
  const adjusted=n?paired.reduce((s,p)=>s+delta(p)*(p.counts[0]+p.counts[1])/n,0):null;
  const reversed=parts.length>=2&&paired.length===parts.length&&paired.every(p=>Math.sign(delta(p))*Math.sign(gap)===-1);
  return {names,parts,means,gap,adjusted,reversed,used:clean.length,coverage:n};
}
// A one-feature regression tree predicting the target by category means.
// Leave-one-out predictions remove each row before estimating its own group.
function modelScore(rows,target,feature){
  const data=rows.filter(r=>r[feature]&&r[target]!==''&&Number.isFinite(Number(r[target])));
  if(data.length<3)return null;
  const sums=new Map();let total=0;
  for(const r of data){const v=Number(r[target]);total+=v;const s=sums.get(r[feature])||[0,0];s[0]+=v;s[1]++;sums.set(r[feature],s);}
  let error=0,baseline=0;
  for(const r of data){const v=Number(r[target]),[sum,n]=sums.get(r[feature]);const base=(total-v)/(data.length-1);
    const pred=n>1?(sum-v)/(n-1):base;error+=(v-pred)**2;baseline+=(v-base)**2;}
  return baseline?1-error/baseline:null;
}

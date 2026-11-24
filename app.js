const el=id=>document.getElementById(id);
const fields=['arm','target','segment'];
let dataset;
const fmt=x=>x===null?'Unavailable':Number(x.toFixed(4)).toLocaleString(undefined,{maximumFractionDigits:4});
function display(){
  try{
    const indices=fields.map(id=>Number(el(id).value));
    if(new Set(indices).size!==3)throw Error('Choose a different column for each field.');
    const [arm,target,segment]=indices;
    const result=scan(dataset.rows,arm,target,segment);
    const {names,parts,gap,adjusted,reversed,used,coverage}=result;
    el('headline').textContent=reversed?'The ranking reverses.':'Comparing the segment results';
    el('insight').textContent=reversed?names[gap>0?1:0]+' leads overall, but '+names[gap>0?0:1]+' leads within every '+dataset.headers[segment]+' group.':'Read the overall difference alongside the group means below.';
    const binary=dataset.rows.filter(r=>r[arm]&&r[segment]&&r[target]!==''&&Number.isFinite(Number(r[target]))).every(r=>[0,1].includes(Number(r[target])));
    const diff=x=>x===null?'Unavailable':binary?fmt(x*100)+' pp':fmt(x);
    const mean=x=>x===null?'—':binary?fmt(x*100)+'%':fmt(x);
    el('gap').textContent=diff(gap);el('adjusted').textContent=diff(adjusted);
    const score=modelScore(dataset.rows.filter(r=>r[arm]),target,segment);
    el('skill').textContent=score===null?'Unavailable':fmt(score*100)+'%';
    function fillRow(parent,items,tag){const row=parent.insertRow();for(const value of items){const cell=document.createElement(tag);cell.textContent=value;row.append(cell);}}
    el('columns').replaceChildren();el('body').replaceChildren();
    fillRow(el('columns'),[dataset.headers[segment],...names.map(n=>n+' mean (rows)'),names[1]+' − '+names[0]],'th');
    for(const p of parts)fillRow(el('body'),[p.label,...p.means.map((m,i)=>mean(m)+' ('+p.counts[i]+')'),p.means.includes(null)?'—':diff(p.means[1]-p.means[0])],'td');
    el('coverage').textContent=used+' of '+dataset.rows.length+' rows used · '+coverage+' rows in shared segments · Differences shown as '+names[1]+' minus '+names[0]+(binary?' in percentage points.':'.');
    el('error').textContent='';el('result').hidden=false;
  }catch(e){el('error').textContent=e.message;el('result').hidden=true;}
}
function load(text,name){
  dataset=parseCSV(text);
  const {rows,headers}=dataset;
  const unique=headers.map((_,i)=>new Set(rows.map(r=>r[i]).filter(Boolean)));
  const numeric=unique.map(set=>set.size>0&&[...set].every(v=>Number.isFinite(Number(v))));
  let target=numeric.indexOf(true);if(target<0)target=1;
  let arm=unique.findIndex((v,i)=>i!==target&&v.size===2);if(arm<0)arm=target===0?1:0;
  const segment=headers.findIndex((_,i)=>i!==target&&i!==arm);
  fields.forEach((id,j)=>{const select=el(id);select.replaceChildren(...headers.map((h,i)=>new Option(h,i)));select.value=[arm,target,segment][j];});
  el('source').textContent=name+' · '+rows.length+' rows';display();
}
fields.forEach(id=>el(id).onchange=display);
el('sample').onclick=()=>load(demoCSV,'Campaign demo');
el('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3*1024*1024)throw Error('Choose a CSV smaller than 3 MB.');load(await f.text(),f.name);}catch(err){el('error').textContent=err.message;el('result').hidden=true;}e.target.value='';};
load(demoCSV,'Campaign demo');

#!/usr/bin/env python3
content = open('src/App.jsx').read()

# Find and replace the ingMap block by line numbers
lines = content.split('\n')
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if 'const ingMap={}' in line:
        start_idx = i
    if start_idx and i > start_idx and 'const allItems=' in line:
        end_idx = i
        break

if start_idx and end_idx:
    new_block = """  const ingMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{
    const full=recipes.find(rec=>String(rec.id)===String(r.id));
    (full?.ingredients||r.ingredients||[]).forEach(ing=>{
      const rawName=(ing.name||'').trim();
      if(!rawName)return;
      const k=normalizeIngKey(rawName);
      const capName=cap(rawName);
      const amtStr=String(ing.amount||'').trim();
      const unit=(ing.unit||'').trim();
      const amtDisplay=amtStr&&amtStr!=='0'?(amtStr+(unit?' '+unit:'')):'al gusto';
      if(!ingMap[k]){
        ingMap[k]={id:k,name:capName,amounts:[amtDisplay],category:guessCategory(rawName)};
      }else{
        const exists=ingMap[k].amounts.includes(amtDisplay);
        if(!exists)ingMap[k].amounts.push(amtDisplay);
      }
    });
  });});});"""
    new_lines = lines[:start_idx] + new_block.split('\n') + lines[end_idx:]
    content = '\n'.join(new_lines)
    open('src/App.jsx','w').write(content)
    print("OK: ingMap fixed, lines", start_idx, "to", end_idx)
else:
    print("ERROR: ingMap block not found, start=", start_idx, "end=", end_idx)

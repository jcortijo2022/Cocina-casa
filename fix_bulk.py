lines = open('src/App.jsx').readlines()
for i,line in enumerate(lines):
    if 'Eliminar marcados' in line and 'shopping_deleted' in line:
        old = "onClick={()=>{const ids=Object.entries(checked).filter(([,v])=>v).map(([k])=>k);setExtras(p=>p.filter(i=>!ids.includes(i.id)));setDeletedByWeek(p=>{const cur=p[key]||[];const n={...p,[key]:[...new Set([...cur,...ids])]};supabase.from('shopping_deleted').upsert(ids.map(id=>({id,week_key:key}))).then(()=>{});return n;});setChecked({});setChecked({});}}"
        new = "onClick={()=>{const ids=Object.entries(checked).filter(([,v])=>v).map(([k])=>k);const eIds=ids.filter(id=>String(id).startsWith('ex-'));const iIds=ids.filter(id=>!String(id).startsWith('ex-'));if(eIds.length>0){supabase.from('shopping_extras').delete().in('id',eIds).then(()=>{});setExtras(p=>p.filter(i=>!eIds.includes(String(i.id))));}if(iIds.length>0){setDeletedByWeek(p=>{const cur=p[key]||[];const n={...p,[key]:[...new Set([...cur,...iIds])]};supabase.from('shopping_deleted').upsert(iIds.map(id=>({id,week_key:key}))).then(()=>{});return n;});}setChecked({});}}"
        if old in line:
            lines[i]=line.replace(old,new)
            print('OK')
        else:
            print('ERROR - dumping line:')
            print(repr(line[200:500]))
        break
open('src/App.jsx','w').writelines(lines)

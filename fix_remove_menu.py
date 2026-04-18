#!/usr/bin/env python3
content = open('src/App.jsx').read()

old = """  function removeFromMenu(day,slot,id){
    const nm=JSON.parse(JSON.stringify(weekMenu));
    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}
    saveMenu(nm);
    // Check if recipe still exists in menu this week - if not, clear its deleted ingredients
    const stillInMenu=Object.values(nm[key]||{}).some(slots=>Object.values(slots).some(rs=>rs.some(r=>String(r.id)===String(id))));
    if(!stillInMenu&&setDeletedByWeek){
      // We need to recalculate - get ingredient keys for this recipe
      // For simplicity, clear ALL deleted for this week when recipe fully removed
      // Actually better: just leave deleted as is - user explicitly deleted them
    }
  }"""

new = """  function removeFromMenu(day,slot,id){
    const nm=JSON.parse(JSON.stringify(weekMenu));
    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}
    saveMenu(nm);
    // If recipe no longer in menu this week, clear its deleted ingredients
    const stillInMenu=Object.values(nm[key]||{}).some(slots=>Object.values(slots).some(rs=>rs.some(r=>String(r.id)===String(id))));
    if(!stillInMenu){
      const recipe=recipes.find(r=>String(r.id)===String(id));
      if(recipe&&onClearDeleted)onClearDeleted(recipe,key);
    }
  }"""

if old in content:
    content = content.replace(old, new)
    open('src/App.jsx','w').write(content)
    print("OK: removeFromMenu fixed")
else:
    print("ERROR: patron no encontrado")
    idx = content.find("function removeFromMenu")
    if idx >= 0:
        print(repr(content[idx:idx+400]))

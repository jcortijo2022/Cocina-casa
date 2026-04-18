#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# 1. Fix getWeekKey - start on Saturday
old1 = """function getWeekKey(off=0){
  const n=new Date();
  const day=n.getDay();
  const diff=n.getDate()-day+(day===0?-6:1);
  const mon=new Date(n.setDate(diff+off*7));
  return mon.toISOString().split("T")[0];
}"""
new1 = """function getWeekKey(off=0){
  const n=new Date();
  const day=n.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diffToSat=(day===6)?0:(day===0)?-1:-(day+1);
  const sat=new Date();
  sat.setDate(n.getDate()+diffToSat+off*7);
  sat.setHours(0,0,0,0);
  return sat.toISOString().split("T")[0];
}"""
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("getWeekKey starts Saturday")

# 2. Fix getWeekDates - start on Saturday
old2 = """function getWeekDates(off=0){
  const n=new Date();
  const day=n.getDay();
  const diff=n.getDate()-day+(day===0?-6:1);
  const mon=new Date(new Date().setDate(diff+off*7));
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);
  const f=x=>x.toLocaleDateString("es-ES",{day:"numeric",month:"short"});
  return f(mon)+" - "+f(sun);
}"""
new2 = """function getWeekDates(off=0){
  const n=new Date();
  const day=n.getDay();
  const diffToSat=(day===6)?0:(day===0)?-1:-(day+1);
  const sat=new Date();
  sat.setDate(n.getDate()+diffToSat+off*7);
  sat.setHours(0,0,0,0);
  const fri=new Date(sat);
  fri.setDate(sat.getDate()+6);
  const f=x=>x.toLocaleDateString("es-ES",{day:"numeric",month:"short"});
  return f(sat)+" - "+f(fri);
}"""
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("getWeekDates starts Saturday")

# 3. Update DAYS to start from Saturday
old3 = 'const DAYS = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];'
new3 = 'const DAYS = ["Sabado","Domingo","Lunes","Martes","Miercoles","Jueves","Viernes"];'
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("DAYS starts Saturday")
else:
    # Already changed
    if '"Sabado","Domingo","Lunes"' in content:
        fixes.append("DAYS already starts Saturday")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Borra el menu en Supabase: DELETE FROM week_menu;")
print("Luego: npm run build && vercel --prod")

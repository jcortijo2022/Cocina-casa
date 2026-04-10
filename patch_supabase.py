#!/usr/bin/env python3
# patch_supabase.py

content = open('src/App.jsx').read()
fixes = []

# 1. Add supabase import at the top
old1 = 'import { useState, useEffect, useRef } from "react";'
new1 = '''import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qqgrdvtdstmqlhlpthxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ3JkdnRkc3RtcWxobHB0aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjgyNzgsImV4cCI6MjA5MTM0NDI3OH0.5RCzKw6yM6w62T7UPrkdyWC8RILzvITubt8D6rXyASM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);'''

if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("supabase import")

# 2. Replace App state and functions with Supabase versions
old2 = '''  const [recipes,setRecipes]=useState(()=>{try{return JSON.parse(localStorage.getItem("cocina_recipes")||"[]");}catch{return [];}});
  const [weekMenu,setWeekMenu]=useState(()=>{try{return JSON.parse(localStorage.getItem("cocina_menu")||"{}");}catch{return {};}});
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("cocina_api_key")||"");
  const [apiKeyOpen,setApiKeyOpen]=useState(false);
  const currentWeekOffset=0;

  useEffect(()=>{localStorage.setItem("cocina_menu",JSON.stringify(weekMenu));},[weekMenu]);

  function addRecipe(r){const u=[r,...recipes];setRecipes(u);localStorage.setItem("cocina_recipes",JSON.stringify(u));}
  function deleteRecipe(id){const u=recipes.filter(r=>r.id!==id);setRecipes(u);localStorage.setItem("cocina_recipes",JSON.stringify(u));}
  function updateRecipe(r){const u=recipes.map(x=>x.id===r.id?r:x);setRecipes(u);localStorage.setItem("cocina_recipes",JSON.stringify(u));}'''

new2 = '''  const [recipes,setRecipes]=useState([]);
  const [weekMenu,setWeekMenu]=useState({});
  const [loading,setLoading]=useState(true);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("cocina_api_key")||"");
  const [apiKeyOpen,setApiKeyOpen]=useState(false);
  const currentWeekOffset=0;

  // Load recipes from Supabase
  useEffect(()=>{
    async function loadData(){
      setLoading(true);
      try{
        const {data:recs}=await supabase.from("recipes").select("*").order("created_at",{ascending:false});
        if(recs)setRecipes(recs.map(r=>({
          id:r.id,title:r.title,description:r.description,image:r.image,
          mealType:r.meal_type,recipeType:r.recipe_type,
          ingredients:r.ingredients||[],steps:r.steps||[],
          sourceUrl:r.source_url,time:r.time,servings:r.servings,rating:r.rating||0
        })));
        const {data:menu}=await supabase.from("week_menu").select("*");
        if(menu){
          const menuObj={};
          menu.forEach(m=>{
            if(!menuObj[m.week_key])menuObj[m.week_key]={};
            if(!menuObj[m.week_key][m.day])menuObj[m.week_key][m.day]={};
            if(!menuObj[m.week_key][m.day][m.slot])menuObj[m.week_key][m.day][m.slot]=[];
            if(m.recipe_data)menuObj[m.week_key][m.day][m.slot].push(m.recipe_data);
          });
          setWeekMenu(menuObj);
        }
      }catch(e){console.error("Error loading:",e);}
      setLoading(false);
    }
    loadData();
  },[]);

  async function addRecipe(r){
    const {error}=await supabase.from("recipes").insert({
      id:r.id,title:r.title,description:r.description,image:r.image,
      meal_type:r.mealType,recipe_type:r.recipeType,
      ingredients:r.ingredients,steps:r.steps,
      source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0
    });
    if(!error)setRecipes(p=>[r,...p]);
  }

  async function deleteRecipe(id){
    await supabase.from("recipes").delete().eq("id",id);
    await supabase.from("week_menu").delete().eq("recipe_id",id);
    setRecipes(p=>p.filter(r=>r.id!==id));
  }

  async function updateRecipe(r){
    await supabase.from("recipes").update({
      title:r.title,description:r.description,image:r.image,
      meal_type:r.mealType,recipe_type:r.recipeType,
      ingredients:r.ingredients,steps:r.steps,
      source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0
    }).eq("id",r.id);
    setRecipes(p=>p.map(x=>x.id===r.id?r:x));
  }'''

if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("supabase data functions")

# 3. Fix setWeekMenu to also save to Supabase
old3 = "  useEffect(()=>{localStorage.setItem(\"cocina_menu\",JSON.stringify(weekMenu));},[weekMenu]);"
# Already removed, skip

# 4. Replace setWeekMenu calls to also persist to Supabase
# We need to wrap setWeekMenu with a save function
old4 = "  const [detailId,setDetailId]=useState(null);"
new4 = '''  const [detailId,setDetailId]=useState(null);

  async function saveMenuToSupabase(newMenu){
    setWeekMenu(newMenu);
    // Sync to Supabase - delete all and reinsert
    try{
      await supabase.from("week_menu").delete().neq("id","00000000-0000-0000-0000-000000000000");
      const rows=[];
      Object.entries(newMenu).forEach(([weekKey,days])=>{
        Object.entries(days).forEach(([day,slots])=>{
          Object.entries(slots).forEach(([slot,recipeList])=>{
            recipeList.forEach(r=>{
              rows.push({week_key:weekKey,day,slot,recipe_id:r.id,recipe_data:r});
            });
          });
        });
      });
      if(rows.length>0)await supabase.from("week_menu").insert(rows);
    }catch(e){console.error("Error saving menu:",e);}
  }'''

if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("saveMenuToSupabase function")

# 5. Pass saveMenuToSupabase as setWeekMenu to pages
old5 = '        {page==="recetas"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId}/>}'
new5 = '        {loading?(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><div style={{fontSize:48}}>🍳</div><p style={{color:"#9CA3AF"}}>Cargando...</p></div>):page==="recetas"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} setWeekMenu={saveMenuToSupabase} currentWeekOffset={currentWeekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId}/>}'
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("RecipesPage uses saveMenuToSupabase")

old6 = '        {page==="menu"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} setWeekMenu={setWeekMenu}/>}'
new6 = '        {!loading&&page==="menu"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} setWeekMenu={saveMenuToSupabase}/>}'
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("WeeklyMenuPage uses saveMenuToSupabase")

old7 = '        {page==="compra"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes}/>}'
new7 = '        {!loading&&page==="compra"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes}/>}'
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("ShoppingListPage no loading")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")

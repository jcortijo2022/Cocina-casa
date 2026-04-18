#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# 1. Fix AllRecipesPage - add onClearDeleted prop
old1 = "function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe,getUseCount}){"
new1 = "function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe,getUseCount,onClearDeleted}){"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("AllRecipesPage accepts onClearDeleted")

# 2. Pass onClearDeleted from App to AllRecipesPage
old2 = "{page===\"todas\"&&<AllRecipesPage recipes={recipes} onDelete={deleteRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={0} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount}/>"
new2 = "{page===\"todas\"&&<AllRecipesPage recipes={recipes} onDelete={deleteRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={0} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount} onClearDeleted={clearRecipeDeletedItems}/>"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("App passes onClearDeleted to AllRecipesPage")

# 3. Fix duplicate check - show confirm instead of blocking
old3 = """    const existing=recipes.find(x=>x.title.toLowerCase().trim()===r.title.toLowerCase().trim());
    if(existing){alert("Ya tienes una receta con el nombre: "+r.title);return;}"""
new3 = """    const existing=recipes.find(x=>x.title.toLowerCase().trim()===r.title.toLowerCase().trim());
    if(existing){if(!window.confirm("Ya tienes una receta llamada '"+r.title+"'. ¿Añadir de todas formas?"))return;}"""
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("duplicate check uses confirm instead of block")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")

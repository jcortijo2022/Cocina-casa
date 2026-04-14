#!/usr/bin/env python3
# fix_v9.py

content = open('src/App.jsx').read()
fixes = []

# 1. Fix scroll - recipes grid needs padding-bottom so last row is fully visible
old1 = '      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>'
new1 = '      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,paddingBottom:80}}>'
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("grid padding-bottom")

# 2. Fix guessCategory - add missing items
old2 = "  // Carnes\n  if(/\\\\bpollo\\\\b|\\\\bcarne\\\\b|\\\\bcerdo\\\\b|ternera|\\\\bjamon\\\\b|chorizo|morcilla|panceta|costill|buey|cordero|\\\\bpavo\\\\b|\\\\bpato\\\\b|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|\\\\blomo\\\\b|solomillo|codillo|carrillada|chuleta|albondiga|hamburguesa/.test(n))return\"carnes\";"
new2 = "  // Carnes\n  if(/\\\\bpollo\\\\b|\\\\bcarne\\\\b|\\\\bcerdo\\\\b|ternera|\\\\bjamon\\\\b|chorizo|morcilla|panceta|costill|buey|cordero|\\\\bpavo\\\\b|\\\\bpato\\\\b|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|\\\\blomo\\\\b|solomillo|codillo|carrillada|chuleta|albondiga|hamburguesa|tocino|papada|lacón/.test(n))return\"carnes\";"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("tocino to carnes")

# 3. Fix verduras - add judias verdes explicitly
old3 = "  if(/tomate|cebolla|\\\\baj[oa]|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|\\\\bapio\\\\b|pepino|brocoli|coliflor|alcachofa|judia verde|acelga|champin|champinon|seta|portobello|calabaza|esparrago|guisante|haba|boniato|batata|\\\\bcol\\\\b|repollo|kale|canonigo|rucola|endivia|cebolleta|cebollino|maiz dulce|verdura|hortaliza/.test(n))return\"verduras\";"
new3 = "  if(/tomate|cebolla|\\\\baj[oa]|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|\\\\bapio\\\\b|pepino|brocoli|coliflor|alcachofa|judia verde|judias verdes|acelga|champin|champinon|seta|portobello|calabaza|esparrago|guisante|haba|boniato|batata|\\\\bcol\\\\b|repollo|kale|canonigo|rucola|endivia|cebolleta|cebollino|maiz dulce|verdura|hortaliza|puerro|nabo|rbano|chiriva/.test(n))return\"verduras\";"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("judias verdes to verduras")

# 4. Fix especias - add perejil and fresh herbs
old4 = "  if(/pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|\\\\baceite\\\\b|vinagre|canela|nuez moscada|clavo|especias|condimento|mostaza|ketchup|mayonesa|\\\\bsoja\\\\b|tabasco|curcuma|jengibre|cayena|guindilla|paprika|anis|hierbas|aliño/.test(n))return\"especias\";"
new4 = "  if(/pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|\\\\baceite\\\\b|vinagre|canela|nuez moscada|clavo|especias|condimento|mostaza|ketchup|mayonesa|\\\\bsoja\\\\b|tabasco|curcuma|jengibre|cayena|guindilla|paprika|anis|hierbas|aliño|perejil|albahaca|cilantro|eneldo|estragón|mejorana|cebollino|menta|hierbabuena/.test(n))return\"especias\";"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("perejil and herbs to especias")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")

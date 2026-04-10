#!/usr/bin/env python3
import shutil, os, base64

# Copy logo to public folder as favicon
shutil.copy('setup_logo.jpg', 'public/favicon.jpg')

# Update index.html to use jpg favicon
idx = open('index.html').read()
if '<link rel="icon"' in idx:
    import re
    idx = re.sub(r'<link rel="icon"[^>]*>', '<link rel="icon" type="image/jpeg" href="/favicon.jpg" />', idx)
else:
    idx = idx.replace('</head>', '<link rel="icon" type="image/jpeg" href="/favicon.jpg" />\n</head>')
open('index.html','w').write(idx)
print('OK: favicon actualizado')

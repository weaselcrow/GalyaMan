import json, os
a = json.load(open('out/assets.json'))
js = '\n'.join(open('js/'+f).read() for f in ['01_core.js','02_world.js','03_game.js','04_story.js','05_more.js'])
js = '(function(){\n' + js.replace("'use strict';\n", '', 1) + '\n})();'
js = "'use strict';\n" + js
tpl = open('index.tpl.html').read()
assets = json.dumps({'atlas': a['atlas'], 'frames': a['frames'], 'bg1': a['bg1'], 'bg2': a['bg2'], 'atlas2': a.get('atlas2'), 'sbg': a.get('sbg', []), 'smap': a.get('smap')})
html = tpl.replace('__FONT_CYR__', a['font_cyr']).replace('__FONT_LAT__', a['font_lat']).replace('__ASSETS__', assets).replace('__GAME__', js.replace('</script', '<\\/script'))
open('index.html', 'w').write(html)
print('index.html:', os.path.getsize('index.html'), 'bytes')

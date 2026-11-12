import json, os
a = json.load(open('out/assets.json'))
import glob
files = ['js/01_core.js', 'js/02_world.js', 'js/03_game.js'] + sorted(f for f in glob.glob('js/levels/*.js') if not os.path.basename(f).startswith('_'))
js = '\n'.join(open(f).read() for f in files)
js = '(function(){\n' + js.replace("'use strict';\n", '', 1) + '\n})();'
js = "'use strict';\n" + js
tpl = open('index.tpl.html').read()
assets = json.dumps({'atlas': a['atlas'], 'frames': a['frames'], 'bg1': a['bg1'], 'bg2': a['bg2']})
html = tpl.replace('__FONT_CYR__', a['font_cyr']).replace('__FONT_LAT__', a['font_lat']).replace('__ASSETS__', assets).replace('__GAME__', js.replace('</script', '<\\/script'))
open('index.html', 'w').write(html)
print('index.html:', os.path.getsize('index.html'), 'bytes')

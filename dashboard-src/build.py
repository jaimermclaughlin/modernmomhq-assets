import base64, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, 'audience-intelligence-dashboard.html')

def read(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return f.read()

data_files = ['data_meta.js', 'data_sources1.js', 'data_sources2.js', 'data_sources3.js',
              'data_findings.js', 'data_sick_want.js', 'data_listening.js',
              'data_landscape.js', 'data_strategy.js', 'data_resources.js']
script = '\n'.join(read(f) for f in data_files) + '\n' + read('app.js')
if '</script' in script.lower():
    sys.exit('Refusing to build: a data string contains a closing script tag')

with open(os.path.join(REPO, 'fonts', 'Faustine.woff2'), 'rb') as f:
    font = base64.b64encode(f.read()).decode('ascii')

ART = '--artifact' in sys.argv
if ART:
    OUT = sys.argv[sys.argv.index('--artifact')+1]
if ART:
    import re
    script, n = re.subn(r"function download\(name,type,content\)\{\n.*?\n\}\n", "function download(){}\n", script, flags=re.S)
    if n != 1:
        sys.exit('Could not strip the download function for the artifact build')
html = read('shell_artifact.html' if ART else 'shell.html').replace('{{STYLE}}', read('styles.css')).replace('{{FONT}}', font).replace('{{SCRIPT}}', script)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print('wrote', OUT, len(html.encode('utf-8')), 'bytes')

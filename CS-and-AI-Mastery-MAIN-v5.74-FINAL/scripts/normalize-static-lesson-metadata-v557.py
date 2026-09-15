import json,re,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'assets/course-data'; PAGES=ROOT/'courses'

def esc(s): return html.escape(str(s), quote=True)
def pat(lid):
    return re.compile(r'(<details class="[^"]*\blesson\b[^"]*" data-lesson="'+re.escape(esc(lid))+r'"[\s\S]*?<div class="body">)([\s\S]*?)(</div></details>)')

count=0
for dp in sorted(DATA.glob('*.json')):
    course=json.loads(dp.read_text(encoding='utf-8'))
    page=PAGES/f'{course["id"]}.html'
    text=page.read_text(encoding='utf-8')
    for idx,lesson in enumerate(course.get('lessons',[])):
        lid=lesson.get('id') or f'lesson-{idx}'
        m=pat(lid).search(text)
        if not m: raise SystemExit(f'missing {course["id"]}/{lid}')
        body=m.group(2)
        body=re.sub(r'<h3>What you will learn</h3>\s*<ul>[\s\S]*?</ul>\s*','',body,flags=re.I)
        body=re.sub(r'<h3>Key concepts</h3>\s*<div class="meta">[\s\S]*?</div>\s*','',body,flags=re.I)
        objs=lesson.get('objectives') or []
        cons=lesson.get('concepts') or []
        obj='<h3>What you will learn</h3><ul>'+''.join(f'<li>{esc(x)}</li>' for x in objs)+'</ul>\n'
        con='<h3>Key concepts</h3><div class="meta">'+''.join(f'<span class="pill">{esc(x)}</span>' for x in cons)+'</div>\n'
        body=obj+body.lstrip()
        pos=body.find('<h3>Example</h3>')
        if pos<0: raise SystemExit(f'example heading missing {course["id"]}/{lid}')
        body=body[:pos]+con+body[pos:]
        text=text[:m.start(2)]+body+text[m.end(2):]
        count+=1
    page.write_text(text,encoding='utf-8')
print('normalized metadata for',count,'lessons')

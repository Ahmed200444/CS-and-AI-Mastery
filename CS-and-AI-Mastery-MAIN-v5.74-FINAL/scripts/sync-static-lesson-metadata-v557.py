import json,re,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'assets/course-data'; PAGES=ROOT/'courses'

def esc(s): return html.escape(str(s), quote=True)

def lesson_chunk_pattern(lid):
    return re.compile(r'(<details class="[^"]*\blesson\b[^"]*" data-lesson="'+re.escape(esc(lid))+r'"[\s\S]*?<div class="body">)([\s\S]*?)(</div></details>)')

changed=0
for dp in sorted(DATA.glob('*.json')):
    course=json.loads(dp.read_text(encoding='utf-8'))
    page=PAGES/f'{course["id"]}.html'
    if not page.exists(): raise SystemExit(f'missing page {page.name}')
    text=page.read_text(encoding='utf-8')
    for idx,lesson in enumerate(course.get('lessons',[])):
        lid=lesson.get('id') or f'lesson-{idx}'
        pat=lesson_chunk_pattern(lid); m=pat.search(text)
        if not m: raise SystemExit(f'lesson missing from page: {course["id"]}/{lid}')
        body=m.group(2)
        objs=lesson.get('objectives') or []
        concepts=lesson.get('concepts') or []
        obj_html='<h3>What you will learn</h3><ul>'+''.join(f'<li>{esc(x)}</li>' for x in objs)+'</ul>'
        # Replace the objective block before the main explanation.
        body2=re.sub(r'<h3>What you will learn</h3>\s*<ul>[\s\S]*?</ul>',obj_html,body,count=1)
        if body2==body and objs:
            body2=obj_html+'\n'+body
        concept_html='<h3>Key concepts</h3><div class="meta">'+''.join(f'<span class="pill">{esc(x)}</span>' for x in concepts)+'</div>'
        body3=re.sub(r'<h3>Key concepts</h3>\s*<div class="meta">[\s\S]*?</div>',concept_html,body2,count=1)
        if body3==body2 and concepts:
            # Insert immediately before the native example heading when possible.
            body3=body2.replace('<h3>Example</h3>',concept_html+'<h3>Example</h3>',1)
        text=text[:m.start(2)]+body3+text[m.end(2):]
        changed+=1
    page.write_text(text,encoding='utf-8')
print('synced static metadata for',changed,'lessons')

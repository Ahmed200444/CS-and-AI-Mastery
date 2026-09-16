import json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
master=json.loads((root/'assets/coursedata-source.json').read_text())
audit=json.loads((root/'KHDA_CURRICULUM_BENCHMARK.json').read_text())
problems=[]
if len(master)!=62: problems.append(f'course count {len(master)} != 62')
lesson_total=sum(len(c.get('lessons',[])) for c in master)
if lesson_total!=800: problems.append(f'lesson count {lesson_total} != 800')
ids=[]; concept_total=0
for c in master:
    html=(root/'courses'/f"{c['id']}.html")
    mirror=(root/'assets/course-data'/f"{c['id']}.json")
    if not html.exists(): problems.append(f"missing html {c['id']}")
    if not mirror.exists(): problems.append(f"missing mirror {c['id']}")
    html_text=html.read_text(errors='replace') if html.exists() else ''
    for l in c.get('lessons',[]):
        lid=l.get('id'); ids.append((c['id'],lid))
        if not lid: problems.append(f"{c['id']}: lesson missing id")
        if not (l.get('objectives') or []): problems.append(f"{c['id']}/{lid}: no objectives")
        if not (l.get('explanation') or l.get('explain')): problems.append(f"{c['id']}/{lid}: no explanation")
        cs=l.get('concepts') or []
        if not cs: problems.append(f"{c['id']}/{lid}: no concepts")
        norm=[]; dedup=[]
        for x in cs:
            alnum=re.sub(r'[^a-z0-9]+',' ',str(x).lower()).strip()
            key=alnum or str(x).strip().lower()
            if key and key not in dedup: dedup.append(key)
            if alnum and alnum not in norm: norm.append(alnum)
        concept_total+=len(norm)
        if len(dedup)!=len(cs): problems.append(f"{c['id']}/{lid}: duplicate/blank concept")
        if html_text and f'data-lesson="{lid}"' not in html_text: problems.append(f"{c['id']}/{lid}: missing static lesson")
# verify additions survived
added=0
for row in audit['rows']:
    c=next((x for x in master if x['id']==row['course_id']),None)
    if not c: problems.append(f"audit unknown course {row['course_id']}"); continue
    html=(root/'courses'/f"{c['id']}.html").read_text(errors='replace')
    for ch in row.get('added',[]):
        l=next((x for x in c['lessons'] if x.get('id')==ch['lesson']),None)
        if not l: problems.append(f"audit missing lesson {c['id']}/{ch['lesson']}"); continue
        for concept in ch.get('added_concepts',[]):
            added+=1
            if concept not in l.get('concepts',[]): problems.append(f"addition lost in data {c['id']}/{ch['lesson']}: {concept}")
            if concept not in html and concept.replace('&','&amp;') not in html: problems.append(f"addition lost in HTML {c['id']}/{ch['lesson']}: {concept}")
if added!=audit['additions_count']: problems.append(f'addition count {added} != {audit["additions_count"]}')
# preserve assessments/projects/exercises and examples engine
counts={'courses':len(master),'lessons':lesson_total,'concepts':concept_total,'exercises':sum(len(c.get('exercises',[])) for c in master),'projects':sum(len(c.get('projects',[])) for c in master),'quiz':sum(len(c.get('quiz',[])) for c in master)}
study=(root/'assets/study-examples.js').read_text()
for needle in ['Examples for every key idea',"cs.map(function(c){return{label:c,kind:'Concept example'};})",'data-concept-example="true"','v5.47 KHDA-benchmarked company-use professional-readiness override']:
    if needle not in study: problems.append('study example engine missing '+needle)
if any(re.search(r'linear algebra|calculus|statistics',c['title'],re.I) and re.search(r'math',str(c.get('category','')),re.I) for c in master): problems.append('standalone theory math course added')
result={'release':'5.57','status':'PASS' if not problems else 'FAIL','counts':counts,'khda_additions':added,'problems':problems}
(root/'KHDA_POST_UPDATE_AUDIT.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
sys.exit(1 if problems else 0)

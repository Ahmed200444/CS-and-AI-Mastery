from pathlib import Path
from bs4 import BeautifulSoup
from collections import Counter
from urllib.parse import urlparse, unquote
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
fail=[]
def bad(msg): fail.append(msg)
def local_target(page,v):
    u=urlparse(v); path=unquote(u.path)
    if not path:return None
    if path.startswith('/'):
        return (ROOT/path.lstrip('/')).resolve()
    return (page.parent/path).resolve()

htmls=sorted(ROOT.rglob('*.html'))
course_pages=sorted((ROOT/'courses').glob('*.html'))
course_json=sorted((ROOT/'assets/course-data').glob('*.json'))
try: catalog=json.loads((ROOT/'assets/catalog-data.json').read_text())
except Exception as e: bad('catalog-data.json: '+str(e)); catalog={'courses':[]}
cat={c.get('id'):c for c in catalog.get('courses',[]) if c.get('id')}
pageids={p.stem for p in course_pages}; jsonids={p.stem for p in course_json}; catids=set(cat)
if not(len(course_pages)==len(course_json)==len(catids)==62):bad(f'62-course bijection failed: pages={len(course_pages)} json={len(course_json)} catalog={len(catids)}')
for name,a,b in [('catalog-vs-pages',catids,pageids),('catalog-vs-json',catids,jsonids)]:
    if a!=b:bad(name+f' mismatch missing={sorted(a-b)} extra={sorted(b-a)}')

# HTML structure, local references, visible raw code, embedded JSON, duplicate resources.
markers=['window.capWebReset','window.feReset','window.wdReset','renderApiSimMilestone','CAP_API_RESPONDER','window.capApiSend',"trackEditorShell('request-body.json'"]
local_refs=0; embedded_json=0
for page in htmls:
    text=page.read_text(errors='ignore'); soup=BeautifulSoup(text,'html.parser')
    ids=[x.get('id') for x in soup.find_all(attrs={'id':True})]
    dup=[k for k,v in Counter(ids).items() if v>1]
    if dup:bad(f'{page.relative_to(ROOT)} duplicate IDs: {dup[:8]}')
    resources=[]
    for el in soup.find_all(True):
        for attr in ('href','src'):
            v=el.get(attr)
            if not isinstance(v,str) or not v:continue
            if v.startswith(('http://','https://','data:','mailto:','tel:','javascript:','#','blob:')):continue
            parsed_path=urlparse(v).path
            if parsed_path.startswith('/runtime/') or parsed_path.startswith('/api/'):
                # Virtual runtime-cache and API routes are served by local-server.js / backend handlers.
                local_refs+=1
                continue
            if parsed_path.startswith('/'):bad(f'{page.relative_to(ROOT)} root-absolute local ref: {v}')
            t=local_target(page,v)
            if t is not None:
                local_refs+=1
                if not t.exists():bad(f'{page.relative_to(ROOT)} missing local ref: {v}')
        for attr in list(el.attrs):
            if attr.lower().startswith('on'):bad(f'{page.relative_to(ROOT)} inline event handler {attr}')
    for s in soup.find_all('script',src=True):resources.append(('script',urlparse(s['src']).path))
    for l in soup.find_all('link',href=True):
        if 'stylesheet' in (l.get('rel') or []):resources.append(('style',urlparse(l['href']).path))
    for res,n in Counter(resources).items():
        if n>1:bad(f'{page.relative_to(ROOT)} duplicate resource {res} x{n}')
    for sc in soup.find_all('script'):
        if (sc.get('type') or '').lower()=='application/json':
            embedded_json+=1
            try:json.loads(sc.string or sc.get_text() or '')
            except Exception as e:bad(f'{page.relative_to(ROOT)} JSON block {sc.get("id")}: {e}')
    vis=BeautifulSoup(text,'html.parser')
    for tag in vis(['script','style','pre','code','textarea','template','noscript']):tag.decompose()
    vtxt=vis.get_text('\n',strip=True)
    for m in markers:
        if m in vtxt:bad(f'{page.relative_to(ROOT)} visible raw-JS marker: {m}')

# Course data and static pages.
tot=Counter()
for cid in sorted(catids):
    d=json.loads((ROOT/'assets/course-data'/f'{cid}.json').read_text()); c=cat[cid]
    if d.get('id')!=cid:bad(f'{cid}: JSON id mismatch')
    if not str(d.get('title','')).strip():bad(f'{cid}: missing title')
    expected_counts={k:len(d.get(k,[])) for k in ('lessons','exercises','quiz','projects')}
    if c.get('counts')!=expected_counts:bad(f'{cid}: catalog counts {c.get("counts")} != {expected_counts}')
    for group in ('lessons','exercises','quiz','projects'):
        items=d.get(group,[]); tot[group]+=len(items)
        expected=[(x.get('id') if isinstance(x,dict) and x.get('id') else f'{group}-{i}') for i,x in enumerate(items)]
        if c.get('progressIds',{}).get(group)!=expected:bad(f'{cid}: progressIds mismatch for {group}')
    lids=[]
    for i,l in enumerate(d.get('lessons',[])):
        if not l.get('id') or not l.get('title'):bad(f'{cid}: lesson {i} missing id/title')
        if not l.get('objectives') or not l.get('concepts'):bad(f'{cid}: lesson {i} missing objectives/concepts')
        lids.append(l.get('id'))
    if len(lids)!=len(set(lids)):bad(f'{cid}: duplicate lesson ids')
    for i,q in enumerate(d.get('quiz',[])):
        opts=q.get('options'); corr=q.get('correct')
        if not str(q.get('q','')).strip():bad(f'{cid}: quiz {i} blank question')
        if not isinstance(opts,list) or len(opts)<2:bad(f'{cid}: quiz {i} invalid options')
        elif len(set(map(str,opts)))!=len(opts):bad(f'{cid}: quiz {i} duplicate options')
        if not isinstance(corr,int) or not isinstance(opts,list) or not (0<=corr<len(opts)):bad(f'{cid}: quiz {i} invalid correct index')
    exids=[]
    for i,x in enumerate(d.get('exercises',[])):
        if not x.get('title') or not x.get('prompt'):bad(f'{cid}: exercise {i} missing title/prompt')
        if x.get('id'):exids.append(x['id'])
    if len(exids)!=len(set(exids)):bad(f'{cid}: duplicate exercise ids')
    pids=[]
    for i,x in enumerate(d.get('projects',[])):
        if not x.get('id') or not x.get('title') or not (x.get('description') or x.get('desc')):bad(f'{cid}: project {i} incomplete')
        pids.append(x.get('id'))
    if len(pids)!=len(set(pids)):bad(f'{cid}: duplicate project ids')

    page=ROOT/'courses'/f'{cid}.html'; soup=BeautifulSoup(page.read_text(errors='ignore'),'html.parser')
    page_lids=[x.get('data-lesson') for x in soup.select('details.lesson')]
    ordered=[l.get('id') for idx,l in sorted(enumerate(d.get('lessons',[])),key=lambda iv:iv[1].get('displayOrder',iv[0]) if isinstance(iv[1].get('displayOrder',iv[0]),(int,float)) else iv[0])]
    if page_lids!=ordered:bad(f'{cid}: static lesson order != displayOrder')
    meta=soup.find('script',id='course-page-meta')
    if not meta:bad(f'{cid}: missing course-page-meta')
    else:
        md=json.loads(meta.string)
        if md.get('id')!=cid or md.get('lessonIds')!=page_lids:bad(f'{cid}: course-page-meta mismatch')
    hero=soup.select_one('.hero'); got={}
    if not hero:bad(f'{cid}: missing hero')
    else:
        for pill in hero.select('.pill'):
            m=re.fullmatch(r'(\d+)\s+(lessons|exercises|checkpoints|projects)',pill.get_text(' ',strip=True))
            if m:got[m.group(2)]=int(m.group(1))
        exp={'lessons':len(d.get('lessons',[])),'exercises':len(d.get('exercises',[])),'projects':len(d.get('projects',[]))+(1 if d.get('capstone') else 0)}
        if d.get('quiz'):exp['checkpoints']=len(d['quiz'])
        if got!=exp:bad(f'{cid}: hero counts {got} != {exp}')
    pmeta=soup.find('script',id='csai-project-data')
    if not pmeta:bad(f'{cid}: missing project JSON')
    else:
        pd=json.loads(pmeta.string); pt=[x.get('title') for x in pd.get('projects',[])]
        dt=[x.get('title') for x in d.get('projects',[])]+([d['capstone'].get('title')] if d.get('capstone') else [])
        if pt!=dt:bad(f'{cid}: project data mismatch')

# Route registry / path screens.
reg=(ROOT/'assets/runtime-inline/index-068.js').read_text()
entries=re.findall(r"^\s*([A-Za-z0-9_]+):\s*\{\s*containerId:\s*'([^']+)'(?:,\s*boot:\s*'([^']+)')?\s*\}",reg,re.M)
if len(entries)!=65:bad(f'route registry expected 65, found {len(entries)}')
idx=BeautifulSoup((ROOT/'index.html').read_text(errors='ignore'),'html.parser'); idxids={e.get('id') for e in idx.find_all(attrs={'id':True})}
alljs='\n'.join(p.read_text(errors='ignore') for p in ROOT.rglob('*.js'))
routes={r for r,_,_ in entries}
for route,container,boot in entries:
    if container not in idxids:bad(f'route {route}: missing container {container}')
    if boot:
        pats=[rf'window\.{re.escape(boot)}\s*=',rf'function\s+{re.escape(boot)}\s*\(',rf'(?:var|let|const)\s+{re.escape(boot)}\s*=']
        if not any(re.search(x,alljs) for x in pats):bad(f'route {route}: missing boot {boot}')
for p in list(ROOT.rglob('*.js'))+[ROOT/'index.html']:
    for m in re.finditer(r"showTrack\s*\(\s*['\"]([a-z0-9_-]{1,40})['\"]",p.read_text(errors='ignore'),re.I):
        if m.group(1) not in routes:bad(f'{p.relative_to(ROOT)} unknown showTrack target {m.group(1)}')

# data-act function availability.
acts=[]
for page in htmls:
    soup=BeautifulSoup(page.read_text(errors='ignore'),'html.parser')
    for el in soup.find_all(attrs={'data-act':True}):
        m=re.match(r'\s*([A-Za-z_$][\w$]*)\s*\(',el.get('data-act') or '')
        if m:acts.append(m.group(1))
for fn in sorted(set(acts)):
    pats=[rf'\bfunction\s+{re.escape(fn)}\s*\(',rf'\b(?:const|let|var)\s+{re.escape(fn)}\s*=',rf'\bwindow\.{re.escape(fn)}\s*=']
    if not any(re.search(x,alljs) for x in pats):bad(f'data-act function not defined: {fn}')

# Relative JS module imports must resolve.
for p in ROOT.rglob('*.js'):
    text=p.read_text(errors='ignore')
    for pat in [r'import\s*\(\s*["\']([^"\']+)["\']\s*\)',r'from\s+["\']([^"\']+)["\']',r'import\s+["\']([^"\']+)["\']']:
        for m in re.finditer(pat,text):
            v=m.group(1)
            if v.startswith(('./','../')) and not (p.parent/v).resolve().exists():bad(f'{p.relative_to(ROOT)} missing JS import {v}')

if not (ROOT/'START_SITE.bat').exists() or not (ROOT/'local-server.js').exists():bad('local launcher missing')
print(f'HTML={len(htmls)} courses={len(course_pages)} routes={len(entries)} localRefs={local_refs} embeddedJSON={embedded_json} lessons={tot["lessons"]} exercises={tot["exercises"]} quiz={tot["quiz"]} projects={tot["projects"]}')
if fail:
    print('DEEP_QA_FAIL',len(fail))
    for x in fail[:200]:print(' -',x)
    sys.exit(1)
print('DEEP_QA_PASS')

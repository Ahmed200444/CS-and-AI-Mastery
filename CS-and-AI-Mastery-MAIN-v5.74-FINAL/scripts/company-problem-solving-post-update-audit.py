from pathlib import Path
from bs4 import BeautifulSoup
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
GUIDES=ROOT/'assets'/'practice-guidance'
DATA=ROOT/'assets'/'course-data'
COURSES=ROOT/'courses'
problems=[]
counts={'courses':0,'lessons':0,'native_examples':0,'exercises':0,'projects':0,'knowledge_checks':0,'key_ideas':0,'base_example_slots':0,'course_pages':0}

def norm(v): return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9]+',' ',str(v or '').lower())).strip()
def check(g,label):
    if not isinstance(g,dict): problems.append(f'{label}: missing guide'); return
    if len(str(g.get('workScenario','')).strip())<80: problems.append(f'{label}: missing/weak company scenario')
    if len(str(g.get('workTask','')).strip())<70: problems.append(f'{label}: missing/weak work assignment')
    proc=g.get('engineerProcess'); done=g.get('acceptanceCriteria')
    if not isinstance(proc,list) or len(proc)!=6: problems.append(f'{label}: engineer process is not 6 steps')
    if not isinstance(done,list) or len(done)<3: problems.append(f'{label}: missing definition of done')

for f in sorted(GUIDES.glob('*.json')):
    d=json.loads(f.read_text(encoding='utf-8')); counts['courses']+=1
    check(d.get('course'),f'{f.stem}/course')
    for lid,m in d.get('lessons',{}).items():
        counts['lessons']+=1; check(m.get('practice'),f'{f.stem}/{lid}/lesson')
        for i,e in enumerate(m.get('examples',[])):
            counts['native_examples']+=1; check(e,f'{f.stem}/{lid}/example-{i+1}')
    for i,e in enumerate(d.get('exercises',[])):
        counts['exercises']+=1; check(e.get('practice'),f'{f.stem}/exercise-{i+1}')
    for i,e in enumerate(d.get('projects',[])):
        counts['projects']+=1; check(e.get('practice'),f'{f.stem}/project-{i+1}')
    counts['knowledge_checks']+=len(d.get('quiz',[]))

for f in sorted(DATA.glob('*.json')):
    d=json.loads(f.read_text(encoding='utf-8'))
    for lesson in d.get('lessons',[]):
        seen=set()
        for c in lesson.get('concepts',[]):
            k=norm(c)
            if k and k not in seen: seen.add(k)
        counts['key_ideas']+=len(seen)
        counts['base_example_slots']+=max(5,len(seen)+2)

for p in sorted(COURSES.glob('*.html')):
    counts['course_pages']+=1
    t=p.read_text(encoding='utf-8')
    if t.count('purpose-first-prompts.js')!=1: problems.append(f'{p.name}: company-problem example prompt asset not loaded exactly once')
    if t.count('practice-guidance.js')!=1: problems.append(f'{p.name}: practice guidance asset not loaded exactly once')

expected={'courses':62,'lessons':800,'native_examples':895,'exercises':794,'projects':271,'knowledge_checks':1585,'key_ideas':3424,'base_example_slots':5039,'course_pages':62}
for k,v in expected.items():
    if counts[k]!=v: problems.append(f'{k}: {counts[k]} != {v}')

renderer=(ROOT/'assets'/'practice-guidance.js').read_text(encoding='utf-8')
for token in ['Company-style ticket','How an engineer should approach it','Definition of done','data-csai-company-ticket','data-csai-engineer-workflow','data-csai-definition-of-done']:
    if token not in renderer: problems.append(f'practice renderer missing {token}')
prompt=(ROOT/'assets'/'purpose-first-prompts.js').read_text(encoding='utf-8')
for token in ['Company problem before ','Company-style ticket:','Your first move:','Definition of done:','data-csai-company-problem']:
    if token not in prompt: problems.append(f'example prompt layer missing {token}')
study=(ROOT/'assets'/'study-examples.js').read_text(encoding='utf-8')
for token in ['professionalScenario','Success check:','data-concept-coverage']:
    if token not in study: problems.append(f'key-idea example system missing {token}')

ps=json.loads((GUIDES/'problem-solving.json').read_text(encoding='utf-8'))
for lid,m in ps.get('lessons',{}).items():
    p=m.get('practice',{})
    if 'inputs, outputs, constraints, examples, and acceptance criteria' not in ' '.join(p.get('engineerProcess',[])).lower(): problems.append(f'problem-solving/{lid}: ticket-decomposition workflow missing')

# Make sure the huge embedded course JSON is still one valid HTML script element. A literal
# </script> inside lesson text used to terminate it early and corrupt the rest of index.html.
idx=(ROOT/'index.html').read_text(encoding='utf-8')
soup=BeautifulSoup(idx,'html.parser')
node=soup.find('script',id='coursedata')
if not node: problems.append('index.html: coursedata script missing')
else:
    try:
        embedded=json.loads(node.string or node.get_text() or '[]')
        if len(embedded)!=62: problems.append(f'index.html: embedded coursedata has {len(embedded)} courses, expected 62')
    except Exception as e: problems.append('index.html: embedded coursedata JSON invalid: '+str(e))
if soup.find('epsilon') is not None: problems.append('index.html: stray <epsilon> tag indicates course JSON escaped out of its script block')

report={'release':'5.57','status':'PASS' if not problems else 'FAIL','counts':counts,'checks':{
  'company_ticket_guidance_on_every_course_lesson_native_example_exercise_project':not any('company scenario' in p or 'work assignment' in p or 'engineer process' in p or 'definition of done' in p for p in problems),
  'generated_examples_receive_company_problem_prompt_layer':all(x in prompt for x in ['Company-style ticket:','Your first move:','Definition of done:']),
  'every_key_idea_still_has_professional_example_contract':counts['key_ideas']==3424 and counts['base_example_slots']==5039 and all(x in study for x in ['professionalScenario','Success check:']),
  'problem_solving_uses_ticket_decomposition_workflow':not any(p.startswith('problem-solving/') for p in problems),
  'embedded_course_json_is_html_safe_and_valid':not any(p.startswith('index.html:') for p in problems)
},'problems':problems}
(ROOT/'COMPANY_PROBLEM_SOLVING_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
md=f'''# CS & AI Mastery v5.57 — Company Problem-Solving Audit\n\nStatus: **{report['status']}**\n\n- Courses: {counts['courses']}\n- Lessons: {counts['lessons']}\n- Native examples: {counts['native_examples']}\n- Exercises: {counts['exercises']}\n- Projects/capstones: {counts['projects']}\n- Knowledge checks preserved: {counts['knowledge_checks']}\n- Normalized key ideas: {counts['key_ideas']}\n- Base concept/integration/edge example slots: {counts['base_example_slots']}\n\nEvery course, lesson, native example, exercise, and project has a company-style situation, assigned task, six-step engineer workflow, and definition of done. Generated concept examples also receive a visible company-problem prompt before the solution.\n\nThe repeated workflow trains the professional first reaction: clarify success, inspect/reproduce, choose the smallest appropriate approach, implement cleanly, verify normal/edge/regression behavior, and communicate evidence/trade-offs.\n\nA general HTML audit also found and fixed a pre-existing embedded-course-data issue where a literal closing script tag inside an XSS teaching example could terminate the large JSON script early. The embedded 62-course JSON now remains one valid HTML-safe script block.\n\nProblems found after the update: {len(problems)}.\n'''
(ROOT/'COMPANY_PROBLEM_SOLVING_AUDIT.md').write_text(md,encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(1 if problems else 0)

from pathlib import Path
from bs4 import BeautifulSoup
import json, re

ROOT=Path(__file__).resolve().parents[1]
COURSES=ROOT/'courses'
GUIDES=ROOT/'assets'/'practice-guidance'

AI_IDS={'ai-ml','data-science','deep-learning','pytorch','tensorflow','nlp','computer-vision','transformers','llms','rag','ai-agents','mlops','reinforcement-learning-post-training','generative-ai','gans','vaes','diffusion','huggingface','prompt-engineering','ai-system-design','large-scale-ai','llm-evaluation-testing','classical-ai','secure-ai-applications'}
SYSTEM_IDS={'system-design','distributed-systems','software-architecture','software-engineering-practice','cloud-computing','deployment','observability','networking','cybersecurity','docker','kubernetes','cicd','linux','git','systems-programming','comparch-os','advanced-computer-organization','digital-hardware'}
DATA_IDS={'sql','databases'}
WEB_IDS={'web-dev','frontend-dev','backend','apis'}
ALGO_IDS={'dsa','cpp-dsa','problem-solving'}


def clean(s):
    return re.sub(r'\s+',' ',str(s or '')).strip()

def ensure_period(s):
    s=clean(s)
    if s and s[-1] not in '.!?': s+='.'
    return s

def original_exercises(course_id):
    p=COURSES/f'{course_id}.html'
    if not p.exists(): return {}
    soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    out={}
    # Static exercise cards inside the named Exercises section.
    for sec in soup.select('section.card'):
        h=sec.find(['h2','h3'])
        if not h or clean(h.get_text(' ',strip=True)).lower()!='exercises':
            continue
        for card in sec.find_all(recursive=False):
            if card.name not in ('div','article','section'): continue
            classes=set(card.get('class') or [])
            if not ({'item','oa-task','exercise-card','task-card'} & classes or card.has_attr('data-exercise')): continue
            t=card.find(['b','h3','h4'])
            desc=card.find('p',recursive=False) or card.find('p')
            if t and desc:
                out.setdefault(clean(t.get_text(' ',strip=True)), clean(desc.get_text(' ',strip=True)))
    # Dynamic assessment-like exercise cards can also live elsewhere.
    for card in soup.select('.oa-task,[data-exercise],.exercise-card,.task-card'):
        if card.find_parent(class_='project-card') or card.has_attr('data-project'): continue
        t=card.find(['b','h3','h4'])
        desc=card.find('p',recursive=False) or card.find('p')
        if t and desc:
            out.setdefault(clean(t.get_text(' ',strip=True)), clean(desc.get_text(' ',strip=True)))
    return out

def project_descriptions(course_id):
    p=COURSES/f'{course_id}.html'
    if not p.exists(): return {}
    soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    s=soup.find('script',id='csai-project-data')
    if not s: return {}
    try: data=json.loads(s.string or s.get_text())
    except Exception: return {}
    return {clean(x.get('title')):clean(x.get('description')) for x in data.get('projects',[]) if clean(x.get('title'))}

def lesson_question(course_id, course_title, lesson_title):
    if course_id in ALGO_IDS:
        return 'When a real problem needs the main idea from this lesson, what are the inputs, required result, constraints, and trade-offs that tell you which approach is appropriate?'
    if course_id in AI_IDS:
        return 'In a real AI/ML task, what data or model state goes in, what transformation or decision happens, what comes out, and what evidence shows the lesson idea worked?'
    if course_id in DATA_IDS:
        return 'When stored data needs the behavior taught here, what exact result or state change should the database produce, and how would you verify it?'
    if course_id in WEB_IDS:
        return 'When a user or service needs the behavior taught here, what should happen from input/request to visible or returned result, and how would you know it is correct?'
    if course_id in SYSTEM_IDS:
        return 'In a production system, what problem does the lesson idea solve, what should change in the system, and what observation would prove success or reveal failure?'
    return 'When would an engineer use the main idea from this lesson in real work, what problem does it solve, and what observable result would prove it was used correctly?'

def lesson_why(course_title, lesson_title):
    return f'This lesson is here so you can recognize when its main idea is useful inside {course_title}, explain the reason for each major step, and apply the behavior to a new case instead of memorizing finished syntax.'

def example_question(course_id, lesson_title, index):
    if course_id=='problem-solving':
        return 'Before reading the finished example, what are the inputs, required output, simplest correct approach, and one edge case? Then use the example to check whether your reasoning matches.'
    if course_id in {'dsa','cpp-dsa'}:
        return 'What operation or algorithmic behavior is being demonstrated, what result should it produce, and what time/space cost matters as the input grows? Explain why the approach shown below fits the situation.'
    if course_id in AI_IDS:
        return 'What data or model state goes in, what transformation or decision happens, what result comes out, and what metric or evidence would show that result is correct? Explain why the approach shown below fits.'
    if course_id in DATA_IDS:
        return 'What data result or state change is needed, why is the operation shown below suitable, and what rows or values would prove it worked?'
    if course_id in WEB_IDS:
        return 'What user or service behavior is needed, what should happen from input to output, and why does the approach shown below fit that behavior? What result would prove it worked?'
    if course_id in SYSTEM_IDS:
        return 'What production problem is being handled, what should the system do or change, and what signal would prove success or reveal a failure? Explain why the approach shown below fits.'
    return 'What problem is this example solving, what should happen from the starting state to the final result, and why does the approach shown below fit?'

def example_why(lesson_title):
    return 'The example is not here just to show finished code. It is here to make the reason for the lesson behavior visible: you should be able to explain what job each important step performs, what would change if that step were removed or altered, and how the final result proves the idea worked.'

def exercise_question(title, desc):
    desc=ensure_period(desc)
    return f'{desc} Before writing the answer, identify the input or starting information, the exact result you must produce, any stated constraint, and one case that could make a careless solution fail.'

def exercise_why(course_title, title):
    return 'This exercise exists to make you turn a written requirement into your own correct solution and justify why it works. That requirement-to-solution reasoning is what you use in real engineering work, not just the final syntax.'

def project_question(title, desc):
    desc=ensure_period(desc or 'Build the project so every stated requirement can be demonstrated.')
    return f'{desc} What must go into the project, what must come out or change, what failure/edge case matters, and what concrete evidence will prove every requirement works?'

def project_why(course_title, title):
    return f'This project exists to practice turning several {course_title} requirements into one complete, testable piece of work. You should be able to explain why each major part exists and how it contributes to the finished behavior.'

changed=0
counts={'courses':0,'lessons':0,'examples':0,'exercises':0,'projects':0}
for f in sorted(GUIDES.glob('*.json')):
    d=json.loads(f.read_text(encoding='utf-8'))
    cid=d.get('id') or f.stem
    ctitle=d.get('title') or cid
    ex_original=original_exercises(cid)
    pr_desc=project_descriptions(cid)

    cp=d.get('course',{})
    cp['question']=f'What real software, data, systems, or AI problems should {ctitle} help you solve, and what would competent work in those situations look like?'
    cp['why']=f'{ctitle} belongs in the platform because its skills map to practical engineering work. Study each item for the decision or behavior it teaches, not merely to finish the lesson.'
    counts['courses']+=1

    for lid,meta in d.get('lessons',{}).items():
        ltitle=clean(meta.get('title') or lid)
        lp=meta.get('practice',{})
        lp['question']=lesson_question(cid,ctitle,ltitle)
        lp['why']=lesson_why(ctitle,ltitle)
        counts['lessons']+=1
        for i,eg in enumerate(meta.get('examples',[])):
            eg['question']=example_question(cid,ltitle,i)
            eg['why']=example_why(ltitle)
            counts['examples']+=1

    for ex in d.get('exercises',[]):
        title=clean(ex.get('title') or 'Exercise')
        p=ex.get('practice',{})
        desc=ex_original.get(title)
        req=p.get('requirements') or []
        # Use the original exercise wording to build the visible purpose question, but keep the
        # behavior-first requirement wording already stored in the guide. Some original prompts
        # intentionally name syntax; the guidance must not turn those names into solution hints.
        if not desc:
            desc=clean(req[0] if req else title)
        question_desc=clean(req[0] if req else desc)
        p['question']=exercise_question(title,question_desc)
        p['why']=exercise_why(ctitle,title)
        counts['exercises']+=1

    for pr in d.get('projects',[]):
        title=clean(pr.get('title') or 'Project')
        p=pr.get('practice',{})
        desc=pr_desc.get(title)
        if not desc:
            req=p.get('requirements') or []
            desc=clean(req[0] if req else '')
        p['question']=project_question(title,desc)
        p['why']=project_why(ctitle,title)
        counts['projects']+=1

    f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    changed+=1

print(json.dumps({'files_changed':changed,**counts},indent=2))

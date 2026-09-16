from pathlib import Path
import json, re
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
MASTER=ROOT/'assets'/'coursedata-source.json'
MIRROR=ROOT/'assets'/'course-data'/'software-engineering-practice.json'
PAGE=ROOT/'courses'/'software-engineering-practice.html'

courses=json.loads(MASTER.read_text(encoding='utf-8'))
course=next(c for c in courses if c.get('id')=='software-engineering-practice')
lesson=next(l for l in course.get('lessons',[]) if l.get('id')=='sep-04')

lesson['title']='Design docs, ADRs & practical UML'
lesson['estimatedMinutes']=24
lesson['objectives']=[
    'Write a concise design decision with context, alternatives, and consequences.',
    'Choose the lightest diagram that answers the team’s actual design question.',
    'Use class, sequence, component, activity, and state diagrams to communicate structure, interactions, workflows, and lifecycle behavior.'
]
lesson['explanation']=(
    'A design document explains the problem, constraints, proposed approach, interfaces, data flow, risks, alternatives, rollout, and testing plan before implementation becomes expensive to change. '
    'An Architecture Decision Record (ADR) captures one important decision and why it was made. Practical UML is another communication tool: it gives engineers a shared visual language when prose alone is not enough. '
    'Do not draw every UML diagram for every feature. Start from the question the team is trying to answer. Use a class diagram when the important issue is stable domain structure or relationships; a sequence diagram when the team needs to understand who talks to whom and in what order; a component diagram when the main concern is system boundaries and dependencies; an activity diagram when a workflow branches through decisions; and a state diagram when one entity moves through named lifecycle states. '
    'The goal is not perfect notation. The goal is a small, current diagram that helps another engineer review the design, find a missing case, or implement the feature correctly.'
)
lesson['explain']=lesson['explanation']
lesson['concepts']=['design document','ADR','trade-off','decision record','UML','class diagram','sequence diagram','component diagram','activity diagram','state diagram']
lesson['examples']=[
'''# Company ticket: the checkout flow is hard for frontend and backend engineers to reason about.\n# First capture the decision, then choose diagrams that answer specific questions.\n\nadr = {\n    "decision": "use idempotency keys",\n    "why": "retries must not duplicate orders",\n    "alternative": "deduplicate after insert",\n    "consequence": "store keys with an expiry"\n}\n\nsequence_diagram = """\nCustomer -> Web: Place order\nWeb -> Checkout API: POST /orders\nCheckout API -> Payment: Authorize payment\nPayment --> Checkout API: Approved\nCheckout API -> Database: Save order\nCheckout API --> Web: 201 Created\n"""\n\nstate_diagram = """\nPending -> Paid -> Shipped -> Delivered\nPaid -> Refunded\n"""\n\nprint(adr["decision"], "because", adr["why"])\nprint(sequence_diagram)\nprint(state_diagram)'''
]
lesson['example']=lesson['examples'][0]
lesson['commonMistakes']=(
    'Treating UML as paperwork or trying to draw every possible detail makes diagrams noisy and stale. Choose the diagram from the engineering question, keep only information the audience needs, and update or delete diagrams when the design changes. A sequence diagram is for interactions over time; a class diagram is not a substitute for that, and a state diagram should describe valid state transitions rather than general request flow.'
)
lesson['careerRelevance']=(
    'Engineers use lightweight design docs, ADRs, sequence/component/state diagrams, and similar architecture sketches during feature design, code review, incident analysis, onboarding, and cross-team communication. The valuable skill is choosing the right artifact for the question and keeping it tied to the real system.'
)

ex=next(e for e in course.get('exercises',[]) if e.get('id')=='sep-ex-4')
ex['title']='Apply: choose the right UML diagram for a company ticket'
ex['prompt']=(
    'A checkout team says engineers keep misunderstanding how an order moves from the browser through the API, payment service, and database, and they also disagree about which order-status transitions are valid. '
    'State what question each audience needs answered, choose the appropriate diagram type for each question, sketch the diagrams in plain text, and explain why those diagram types fit better than the alternatives. Include one failure or edge path, such as payment rejection or refund.'
)
ex['hint']='Interaction over time suggests one diagram type; lifecycle transitions suggest another. Start from the question, not from the notation.'

q=next(q for q in course.get('quiz',[]) if q.get('id')=='sep-q-4')
q.update({
    'q':'A team needs to show the order in which the browser, checkout API, payment service, and database communicate during checkout. Which artifact best answers that question?',
    'options':['A sequence diagram','A class diagram','A state diagram','A changelog'],
    'correct':0,
    'type':'mcq'
})

p1=next(p for p in course.get('projects',[]) if p.get('id')=='sep-p1')
reqs=list(p1.get('requirements',[]))
reqs=[r for r in reqs if 'uml' not in r.lower()]
reqs.insert(2,'One lightweight UML/engineering diagram chosen for a real communication need (sequence, component, class, activity, or state)')
p1['requirements']=reqs

cap=course.get('capstone') or {}
if cap:
    reqs=list(cap.get('requirements',[]))
    if not any('diagram' in str(r).lower() for r in reqs):
        reqs.insert(1,'At least one lightweight design diagram that answers a real implementation/review question')
    cap['requirements']=reqs

course['careerApplications']='Directly used in production teams for requirements, design communication (including lightweight UML where useful), code review, maintainability, testing, debugging, collaboration, incident follow-up, and shipping changes safely.'

MASTER.write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
MIRROR.write_text(json.dumps(course,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Patch the static course page so the content is visible even before runtime enhancement layers execute.
html=PAGE.read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
detail=soup.find('details',attrs={'data-lesson':'sep-04'})
if detail is None:
    raise SystemExit('sep-04 lesson not found in static HTML')
summary=detail.find('summary')
title_span=summary.find(class_='title')
title_span.string=lesson['title']
body=detail.find(class_='body')

# Learning objectives.
h3s=body.find_all('h3',recursive=False)
learn_h3=next(h for h in h3s if h.get_text(' ',strip=True)=='What you will learn')
learn_ul=learn_h3.find_next_sibling('ul')
learn_ul.clear()
for objective in lesson['objectives']:
    li=soup.new_tag('li'); li.string=objective; learn_ul.append(li)

# Rich main explanation block.
main=body.find('section',attrs={'data-main-explanation':True})
main.clear()
sections=[
('Explanation',[
 'A design document records the problem, constraints, proposed approach, interfaces, data flow, risks, alternatives, rollout, and testing plan before implementation becomes expensive to change. An ADR records one important decision and why it was made.',
 'Practical UML is a communication tool, not a goal by itself. Start from the question the team cannot answer clearly, then choose the smallest diagram that makes that question easier to review.'
]),
('Choose the diagram from the question',[ 
 'Class diagram — use it when the important question is what the main domain types/classes are and how they relate.',
 'Sequence diagram — use it when the important question is who communicates with whom, in what order, during one request or scenario.',
 'Component diagram — use it when the important question is which major services/modules exist, what each owns, and what depends on what.',
 'Activity diagram — use it when the important question is how a workflow branches through decisions and alternate paths.',
 'State diagram — use it when the important question is which named states an entity can be in and which transitions are valid.'
]),
('How to think about it step by step',[ 
 '1. Restate the company question in one sentence before drawing anything.',
 '2. Identify the audience: implementers, reviewers, product, operations, or another team.',
 '3. Choose the diagram type that answers that question with the least extra detail.',
 '4. Draw only the important actors, boundaries, relationships, decisions, or states.',
 '5. Add at least one failure/alternate path when it changes the design.',
 '6. Compare the diagram with the current code/design and keep it updated only while it remains useful.'
]),
('Worked company scenario',[ 
 'Ticket: frontend and backend engineers disagree about checkout behavior. For request ordering, draw a sequence diagram from Customer → Web → Checkout API → Payment → Database and include the payment-rejected path. For valid order lifecycle changes, draw a state diagram such as Pending → Paid → Shipped → Delivered, with Paid → Refunded where the business rules allow it.'
]),
('Why this matters',[ 
 'In real teams, design mistakes often come from people holding different mental models of the same system. A small diagram can expose a missing boundary, invalid state transition, circular dependency, or unhandled failure before code is written.'
]),
('Common pitfalls',[ 
 'Do not create diagrams just to satisfy documentation. Do not mix multiple abstraction levels into one unreadable picture. Do not use a class diagram to explain request timing, or a sequence diagram to document all long-lived domain relationships. Delete or update diagrams that no longer match the system.'
]),
('Interview / practical takeaway',[ 
 'Be able to say: “First I identify what the team needs to understand, then I choose the lightest artifact that answers it.” You should be able to justify why a sequence, class, component, activity, or state diagram fits a specific engineering problem.'
]),
('Check yourself',[ 
 'Can you look at a company problem and choose the right diagram without being told the diagram name?',
 'Can you explain what information should be intentionally left out so the diagram stays useful?',
 'Can you add one failure or alternate path and explain how it changes the design?' 
])]
for heading, paragraphs in sections:
    h=soup.new_tag('h3'); h.string=heading; main.append(h)
    if heading in {'Choose the diagram from the question','How to think about it step by step','Common pitfalls','Check yourself'}:
        tag='ol' if heading=='How to think about it step by step' else 'ul'
        lst=soup.new_tag(tag)
        if heading=='How to think about it step by step': lst['class']='deep-steps'
        if heading=='Check yourself': lst['class']='deep-check'
        for p in paragraphs:
            text=re.sub(r'^\d+\.\s*','',p)
            li=soup.new_tag('li'); li.string=text; lst.append(li)
        main.append(lst)
    elif heading=='Worked company scenario':
        div=soup.new_tag('div'); div['class']='deep-scenario'; p=soup.new_tag('p'); p.string=paragraphs[0]; div.append(p); main.append(div)
    elif heading=='Interview / practical takeaway':
        div=soup.new_tag('div'); div['class']='deep-takeaway'; p=soup.new_tag('p'); p.string=paragraphs[0]; div.append(p); main.append(div)
    else:
        for text in paragraphs:
            p=soup.new_tag('p'); p.string=text; main.append(p)

# Replace concepts and source example in the body.
all_h3=body.find_all('h3',recursive=False)
key_h3=next(h for h in all_h3 if h.get_text(' ',strip=True)=='Key concepts')
meta=key_h3.find_next_sibling('div',class_='meta'); meta.clear()
for concept in lesson['concepts']:
    span=soup.new_tag('span'); span['class']='pill'; span.string=concept; meta.append(span)
example_h3=next(h for h in body.find_all('h3',recursive=False) if h.get_text(' ',strip=True)=='Example')
# Remove existing direct source examples until the note.
node=example_h3.find_next_sibling()
while node is not None and not (getattr(node,'name',None)=='div' and 'note' in (node.get('class') or [])):
    nxt=node.find_next_sibling(); node.extract(); node=nxt
pre=soup.new_tag('pre'); pre['class']='code'; pre['data-example-audit']='candidate'; pre.string=lesson['examples'][0]; example_h3.insert_after(pre)
note=body.find('div',class_='note')
note.clear(); b=soup.new_tag('b'); b.string='Common mistake:'; note.append(b); note.append(' '+lesson['commonMistakes'])

PAGE.write_text(str(soup),encoding='utf-8')
print('Added practical UML coverage to software-engineering-practice/sep-04')

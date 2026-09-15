from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]
GUIDES=ROOT/'assets'/'practice-guidance'

ALGO={'dsa','cpp-dsa','problem-solving'}
PYTHON={'python','oop'}
DATA={'sql','databases'}
DATA_ENG={'data-engineering'}
WEB={'web-dev','frontend-dev'}
BACKEND={'backend','apis'}
QUALITY={'testing','debugging'}
DELIVERY={'git','cicd'}
OPS={'linux','docker','kubernetes','cloud-computing','deployment','observability','networking'}
ARCH={'system-design','distributed-systems','software-architecture','software-engineering-practice'}
SECURITY={'cybersecurity','secure-ai-applications'}
LOWLEVEL={'systems-programming','comparch-os','advanced-computer-organization','digital-hardware','embedded-systems'}
AI={'ai-ml','data-science','deep-learning','pytorch','tensorflow','nlp','computer-vision','transformers','llms','rag','ai-agents','mlops','reinforcement-learning-post-training','generative-ai','gans','vaes','diffusion','huggingface','prompt-engineering','ai-system-design','large-scale-ai','llm-evaluation-testing','classical-ai'}
CAREER={'company-prep','interview-prep','resume-prep','influencing-without-authority'}


def clean(v):
    return re.sub(r'\s+',' ',str(v or '')).strip()

def category(cid):
    if cid=='problem-solving': return 'problem-solving'
    if cid in ALGO: return 'algorithms'
    if cid in PYTHON: return 'python'
    if cid in DATA: return 'data'
    if cid in DATA_ENG: return 'data-engineering'
    if cid in WEB: return 'frontend'
    if cid in BACKEND: return 'backend'
    if cid in QUALITY: return 'quality'
    if cid in DELIVERY: return 'delivery'
    if cid in OPS: return 'operations'
    if cid in ARCH: return 'architecture'
    if cid in SECURITY: return 'security'
    if cid in LOWLEVEL: return 'low-level'
    if cid in AI: return 'ai'
    if cid in CAREER: return 'career'
    if cid=='capstone': return 'capstone'
    return 'general'

def situation(cid, title, kind='lesson'):
    c=category(cid); title=clean(title) or 'this task'
    if c=='problem-solving': return f'A teammate gives you a ticket related to “{title}”. The request describes a desired outcome, but it does not tell you the implementation. You are expected to turn the request into a precise, testable solution plan before coding.'
    if c=='algorithms': return f'A feature works on small inputs, but the team needs you to reason about correctness and performance for “{title}” before the amount of data grows.'
    if c=='python': return f'A teammate asks you to implement or repair Python behavior related to “{title}” while keeping the surrounding program understandable and correct.'
    if c=='data': return f'Product or operations needs a database result or state change related to “{title}”, and you must make sure the data result is correct before it is used by the application or report.'
    if c=='data-engineering': return f'A data pipeline has a requirement or reliability issue related to “{title}”. Downstream users depend on the produced data being complete, timely, and trustworthy.'
    if c=='frontend': return f'A user or product teammate reports a user-interface requirement related to “{title}”. You need to make the visible behavior correct without breaking the existing flow.'
    if c=='backend': return f'A client or another service needs backend/API behavior related to “{title}”. You must make the request-to-result behavior correct and handle failure cases safely.'
    if c=='quality': return f'A bug report, failing test, or unexpected behavior points to “{title}”. Your job is to reproduce the problem, locate the cause, and prove the fix.'
    if c=='delivery': return f'Your team needs to integrate or release a change involving “{title}” without losing work, breaking the shared branch, or shipping an unverified change.'
    if c=='operations': return f'A production or environment issue involves “{title}”. You need to inspect the system, make a safe change, and use observable evidence to confirm recovery.'
    if c=='architecture': return f'A new feature, scale problem, or reliability concern requires a design decision involving “{title}”. The team expects you to explain the trade-offs, not just name a technology.'
    if c=='security': return f'A security review or incident exposes a risk related to “{title}”. You need to reduce the risk while preserving legitimate system behavior and prove the control works.'
    if c=='low-level': return f'A device or low-level program has a correctness, resource, timing, or hardware interaction requirement related to “{title}”. You need to reason about what the system actually does.'
    if c=='ai': return f'An AI/ML feature or data/model pipeline has a requirement or quality problem related to “{title}”. The team needs a measurable result, not just code that runs.'
    if c=='career': return f'You are in a real engineering hiring or team situation involving “{title}”. You need to communicate your reasoning clearly and make the next professional action deliberate.'
    if c=='capstone': return f'Your lead gives you an end-to-end delivery task involving “{title}”. You are responsible for turning the requirements into a working, testable result and explaining the decisions.'
    return f'A teammate asks you to solve a real work task involving “{title}”. The expected outcome matters more than copying a particular syntax pattern.'

def task(cid, title, kind):
    title=clean(title) or kind
    if kind=='course':
        return f'When a future work ticket matches {title}, recognize what information you need, choose an appropriate approach, verify the result, and explain the trade-off or evidence.'
    if kind=='lesson':
        return f'Before looking for a finished answer, decide how you would diagnose or approach a ticket involving {title}, what evidence you would inspect, and what “done” should mean.'
    if kind=='example':
        return f'Treat this as a small work ticket for {title}. Before reading the finished example, decide what the problem is asking, what approach you would try first, and how you would prove the result is correct.'
    if kind=='exercise':
        return f'Treat “{title}” like a ticket assigned to you. Produce your own solution, then show the evidence that it meets the requested behavior and does not fail on the important edge case.'
    return f'Treat “{title}” like a small feature or engineering assignment. Deliver a complete result whose requirements can be demonstrated, tested, and explained in a code review.'

def process(cid):
    c=category(cid)
    inspect={
      'ai':'Inspect representative data, current outputs, evaluation results, or model/pipeline state before changing the implementation.',
      'data':'Inspect the current schema/data and reproduce the needed result with a small representative data set before changing the query or database behavior.',
      'data-engineering':'Inspect the source data, pipeline stage, freshness/quality signals, and downstream expectation before changing the pipeline.',
      'frontend':'Reproduce the user flow and identify the exact visible state, input, browser/event state, or request that triggers the problem.',
      'backend':'Reproduce the request with representative input and inspect the response, validation, logs, and state changes before changing the service.',
      'quality':'Reproduce the failure first and collect the smallest piece of evidence that distinguishes the symptom from the root cause.',
      'delivery':'Inspect the current branch/build/release state and understand what other work could be affected before making the change.',
      'operations':'Inspect logs, metrics, health/status, configuration, and the current system state before changing production behavior.',
      'architecture':'Clarify traffic/data/latency/reliability constraints and identify the current bottleneck or design limitation before proposing a component.',
      'security':'Identify the asset, threat/failure path, trust boundary, and legitimate behavior that must keep working before choosing a control.',
      'low-level':'Trace the relevant state, memory/resource behavior, timing, or hardware interaction before changing low-level code.',
      'algorithms':'Write down the input size, required output, constraints, and a simple correct baseline before optimizing.',
      'problem-solving':'Rewrite the ticket as inputs, outputs, constraints, examples, and acceptance criteria before choosing code.',
      'python':'Run or trace a small representative case and identify what state/input/output the Python code must change.',
      'career':'Clarify the goal, audience, constraints, and evidence you need to communicate before choosing your response.',
      'capstone':'Break the end-to-end requirement into testable outcomes and identify dependencies before implementation.',
      'general':'Inspect a small representative case and identify the current behavior before changing anything.'
    }.get(c,'Inspect a small representative case and identify the current behavior before changing anything.')
    verify={
      'ai':'Verify with an appropriate metric or observable output on representative/held-out cases, and check at least one failure or edge case.',
      'data':'Verify the exact rows/values/state change, plus a relevant null/duplicate/empty/boundary case.',
      'data-engineering':'Verify data quality/freshness/schema expectations and that downstream behavior still works.',
      'frontend':'Verify the normal user flow, an error/empty/loading/edge state when relevant, and that nearby UI behavior did not regress.',
      'backend':'Verify the normal request, an invalid/failure case, the response/state change, and any important regression behavior.',
      'quality':'Add or run a test that would have failed before the fix and now passes, then run relevant regression tests.',
      'delivery':'Verify CI/build/tests and the resulting branch/release state before declaring the change safe.',
      'operations':'Verify health, logs, metrics, and the user/service behavior after the change; have a rollback or recovery path when relevant.',
      'architecture':'Check the proposal against the stated constraints, failure modes, scale assumptions, and an alternative design.',
      'security':'Verify the unwanted path is blocked or reduced while legitimate behavior still succeeds.',
      'low-level':'Verify the observable output/state and the relevant resource, timing, memory, or hardware constraint.',
      'algorithms':'Verify correctness on normal and edge inputs, then check that the time/space cost is acceptable for the expected scale.',
      'problem-solving':'Test a normal example and a boundary/failure example against the acceptance criteria you wrote before coding.',
      'python':'Run the normal case and a relevant edge/failure case, then make sure surrounding behavior still works.',
      'career':'Check that your response is clear, accurate, evidence-based, and appropriate for the audience.',
      'capstone':'Demonstrate each acceptance criterion, an edge/failure case, and the end-to-end result.',
      'general':'Verify the expected result on a normal case and at least one relevant edge/failure case.'
    }.get(c,'Verify the expected result on a normal case and at least one relevant edge/failure case.')
    return [
      'Restate the request in plain English and define what success means before touching the implementation.',
      inspect,
      'Choose the smallest clear approach that satisfies the requirement. Use the lesson concept because it fits the problem, not because it was the last thing you studied.',
      'Make the change in a way another engineer could read, review, and maintain; avoid unrelated changes.',
      verify,
      'Explain what changed, why you chose it, what you tested, and any trade-off, limitation, or follow-up the team should know.'
    ]

def acceptance(cid):
    c=category(cid)
    if c=='ai': return ['The required model/data/AI behavior is observable on a representative case.','An appropriate metric, comparison, or evidence supports the result.','At least one important failure/edge case is checked, and the change does not silently break an existing requirement.']
    if c in {'data','data-engineering'}: return ['The required rows, values, state change, or produced data are exactly what the ticket asks for.','A relevant empty/null/duplicate/schema/failure case is handled when it can occur.','Existing data integrity or downstream behavior is preserved.']
    if c in {'frontend','backend'}: return ['The requested user/service behavior works from input/request to visible or returned result.','A relevant invalid/error/empty/loading/failure case is handled clearly.','A nearby existing behavior is checked so the change does not create an obvious regression.']
    if c=='quality': return ['The original failure can be reproduced or clearly characterized.','The root cause is addressed rather than only hiding the symptom.','A test or repeatable check proves the fix and protects against regression.']
    if c in {'operations','delivery'}: return ['The intended system/build/release state is reached and observable.','Relevant health, logs, tests, or status checks confirm success.','Failure/recovery or rollback behavior is considered when the change could affect shared or production systems.']
    if c=='architecture': return ['The design satisfies the stated functional and non-functional constraints.','Major trade-offs and failure modes are explained.','The choice is compared with at least one reasonable alternative or simpler baseline.']
    if c=='security': return ['The identified risk path is reduced or blocked.','Legitimate user and system behavior still works after the security control is applied.','A repeatable check demonstrates the security control rather than assuming it works.']
    if c=='algorithms': return ['The algorithm produces the correct result for normal and edge inputs.','Its time/space behavior is appropriate for the expected input size.','You can explain why this approach is preferable to a simpler or alternative approach in this situation.']
    if c=='problem-solving': return ['The ticket is translated into explicit inputs, outputs, constraints, and acceptance criteria.','Your solution satisfies a normal case and a relevant boundary/failure case.','You can explain how you moved from the written problem to the chosen approach without relying on copied code.']
    if c=='low-level': return ['The required observable state/output is correct.','Relevant resource, timing, memory, or hardware constraints are respected.','A repeatable test or trace shows why the behavior is correct.']
    if c=='career': return ['The response/action matches the actual goal and audience.','Claims are accurate and supported by evidence when evidence is available.','The next action is clear, appropriate for the audience, and professional.']
    return ['The requested behavior or result is correct on a normal case.','A relevant edge, invalid, boundary, or failure case is checked when that type of case can occur.','You can show repeatable evidence and explain why the chosen approach fits the requirement.']

counts={'courses':0,'lessons':0,'examples':0,'exercises':0,'projects':0}
for f in sorted(GUIDES.glob('*.json')):
    d=json.loads(f.read_text(encoding='utf-8'))
    cid=d.get('id') or f.stem
    ctitle=clean(d.get('title') or cid)
    cp=d.setdefault('course',{})
    cp['workScenario']=situation(cid,ctitle,'course')
    cp['workTask']=task(cid,ctitle,'course')
    cp['engineerProcess']=process(cid)
    cp['acceptanceCriteria']=acceptance(cid)
    counts['courses']+=1

    for lid,meta in d.get('lessons',{}).items():
        ltitle=clean(meta.get('title') or lid)
        p=meta.setdefault('practice',{})
        p['workScenario']=situation(cid,ltitle,'lesson')
        p['workTask']=task(cid,ltitle,'lesson')
        p['engineerProcess']=process(cid)
        p['acceptanceCriteria']=acceptance(cid)
        counts['lessons']+=1
        for i,e in enumerate(meta.get('examples',[])):
            etitle=clean(e.get('title') or f'{ltitle} example {i+1}')
            e['workScenario']=situation(cid,etitle,'example')
            e['workTask']=task(cid,etitle,'example')
            e['engineerProcess']=process(cid)
            e['acceptanceCriteria']=acceptance(cid)
            counts['examples']+=1

    for e in d.get('exercises',[]):
        etitle=clean(e.get('title') or 'Exercise')
        p=e.setdefault('practice',{})
        p['workScenario']=situation(cid,etitle,'exercise')
        p['workTask']=task(cid,etitle,'exercise')
        p['engineerProcess']=process(cid)
        p['acceptanceCriteria']=acceptance(cid)
        counts['exercises']+=1

    for pr in d.get('projects',[]):
        ptitle=clean(pr.get('title') or 'Project')
        p=pr.setdefault('practice',{})
        p['workScenario']=situation(cid,ptitle,'project')
        p['workTask']=task(cid,ptitle,'project')
        p['engineerProcess']=process(cid)
        p['acceptanceCriteria']=acceptance(cid)
        counts['projects']+=1

    f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

print(json.dumps(counts,indent=2))

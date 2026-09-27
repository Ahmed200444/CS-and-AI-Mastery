(function(){
'use strict';
if(window.CSAILessonTutor)return;
window.CSAILessonTutor={version:'1.0.0'};
var active=null,state={mode:'teach',voice:false,busy:false},PREFIX='csai:tutor:v1:';

function q(s,r){return(r||document).querySelector(s);}
function qa(s,r){return Array.from((r||document).querySelectorAll(s));}
function txt(n){return String(n&&n.textContent||'').replace(/\s+/g,' ').trim();}
function cut(v,n){v=String(v||'');return v.length>n?v.slice(0,n):v;}
function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function courseId(){return(location.pathname.split('/').pop()||'home').replace(/\.html$/,'');}
function title(l){return txt(q('summary .title',l)||q('summary',l))||'Current lesson';}
function lid(l){return String((l&&(l.dataset.lesson||l.id))||'lesson').replace(/^lesson-/,'');}
function current(){
 var open=q('.lesson[open]');if(open)return open;
 var list=qa('.lesson');if(!list.length)return null;
 var best=list[0],score=1e9;list.forEach(function(x){var r=x.getBoundingClientRect(),s=Math.abs(r.top-innerHeight*.28);if(r.bottom>0&&r.top<innerHeight&&s<score){best=x;score=s;}});
 return best;
}
function key(l){return PREFIX+courseId()+':'+lid(l);}
function load(l){try{var x=JSON.parse(localStorage.getItem(key(l))||'[]');return Array.isArray(x)?x.slice(-8):[];}catch(e){return[];}}
function save(l,x){try{localStorage.setItem(key(l),JSON.stringify(x.slice(-8)));}catch(e){}}
function code(l){
 var f=document.activeElement;if(f&&l.contains(f)&&f.tagName==='TEXTAREA'&&f.value)return cut(f.value,2200);
 var e=qa('textarea',l).find(function(x){return x.offsetParent!==null&&String(x.value||'').trim();});if(e)return cut(e.value,2200);
 var p=qa('pre.code,pre code,pre',l).find(function(x){return x.offsetParent!==null&&txt(x);});return cut(p&&p.textContent,2200);
}
function context(l){
 var pills=[];qa('.pill',l).forEach(function(x){var v=txt(x);if(v&&pills.indexOf(v)<0&&pills.length<10)pills.push(v);});
 var main=q('[data-main-explanation],.lesson-main-explanation',l)||q('.body',l)||l;
 var answers=[];qa('textarea,input[type=text],input[type=number],select',l).forEach(function(x){if(x.offsetParent!==null&&String(x.value||'').trim())answers.push(x.value);});
 var sel=window.getSelection?String(window.getSelection()||''):'';
 return{
  course:txt(q('.hero h1'))||txt(q('h1'))||document.title,
  courseId:courseId(),lesson:title(l),lessonId:lid(l),concepts:pills,
  explanation:cut(txt(main),2200),code:code(l),selectedText:cut(sel,900),studentAnswer:cut(answers.join('\n'),900)
 };
}
function setLesson(l){if(!l)return;active=l;var n=q('[data-tutor-lesson]');if(n)n.textContent=title(l);render();}
function render(){
 var log=q('[data-tutor-log]');if(!log||!active)return;var h=load(active);
 if(!h.length){log.innerHTML='<div class="ct-msg bot">I know the lesson you are on. Ask about the concept, visible code, or request a hint.</div>';return;}
 log.innerHTML=h.map(function(m){return'<div class="ct-msg '+(m.role==='user'?'user':'bot')+'">'+esc(m.text)+'</div>';}).join('');log.scrollTop=log.scrollHeight;
}
function add(role,text){var h=load(active);h.push({role:role,text:cut(text,3500)});save(active,h);render();}
function stat(s){var n=q('[data-tutor-status]');if(n)n.textContent=s;}
function speak(s){if(!state.voice||!window.speechSynthesis)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(cut(s,1800));speechSynthesis.speak(u);}catch(e){}}
function fallback(mode,c){
 var k=(c.concepts&&c.concepts[0])||c.lesson||'this concept';
 if(mode==='hint')return'Hint: focus on '+k+'. Trace the example one step at a time and identify what changes before choosing the final answer.';
 if(mode==='teach')return'Start with '+k+'. In one sentence, explain what you think it does in the current example.';
 return'The lesson-aware tutor is working in guided mode. Open-ended AI answers require a configured free-provider key.';
}
async function send(){
 if(state.busy)return;var l=current();if(!l)return;setLesson(l);
 var input=q('[data-tutor-input]'),btn=q('[data-tutor-send]'),m=String(input.value||'').trim();
 if(!m)m=state.mode==='hint'?'Give me one small hint without revealing the final answer.':'Teach me this concept with one short question first.';
 input.value='';add('user',m);state.busy=true;btn.disabled=true;stat('Thinking with current lesson context…');
 var c=context(l),hist=load(l).slice(-6).map(function(x){return{role:x.role,text:cut(x.text,1000)};});
 try{
  var r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:state.mode,message:cut(m,1600),context:c,history:hist})});
  var d={};try{d=await r.json();}catch(e){}
  if(!r.ok)throw new Error(d.error||'Tutor request failed.');
  var reply=String(d.text||'').trim()||fallback(state.mode,c);add('tutor',reply);stat(d.provider==='guided'?'Guided mode — add a free AI key for open-ended answers.':'Tutor: '+d.provider);speak(reply);
 }catch(e){var f=fallback(state.mode,c);add('tutor',f);stat('Guided mode — AI provider unavailable.');}
 state.busy=false;btn.disabled=false;
}
function mic(){
 var b=q('[data-tutor-mic]'),R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!b)return;
 if(!R){b.disabled=true;b.title='Speech recognition is not supported by this browser.';return;}
 b.onclick=function(){try{var r=new R();r.lang='en-US';r.interimResults=false;b.disabled=true;b.textContent='Listening…';r.onresult=function(e){var t=e.results&&e.results[0]&&e.results[0][0]&&e.results[0][0].transcript;if(t)q('[data-tutor-input]').value=t;};r.onend=function(){b.disabled=false;b.textContent='Talk';};r.onerror=function(){stat('Voice input unavailable. Type the question instead.');};r.start();}catch(e){b.disabled=false;b.textContent='Talk';}};
}
function mount(){
 if(!q('.lesson')||q('#csai-tutor'))return;
 var style=document.createElement('style');style.textContent='#ct-open{position:fixed;left:16px;bottom:18px;z-index:90;border:0;border-radius:999px;padding:11px 16px;background:#17649a;color:#fff;font-weight:800;cursor:pointer;box-shadow:0 8px 25px #0004}#csai-tutor{position:fixed;left:14px;bottom:68px;z-index:91;width:min(410px,calc(100vw - 28px));max-height:calc(100vh - 90px);display:none;background:var(--panel,#fff);color:var(--text,#172231);border:1px solid var(--border,#d8e1ea);border-radius:14px;box-shadow:0 18px 50px #0005;overflow:hidden}#csai-tutor.open{display:block}.ct-head,.ct-modes,.ct-compose{padding:10px 12px;border-bottom:1px solid var(--border,#d8e1ea)}.ct-head{display:flex;gap:8px;align-items:center}.ct-head b{flex:1}.ct-sub{font-size:12px;color:var(--muted,#5d6c7c);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ct-modes{display:flex;gap:6px}.ct-modes button,.ct-quick button,.ct-icon{border:1px solid var(--border,#d8e1ea);background:var(--bg,#f4f7fb);color:inherit;border-radius:8px;padding:7px 9px;font-weight:700;cursor:pointer}.ct-modes button.on{background:var(--accent,#17649a);color:#fff}.ct-log{padding:12px;min-height:180px;max-height:360px;overflow:auto;display:flex;flex-direction:column;gap:8px}.ct-msg{padding:9px 10px;border-radius:10px;max-width:92%;white-space:pre-wrap;font-size:14px}.ct-msg.user{align-self:flex-end;background:var(--accent,#17649a);color:#fff}.ct-msg.bot{align-self:flex-start;background:var(--bg,#f4f7fb);border:1px solid var(--border,#d8e1ea)}.ct-status{padding:0 12px 8px;color:var(--muted,#5d6c7c);font-size:11px}.ct-quick{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}.ct-row{display:flex;gap:6px}.ct-row textarea{flex:1;min-height:42px;max-height:100px;border:1px solid var(--border,#d8e1ea);border-radius:8px;background:var(--panel,#fff);color:inherit;padding:8px}.ct-send{border:0;border-radius:8px;background:var(--accent,#17649a);color:#fff;padding:0 13px;font-weight:800}.ct-close{border:0;background:transparent;color:inherit;font-size:22px;cursor:pointer}@media(max-width:600px){#csai-tutor{left:7px;width:calc(100vw - 14px);bottom:62px}#ct-open{left:10px;bottom:12px}}';document.head.appendChild(style);
 var open=document.createElement('button');open.id='ct-open';open.type='button';open.textContent='Tutor';
 var p=document.createElement('section');p.id='csai-tutor';p.innerHTML='<div class="ct-head"><div><b>AI Tutor</b><div class="ct-sub" data-tutor-lesson>Current lesson</div></div><span style="flex:1"></span><button class="ct-icon" data-tutor-voice>Voice</button><button class="ct-close" data-tutor-close>×</button></div><div class="ct-modes"><button data-mode="teach" class="on">Teach</button><button data-mode="hint">Hint</button><button data-mode="ask">Ask</button></div><div class="ct-log" data-tutor-log></div><div class="ct-status" data-tutor-status>Lesson-aware tutor.</div><div class="ct-compose"><div class="ct-quick"><button data-p="Explain this simply.">Explain simpler</button><button data-p="Explain the current code line by line.">Explain code</button><button data-p="Give me one small hint. Do not reveal the final answer.">Small hint</button><button data-tutor-mic>Talk</button></div><div class="ct-row"><textarea data-tutor-input placeholder="Ask about this lesson..."></textarea><button class="ct-send" data-tutor-send>Send</button></div></div>';
 document.body.append(open,p);
 open.onclick=function(){p.classList.toggle('open');if(p.classList.contains('open')){setLesson(current());q('[data-tutor-input]').focus();}};
 q('[data-tutor-close]').onclick=function(){p.classList.remove('open');};
 qa('[data-mode]',p).forEach(function(b){b.onclick=function(){state.mode=b.dataset.mode;qa('[data-mode]',p).forEach(function(x){x.classList.toggle('on',x===b);});};});
 qa('[data-p]',p).forEach(function(b){b.onclick=function(){q('[data-tutor-input]').value=b.dataset.p;send();};});
 q('[data-tutor-send]').onclick=send;q('[data-tutor-input]').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}};
 q('[data-tutor-voice]').onclick=function(){state.voice=!state.voice;this.textContent=state.voice?'Voice on':'Voice';if(!state.voice&&speechSynthesis)speechSynthesis.cancel();};
 mic();document.addEventListener('toggle',function(e){if(e.target&&e.target.matches('.lesson')&&e.target.open)setLesson(e.target);},true);setLesson(current());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
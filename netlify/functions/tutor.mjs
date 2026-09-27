const MAX=48000;
function env(n){try{return Netlify.env.get(n)||'';}catch(e){return'';}}
function clean(v,n){v=String(v==null?'':v).replace(/\u0000/g,'').trim();return v.length>n?v.slice(0,n):v;}
function out(status,body){return new Response(JSON.stringify(body),{status:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
function sameOrigin(req){var o=req.headers.get('origin');if(!o)return true;try{return new URL(req.url).origin===new URL(o).origin;}catch(e){return false;}}
function ctx(v){
 v=v||{};return{course:clean(v.course,160),courseId:clean(v.courseId,100),lesson:clean(v.lesson,220),lessonId:clean(v.lessonId,140),
 concepts:Array.isArray(v.concepts)?v.concepts.slice(0,10).map(function(x){return clean(x,120);}):[],
 explanation:clean(v.explanation,2200),code:clean(v.code,2200),selectedText:clean(v.selectedText,900),studentAnswer:clean(v.studentAnswer,900)};
}
function hist(v){if(!Array.isArray(v))return[];return v.slice(-6).map(function(x){return{role:x&&x.role==='user'?'user':'assistant',content:clean(x&&x.text,1000)};}).filter(function(x){return x.content;});}
function system(mode){return[
'You are the CS & AI Mastery lesson tutor. Stay grounded in the supplied lesson context.',
'Teach for understanding, not answer-copying.',
'Use concise beginner-readable language.',
'For code, explain only code that is actually supplied. Do not invent variables, outputs, APIs, or results.',
'Prefer the easiest correct reasoning path.',
'If the student is wrong, identify the misunderstanding and give a small next-step hint.',
'In hint mode, do not reveal the final answer unless the student explicitly asks for the solution.',
'In teach mode, explain briefly and ask one short check-for-understanding question when useful.',
'In ask mode, answer directly and use one tiny example only when it helps.',
'If context is insufficient, say what is missing instead of guessing.',
'Current mode: '+mode+'.'
].join('\n');}
function prompt(message,c){return'STUDENT MESSAGE:\n'+message+'\n\nCURRENT LESSON CONTEXT:\n'+JSON.stringify(c,null,2);}
async function openai(url,key,model,sys,history,user,extra){
 var headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'};Object.assign(headers,extra||{});
 var r=await fetch(url,{method:'POST',headers:headers,body:JSON.stringify({model:model,temperature:0.25,max_tokens:700,messages:[{role:'system',content:sys}].concat(history,[{role:'user',content:user}])})});
 var raw=await r.text(),d={};try{d=raw?JSON.parse(raw):{};}catch(e){}
 if(!r.ok)throw new Error('provider_'+r.status);
 var t=d&&d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content;if(!t)throw new Error('provider_empty');return clean(t,4500);
}
async function gemini(key,model,sys,history,user){
 var contents=history.map(function(m){return{role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]};});contents.push({role:'user',parts:[{text:user}]});
 var url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key);
 var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:contents,generationConfig:{temperature:0.25,maxOutputTokens:700}})});
 var raw=await r.text(),d={};try{d=raw?JSON.parse(raw):{};}catch(e){}
 if(!r.ok)throw new Error('provider_'+r.status);
 var p=d&&d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts;
 var t=Array.isArray(p)?p.map(function(x){return x.text||'';}).join('\n').trim():'';if(!t)throw new Error('provider_empty');return clean(t,4500);
}
function guided(mode,c){
 var k=(c.concepts&&c.concepts[0])||c.lesson||'this concept';
 if(mode==='hint')return'Hint: focus on '+k+'. Trace the current example one step at a time and identify what changes before deciding the final answer.';
 if(mode==='teach')return'Start with '+k+'. Explain in one sentence what you think it does in the current example. Then compare that idea with the lesson explanation.';
 return'The lesson-aware tutor is available in guided mode, but open-ended AI responses need one configured free-provider key in Netlify.';
}
export default async function(req){
 if(req.method!=='POST')return out(405,{error:'Method not allowed.'});
 if(!sameOrigin(req))return out(403,{error:'Cross-site tutor requests are blocked.'});
 var len=Number(req.headers.get('content-length')||0);if(len>MAX)return out(413,{error:'Tutor request is too large.'});
 var p;try{p=await req.json();}catch(e){return out(400,{error:'Invalid JSON.'});}
 var mode=['teach','hint','ask'].includes(p&&p.mode)?p.mode:'ask',message=clean(p&&p.message,1600),c=ctx(p&&p.context),history=hist(p&&p.history);
 if(!message)return out(400,{error:'Message is required.'});
 var sys=system(mode),user=prompt(message,c),order=clean(env('CSAI_TUTOR_PROVIDER_ORDER')||'groq,gemini,openrouter',100).split(',').map(function(x){return x.trim().toLowerCase();});
 for(var i=0;i<order.length;i++){
  var provider=order[i];
  try{
   if(provider==='groq'){
    var g=env('GROQ_API_KEY');if(!g)continue;
    var gt=await openai('https://api.groq.com/openai/v1/chat/completions',g,env('CSAI_TUTOR_GROQ_MODEL')||'qwen/qwen3.8-27b',sys,history,user);
    return out(200,{text:gt,provider:'Groq free tier'});
   }
   if(provider==='gemini'){
    var k=env('GOOGLE_GENERATIVE_AI_API_KEY');if(!k)continue;
    var gm=await gemini(k,env('CSAI_TUTOR_GEMINI_MODEL')||'gemini-3.8-flash',sys,history,user);
    return out(200,{text:gm,provider:'Gemini free tier'});
   }
   if(provider==='openrouter'){
    var o=env('OPENROUTER_API_KEY');if(!o)continue;
    var ot=await openai('https://openrouter.ai/api/v1/chat/completions',o,env('CSAI_TUTOR_OPENROUTER_MODEL')||'openrouter/free',sys,history,user,{'HTTP-Referer':env('SITE_URL')||new URL(req.url).origin,'X-Title':'CS & AI Mastery Tutor'});
    return out(200,{text:ot,provider:'OpenRouter free route'});
   }
  }catch(e){}
 }
 return out(200,{text:guided(mode,c),provider:'guided'});
}
export const config={path:'/api/tutor'};
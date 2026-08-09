(function(){
'use strict';

var INDENT='    ';
var SELECTOR='textarea[data-editor],textarea[data-project-editor],textarea[data-evergreen-code],textarea[data-dual-cpp-editor],textarea.project-editor,textarea.evergreen-editor';

function isEditor(el){return !!(el&&el.matches&&el.matches(SELECTOR));}
function lineStart(value,pos){return value.lastIndexOf('\n',Math.max(0,pos-1))+1;}
function lineEnd(value,pos){var i=value.indexOf('\n',pos);return i<0?value.length:i;}
function leading(line){return (String(line).match(/^[ \t]*/)||[''])[0].replace(/\t/g,INDENT);}
function language(el){
  var holder=el.closest('[data-lang],[data-lang-variant],[data-csai-active-language],[data-project]');
  var raw=String(
    (holder&&(holder.getAttribute('data-lang')||holder.getAttribute('data-lang-variant')||holder.getAttribute('data-csai-active-language')))||
    el.getAttribute('data-language')||''
  ).toLowerCase();
  if(raw==='c++')raw='cpp';
  if(raw&&raw!=='dual')return raw;
  var code=String(el.value||'');
  if(/#include\s*[<"]|\bstd::|\bcout\s*<<|\bint\s+main\s*\(/.test(code))return'cpp';
  if(/\b(console\.log|const\s+|let\s+|function\s+|=>)\b/.test(code))return'javascript';
  if(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i.test(code))return'sql';
  if(/<\/?[a-z][^>]*>/i.test(code))return'html';
  return'python';
}
function setValue(el,value,start,end){
  el.value=value;
  el.selectionStart=start;
  el.selectionEnd=end==null?start:end;
  el.dispatchEvent(new Event('input',{bubbles:true}));
}
function indentSelection(el,outdent){
  var value=el.value,start=el.selectionStart,end=el.selectionEnd;
  var first=lineStart(value,start),last=lineEnd(value,end);
  var block=value.slice(first,last),lines=block.split('\n'),removedBefore=0,totalDelta=0;
  var next=lines.map(function(line,index){
    if(!outdent){totalDelta+=INDENT.length;return INDENT+line;}
    var remove=line.startsWith('\t')?1:Math.min(INDENT.length,(line.match(/^ */)||[''])[0].length);
    if(index===0)removedBefore=remove;
    totalDelta-=remove;
    return line.slice(remove);
  }).join('\n');
  var nextValue=value.slice(0,first)+next+value.slice(last);
  var nextStart=outdent?Math.max(first,start-removedBefore):start+INDENT.length;
  var nextEnd=Math.max(nextStart,end+totalDelta);
  setValue(el,nextValue,nextStart,nextEnd);
}
function smartEnter(el,event){
  var value=el.value,start=el.selectionStart,end=el.selectionEnd;
  var before=value.slice(0,start),after=value.slice(end);
  var current=before.slice(lineStart(before,before.length));
  var trimmed=current.trim();
  var base=leading(current),lang=language(el),indent=base;

  if(lang==='python'){
    if(/^(elif\b|else\s*:|except\b|finally\s*:)/.test(trimmed)&&base.length>=INDENT.length){
      base=base.slice(0,-INDENT.length);
    }
    if(/:\s*(#.*)?$/.test(trimmed))indent=base+INDENT;else indent=base;
  }else if(lang==='cpp'||lang==='javascript'||lang==='java'||lang==='c'){
    if(/}\s*$/.test(trimmed)&&base.length>=INDENT.length)base=base.slice(0,-INDENT.length);
    if(/{\s*$/.test(trimmed)){
      var rest=after.slice(0,lineEnd(after,0));
      if(/^\s*}/.test(rest)){
        event.preventDefault();
        var insertion='\n'+base+INDENT+'\n'+base;
        var next=before+insertion+after;
        setValue(el,next,before.length+1+base.length+INDENT.length);
        return true;
      }
      indent=base+INDENT;
    }else indent=base;
  }

  event.preventDefault();
  var insertion='\n'+indent;
  setValue(el,before+insertion+after,before.length+insertion.length);
  return true;
}
function dedentKeyword(el){
  if(language(el)!=='python')return;
  var pos=el.selectionStart,value=el.value,start=lineStart(value,pos),end=lineEnd(value,pos);
  var line=value.slice(start,end),m=line.match(/^(\s+)(elif\b.*:|else\s*:|except\b.*:|finally\s*:)(\s*(?:#.*)?)$/);
  if(!m)return;
  var spaces=m[1].replace(/\t/g,INDENT);
  if(spaces.length<INDENT.length)return;
  var nextLine=spaces.slice(0,-INDENT.length)+m[2]+m[3];
  var delta=line.length-nextLine.length;
  setValue(el,value.slice(0,start)+nextLine+value.slice(end),Math.max(start,pos-delta));
}
function addStyle(){
  if(document.getElementById('csai-smart-code-editor-style'))return;
  var s=document.createElement('style');s.id='csai-smart-code-editor-style';s.textContent=`
${SELECTOR}{tab-size:4;background-image:repeating-linear-gradient(to right,transparent 0,transparent calc(4ch - 1px),rgba(135,155,180,.10) calc(4ch - 1px),rgba(135,155,180,.10) 4ch);background-position:13px 0}
${SELECTOR}:focus{background-image:repeating-linear-gradient(to right,transparent 0,transparent calc(4ch - 1px),rgba(135,155,180,.17) calc(4ch - 1px),rgba(135,155,180,.17) 4ch)}
`;
  document.head.appendChild(s);
}

document.addEventListener('keydown',function(event){
  var el=event.target;if(!isEditor(el))return;
  if(event.key==='Tab'){
    event.preventDefault();
    if(el.selectionStart!==el.selectionEnd || event.shiftKey)indentSelection(el,event.shiftKey);
    else{
      var value=el.value,pos=el.selectionStart;
      setValue(el,value.slice(0,pos)+INDENT+value.slice(el.selectionEnd),pos+INDENT.length);
    }
    return;
  }
  if(event.key==='Enter')smartEnter(el,event);
},true);

document.addEventListener('input',function(event){var el=event.target;if(isEditor(el))dedentKeyword(el);},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addStyle,{once:true});else addStyle();
})();

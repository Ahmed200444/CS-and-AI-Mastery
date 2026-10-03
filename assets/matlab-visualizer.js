(function(root){
'use strict';

/*
 * A small, dependency-free MATLAB teaching preview. It intentionally renders the
 * language constructs used by this course instead of pretending that a browser
 * JavaScript engine is MATLAB. Arrays and matrices become tables; plot calls
 * become SVG charts; unsupported lines remain visible with an honest message.
 * Displays the MATLAB Editor (Script Window) and Command Window / Main Window
 * side-by-side in a true MATLAB desktop layout.
 */
var FUNCTIONS={
 sin:Math.sin,cos:Math.cos,tan:Math.tan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,
 exp:Math.exp,sqrt:Math.sqrt,log:Math.log,log10:Math.log10,abs:Math.abs,floor:Math.floor,
 ceil:Math.ceil,round:Math.round
};
var COLORS=['#17649a','#c44152','#16805b','#a56b00','#7b4ab4'];
function clean(v){return String(v==null?'':v).replace(/\r/g,'').trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function isArray(v){return Array.isArray(v);}
function isMatrix(v){return isArray(v)&&v.length>0&&isArray(v[0]);}
function clone(v){if(isArray(v))return v.map(clone);return v;}
function flatten(v){return isMatrix(v)?[].concat.apply([],v):isArray(v)?v.slice():[v];}
function shape(v){if(!isArray(v))return[1,1];if(!v.length)return[0,0];if(isMatrix(v))return[v.length,v[0].length];return[1,v.length];}
function scalar(v){if(isArray(v)){var a=flatten(v);return Number(a[0]||0);}return Number(v);}
function numeric(v){return typeof v==='number'&&Number.isFinite(v);}
function each(v,fn){return isMatrix(v)?v.map(function(row){return row.map(fn);}):isArray(v)?v.map(fn):fn(v);}
function pair(a,b,fn){
 if(!isArray(a)&&!isArray(b))return fn(a,b);
 if(!isArray(a))return each(b,function(x){return fn(a,x);});
 if(!isArray(b))return each(a,function(x){return fn(x,b);});
 if(isMatrix(a)||isMatrix(b)){
  var ma=isMatrix(a)?a:(a.length?[a]:[]),mb=isMatrix(b)?b:(b.length?[b]:[]);
  if(ma.length!==mb.length||((ma[0]||[]).length!==((mb[0]||[]).length)))throw Error('Array dimensions do not agree for element-wise operation.');
  return ma.map(function(row,i){return row.map(function(x,j){return fn(x,mb[i][j]);});});
 }
 if(a.length!==b.length)throw Error('Array lengths do not agree for element-wise operation.');
 return a.map(function(x,i){return fn(x,b[i]);});
}
function add(a,b){return pair(a,b,function(x,y){return x+y;});}
function sub(a,b){return pair(a,b,function(x,y){return x-y;});}
function div(a,b){return pair(a,b,function(x,y){return x/y;});}
function pow(a,b){return pair(a,b,function(x,y){return Math.pow(x,y);});}
function matMul(a,b){
 if(!isArray(a)&&!isArray(b))return a*b;
 if(!isArray(a))return each(b,function(x){return a*x;});
 if(!isArray(b))return each(a,function(x){return x*b;});
 var A=isMatrix(a)?a:[a],B=isMatrix(b)?b:[b];
 if(!A.length||!B.length||A[0].length!==B.length)throw Error('Matrix multiplication needs matching inner dimensions.');
 var out=A.map(function(row){return B[0].map(function(_,j){var sum=0;for(var k=0;k<B.length;k++)sum+=Number(row[k]||0)*Number(B[k][j]||0);return sum;});});
 return out.length===1&&out[0].length===1?out[0][0]:out.length===1?out[0]:out;
}
function transpose(v){if(!isArray(v))return v;var a=isMatrix(v)?v:[v],rows=a.length,cols=a[0]?a[0].length:0,out=[];for(var j=0;j<cols;j++){var row=[];for(var i=0;i<rows;i++)row.push(a[i][j]);out.push(row);}return out.length===1?out[0]:out;}
function balanced(s){var d=0,q='',first=-1;for(var i=0;i<s.length;i++){var c=s[i];if(q){if(c===q&&s[i-1]!=='\\')q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;if(first<0&&d===0)first=i;if(d<0)return false;}return d===0&&!q;}
function stripOuter(s){s=clean(s);while(s[0]==='('&&s[s.length-1]===')'&&balanced(s.slice(1,-1)))s=clean(s.slice(1,-1));return s;}
function topParts(s,separator){
 var out=[],start=0,d=0,q='';
 for(var i=0;i<s.length;i++){var c=s[i];if(q){if(c===q&&s[i-1]!=='\\')q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;else if(c===separator&&d===0){out.push(clean(s.slice(start,i)));start=i+1;}}
 out.push(clean(s.slice(start)));return out.filter(Boolean);
}
function arrayTokens(row){
 var out=[],start=0,d=0,q='';
 function push(i){var x=clean(row.slice(start,i));if(x)out.push(x);start=i+1;}
 for(var i=0;i<row.length;i++){var c=row[i];if(q){if(c===q&&row[i-1]!=='\\')q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;else if(d===0&&(c===','||/\s/.test(c))){push(i);while(i+1<row.length&&/\s/.test(row[i+1]))i++;}}
 var tail=clean(row.slice(start));if(tail)out.push(tail);return out;
}
function findBinary(s,ops){
 var d=0,q='',candidate=-1,op='';
 for(var i=s.length-1;i>=0;i--){var c=s[i];if(q){if(c===q&&s[i-1]!=='\\')q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c===')'||c===']')d++;else if(c==='('||c==='[')d--;if(d!==0)continue;
  for(var j=0;j<ops.length;j++){var x=ops[j],start=i-x.length+1;if(start<0||s.slice(start,i+1)!==x)continue;if((x==='+'||x==='-')&&(start===0||/[+\-*\/%^<>=&|,]/.test(s[start-1])))continue;candidate=start;op=x;break;}if(candidate>=0)break;
 }
 return candidate<0?null:{index:candidate,op:op};
}
function callArgs(s){return topParts(s,',');}
function makeRange(parts,env){
 var a=scalar(evalExpr(parts[0],env)),step=parts.length===3?scalar(evalExpr(parts[1],env)):1,b=scalar(evalExpr(parts.length===3?parts[2]:parts[1],env));if(!Number.isFinite(a)||!Number.isFinite(step)||!Number.isFinite(b)||step===0)throw Error('Invalid MATLAB colon range.');var out=[],n=0;if(step>0){for(var x=a;x<=b+1e-12&&n<10000;x+=step,n++)out.push(Number(x.toFixed(12)));}else{for(var y=a;y>=b-1e-12&&n<10000;y+=step,n++)out.push(Number(y.toFixed(12)));}return out;
}
function evalFunction(name,args){
 name=name.toLowerCase();if(name==='pi')return Math.PI;
 if(name==='size'){var sh=shape(args[0]);return sh;}
 if(name==='length'){var sh=shape(args[0]);return Math.max(sh[0],sh[1]);}
 if(name==='numel')return flatten(args[0]).length;
 if(name==='zeros'||name==='ones'){var r=Math.max(0,Math.floor(scalar(args[0]||1))),c=args.length>1?Math.max(0,Math.floor(scalar(args[1]))):r;var fill=name==='ones'?1:0;return r===1?[fill]:Array.from({length:r},function(){return Array(c).fill(fill);});}
 if(name==='linspace'){var start=scalar(args[0]),stop=scalar(args[1]),count=Math.floor(scalar(args[2]||100)),out=[];for(var i=0;i<Math.max(1,count);i++)out.push(count<=1?start:start+(stop-start)*i/(count-1));return out;}
 if(FUNCTIONS[name]){var f=FUNCTIONS[name];return each(args[0],function(x){return f(Number(x));});}
 return undefined;
}
function evalExpr(input,env){
 var s=stripOuter(input);if(!s)return 0;
 if((s[0]==="'"&&s[s.length-1]==="'")||(s[0]==='"'&&s[s.length-1]==='"'))return s.slice(1,-1).replace(/''/g,"'");
 if(s[s.length-1]==="'"&&s.length>1&&!/^'.*'$/.test(s))return transpose(evalExpr(s.slice(0,-1),env));
 var colon=topParts(s,':');if(colon.length>1)return makeRange(colon,env);
 if(s[0]==='['&&s[s.length-1]===']'&&balanced(s)){
  var rows=topParts(s.slice(1,-1),';').map(function(row){return arrayTokens(row).map(function(x){return evalExpr(x,env);});});
  if(rows.length===1)return rows[0];var width=rows[0].length;if(rows.some(function(r){return r.length!==width;}))throw Error('Rows in a MATLAB array literal must have the same length.');return rows;
 }
 var bin=findBinary(s,['||']);if(bin)return !!(evalExpr(s.slice(0,bin.index),env)||evalExpr(s.slice(bin.index+2),env));
 bin=findBinary(s,['&&']);if(bin)return !!(evalExpr(s.slice(0,bin.index),env)&&evalExpr(s.slice(bin.index+2),env));
 bin=findBinary(s,['==','~=','<=','>=','<','>']);if(bin){var l=evalExpr(s.slice(0,bin.index),env),r=evalExpr(s.slice(bin.index+bin.op.length),env),f={"==":function(a,b){return a===b},"~=":function(a,b){return a!==b},"<":function(a,b){return a<b},">":function(a,b){return a>b},"<=":function(a,b){return a<=b},">=":function(a,b){return a>=b}}[bin.op];return pair(l,r,f);}
 bin=findBinary(s,['+','-']);if(bin){var left=evalExpr(s.slice(0,bin.index),env),right=evalExpr(s.slice(bin.index+1),env);return bin.op==='+'?add(left,right):sub(left,right);}
 bin=findBinary(s,['.*','./','*','/']);if(bin){var left2=evalExpr(s.slice(0,bin.index),env),right2=evalExpr(s.slice(bin.index+bin.op.length),env);return bin.op==='.*'?pair(left2,right2,function(a,b){return a*b;}):bin.op==='./'?div(left2,right2):bin.op==='*'?matMul(left2,right2):div(left2,right2);}
 bin=findBinary(s,['.^','^']);if(bin){var l3=evalExpr(s.slice(0,bin.index),env),r3=evalExpr(s.slice(bin.index+bin.op.length),env);return pow(l3,r3);}
 if(/^[-+]/.test(s))return s[0]==='-'?each(evalExpr(s.slice(1),env),function(x){return -x;}):evalExpr(s.slice(1),env);
 var call=s.match(/^([A-Za-z_]\w*)\((.*)\)$/);if(call&&balanced(call[2])){
  var name=call[1],args=callArgs(call[2]).map(function(a){return evalExpr(a,env);}),fn=evalFunction(name,args);if(fn!==undefined)return fn;
  if(Object.prototype.hasOwnProperty.call(env,name)){var base=env[name],idx=args.map(function(x){return Math.floor(scalar(x))-1;});if(idx.length===1)return isMatrix(base)?base[idx[0]]:base[idx[0]];if(idx.length===2)return base[idx[0]][idx[1]];}
 }
 if(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)||/^[+-]\d+(?:\.\d+)?$/.test(s))return Number(s);
 if(Object.prototype.hasOwnProperty.call(env,s))return env[s];
 throw Error('Unsupported MATLAB expression: '+s);
}
function stripComment(line){var q='',d=0;for(var i=0;i<line.length;i++){var c=line[i];if(q){if(c===q&&line[i-1]!== '\\'){if(q==="'"&&line[i+1]==="'"){i++;continue;}q='';}continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='%')return line.slice(0,i);if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;}
 return line;
}
function prepared(source){return String(source||'').replace(/\r/g,'').split('\n').map(function(raw){var line=stripComment(raw).trim();return{raw:raw,line:line};});}
function isOpen(line){return /^(for|while|if|switch|function)\b/i.test(line);}
function matchingEnd(lines,start){var depth=0;for(var i=start;i<lines.length;i++){var l=lines[i].line;if(isOpen(l))depth++;if(/^end\b/i.test(l)){depth--;if(depth===0)return i;}}return lines.length-1;}
function assignIndex(env,lhs,value){
 var m=lhs.match(/^([A-Za-z_]\w*)\((.*)\)$/);if(!m){env[lhs]=clone(value);return;}
 var name=m[1],idx=callArgs(m[2]).map(function(x){return Math.floor(scalar(evalExpr(x,env)))-1;});if(!idx.length)throw Error('An indexed assignment needs an index.');var base=env[name];if(!isArray(base))base=[];if(idx.length===1){var i=idx[0];while(base.length<=i)base.push(0);base[i]=clone(value);}else{if(!isMatrix(base))base=[base.slice()];var r=idx[0],c=idx[1];while(base.length<=r)base.push([]);while(base[r].length<=c)base[r].push(0);base[r][c]=clone(value);}env[name]=base;}
function findAssignment(line){var d=0,q='';for(var i=0;i<line.length;i++){var c=line[i];if(q){if(c===q&&line[i-1]!== '\\')q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;else if(c==='='&&d===0&&line[i-1]!=='='&&line[i+1]!=='='){return{i:i};}}return null;}
function executeRange(lines,start,end,state,env){
 for(var i=start;i<end;i++){
  var line=lines[i].line;if(!line)continue;
  if(/^function\b/i.test(line)){var stop=matchingEnd(lines,i);state.notes.push('Function definition recorded at line '+(i+1)+'; call it from MATLAB to evaluate it.');i=stop;continue;}
  var fm=line.match(/^for\s+([A-Za-z_]\w*)\s*=\s*(.+)$/i);if(fm){var stopFor=matchingEnd(lines,i),values=evalExpr(fm[2],env);for(var fi=0;fi<flatten(values).length;fi++){env[fm[1]]=flatten(values)[fi];executeRange(lines,i+1,stopFor,state,env);}i=stopFor;continue;}
  var wm=line.match(/^while\s+(.+)$/i);if(wm){var stopWhile=matchingEnd(lines,i),guard=0;while(scalar(evalExpr(wm[1],env))&&guard++<500)executeRange(lines,i+1,stopWhile,state,env);if(guard>=500)state.notes.push('while loop stopped after 500 iterations in the browser preview.');i=stopWhile;continue;}
  if(/^if\s+/i.test(line)){var stopIf=matchingEnd(lines,i),branches=[],depth=0,current={kind:'if',cond:line.replace(/^if\s+/i,''),start:i+1};for(var j=i+1;j<stopIf;j++){var q=lines[j].line;if(isOpen(q))depth++;if(/^end\b/i.test(q))depth--;if(depth===0&&/^elseif\s+/i.test(q)){current.end=j;branches.push(current);current={kind:'elseif',cond:q.replace(/^elseif\s+/i,''),start:j+1};}else if(depth===0&&/^else\b/i.test(q)){current.end=j;branches.push(current);current={kind:'else',start:j+1};}}current.end=stopIf;branches.push(current);for(var bi=0;bi<branches.length;bi++){var br=branches[bi];if(br.kind==='else'||scalar(evalExpr(br.cond,env))){executeRange(lines,br.start,br.end,state,env);break;}}i=stopIf;continue;}
  var sm=line.match(/^switch\s+(.+)$/i);if(sm){var stopSwitch=matchingEnd(lines,i),wanted=evalExpr(sm[1],env),chosen=-1,otherwise=-1;for(var sj=i+1;sj<stopSwitch;sj++){var sl=lines[sj].line,cm=sl.match(/^case\s+(.+)$/i);if(cm&&chosen<0&&scalar(evalExpr(cm[1],env))===scalar(wanted))chosen=sj+1;if(/^otherwise\b/i.test(sl))otherwise=sj+1;}var begin=chosen>=0?chosen:otherwise;if(begin>=0){var next=stopSwitch;for(var sk=begin;sk<stopSwitch;sk++){if(/^case\s+|^otherwise\b/i.test(lines[sk].line)){next=sk;break;}}executeRange(lines,begin,next,state,env);}i=stopSwitch;continue;}
  if(/^plot\s*\(/i.test(line)){var pm=line.match(/^plot\s*\((.*)\)\s*;?$/i);if(pm){var pa=callArgs(pm[1]),series=[];for(var pi=0;pi<pa.length;){var xv=evalExpr(pa[pi],env);if(typeof xv==='string'){pi++;continue;}var yv=pa[pi+1]!==undefined&&typeof evalExpr(pa[pi+1],env)!=='string'?evalExpr(pa[pi+1],env):xv;if(yv===xv){xv=Array.from({length:flatten(yv).length},function(_,k){return k+1;});pi++;}else pi+=2;series.push({x:flatten(xv),y:flatten(yv)});while(pi<pa.length&&/^['"]/.test(pa[pi]))pi++;}state.plots.push({series:series});}continue;}
  var callLine=line.match(/^(xlabel|ylabel|title|legend)\s*\((.*)\)\s*;?$/i);if(callLine){var args=callArgs(callLine[2]).map(function(x){return evalExpr(x,env);});var p=state.plots[state.plots.length-1]||(state.plots[state.plots.length]= {series:[]});if(callLine[1].toLowerCase()==='legend')p.legend=args.map(String);else p[callLine[1].toLowerCase()]=String(args[0]||'');continue;}
  var disp=line.match(/^(disp|fprintf)\s*\((.*)\)\s*;?$/i);if(disp){var dv=evalExpr(callArgs(disp[2])[0],env);state.output.push(formatText(dv));continue;}
  var a=findAssignment(line);if(a){var lhs=clean(line.slice(0,a.i)),rhs=clean(line.slice(a.i+1).replace(/;\s*$/,'')),value=evalExpr(rhs,env);assignIndex(env,lhs,value);if(!/;\s*$/.test(line))state.output.push(lhs+' =\n'+formatText(value));continue;}
  if(!/^(end|else|elseif|case|otherwise)\b/i.test(line)){try{var val=evalExpr(line.replace(/;\s*$/,''),env);if(!/;\s*$/.test(line))state.output.push(formatText(val));}catch(e){state.notes.push('Line '+(i+1)+': '+e.message);}}
 }
}
function formatText(v){if(typeof v==='string')return v;if(!isArray(v))return String(Number.isFinite(v)?Number(v.toFixed(8)):v);return JSON.stringify(v);}
function execute(source){var lines=prepared(source),state={env:Object.create(null),output:[],notes:[],plots:[]};try{executeRange(lines,0,lines.length,state,state.env);}catch(e){state.notes.push(e.message);}return state;}
function tableHtml(name,value){var sh=shape(value),rows=isMatrix(value)?value:[isArray(value)?value:[value]],maxR=Math.min(rows.length,24),maxC=Math.min(sh[1],16),html='<details class="matlab-result-table" open><summary><b>'+esc(name)+'</b> · '+sh[0]+' × '+sh[1]+'</summary><div class="matlab-table-scroll"><table><thead><tr><th scope="col">row</th>';for(var c=0;c<maxC;c++)html+='<th scope="col">'+(c+1)+'</th>';html+='</tr></thead><tbody>';for(var r=0;r<maxR;r++){html+='<tr><th scope="row">'+(r+1)+'</th>';for(var j=0;j<maxC;j++)html+='<td>'+esc(formatText(rows[r]&&rows[r][j]!==undefined?rows[r][j]:''))+'</td>';html+='</tr>';}html+='</tbody></table></div>'+(sh[0]>maxR||sh[1]>maxC?'<small>Preview limited to '+maxR+' rows × '+maxC+' columns.</small>':'')+'</details>';return html;}
function plotSvg(plot){var series=plot.series||[];if(!series.length)return'';var w=680,h=300,left=54,right=18,top=30,bottom=44,allX=[],allY=[];series.forEach(function(s){s.x.forEach(function(x){if(numeric(x))allX.push(x);});s.y.forEach(function(y){if(numeric(y))allY.push(y);});});if(!allX.length||!allY.length)return'';var xmin=Math.min.apply(Math,allX),xmax=Math.max.apply(Math,allX),ymin=Math.min.apply(Math,allY),ymax=Math.max.apply(Math,allY);if(xmin===xmax){xmin-=1;xmax+=1;}if(ymin===ymax){ymin-=1;ymax+=1;}function X(x){return left+(x-xmin)/(xmax-xmin)*(w-left-right);}function Y(y){return h-bottom-(y-ymin)/(ymax-ymin)*(h-top-bottom);}var s='<div class="matlab-plot-card"><div class="matlab-plot-heading">MATLAB figure preview</div><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="MATLAB plot preview"><rect x="0" y="0" width="'+w+'" height="'+h+'" fill="var(--panel)"/><line x1="'+left+'" y1="'+(h-bottom)+'" x2="'+(w-right)+'" y2="'+(h-bottom)+'" stroke="var(--muted)"/><line x1="'+left+'" y1="'+top+'" x2="'+left+'" y2="'+(h-bottom)+'" stroke="var(--muted)"/><text x="'+(w/2)+'" y="'+(h-7)+'" text-anchor="middle" fill="currentColor">'+esc(plot.xlabel||'x')+'</text><text x="14" y="'+(h/2)+'" text-anchor="middle" transform="rotate(-90 14 '+(h/2)+')" fill="currentColor">'+esc(plot.ylabel||'y')+'</text>';if(plot.title)s+='<text x="'+(w/2)+'" y="18" text-anchor="middle" font-weight="700" fill="currentColor">'+esc(plot.title)+'</text>';series.forEach(function(curve,i){var n=Math.min(curve.x.length,curve.y.length),points=[];for(var k=0;k<n;k++)if(numeric(curve.x[k])&&numeric(curve.y[k]))points.push(X(curve.x[k]).toFixed(2)+','+Y(curve.y[k]).toFixed(2));if(points.length>1)s+='<polyline fill="none" stroke="'+COLORS[i%COLORS.length]+'" stroke-width="2" points="'+points.join(' ')+'"/>';});if(plot.legend&&plot.legend.length){plot.legend.forEach(function(label,i){s+='<line x1="'+(w-right-120)+'" y1="'+(top+12*i)+'" x2="'+(w-right-102)+'" y2="'+(top+12*i)+'" stroke="'+COLORS[i%COLORS.length]+'" stroke-width="2"/><text x="'+(w-right-97)+'" y="'+(top+4+12*i)+'" font-size="10" fill="currentColor">'+esc(label)+'</text>';});}return s+'</svg></div>';}
function resultHtml(state){
 var keys=Object.keys(state.env);
 var html='<div class="matlab-result-summary"><b>Command Window &amp; Workspace Summary</b><span>'+keys.length+' variable'+(keys.length===1?'':'s')+' · '+state.plots.length+' figure'+(state.plots.length===1?'':'s')+'</span></div>';
 if(state.output.length){
  html+='<div class="matlab-command-output"><b>Command Window (&gt;&gt;) Output</b><pre><span class="matlab-prompt-line">&gt;&gt; </span>'+esc(state.output.join('\n\n'))+'</pre></div>';
 } else {
  html+='<div class="matlab-command-output"><b>Command Window (&gt;&gt;) Output</b><pre><span class="matlab-prompt-line">&gt;&gt; </span>Execution completed (output suppressed with semicolons).</pre></div>';
 }
 keys.forEach(function(k){var v=state.env[k];if(isArray(v)||numeric(v))html+=tableHtml(k,v);});
 state.plots.forEach(function(p){html+=plotSvg(p);});
 if(state.notes.length)html+='<details class="matlab-preview-notes" open><summary>Preview notes</summary><ul>'+state.notes.map(function(n){return'<li>'+esc(n)+'</li>';}).join('')+'</ul><p>This is a browser teaching preview. Use MATLAB or GNU Octave for features outside the supported course subset.</p></details>';
 return html;
}
function sourceFor(node){var text='value' in node?node.value:node.textContent||'';if(root.CSAILineExplainer&&root.CSAILineExplainer.stripGeneratedComments)text=root.CSAILineExplainer.stripGeneratedComments(text);return text.replace(/^\s*%\s*Explanation:.*$/gm,'');}
function addStyle(){
 if(document.getElementById('csai-matlab-visualizer-style'))return;
 var s=document.createElement('style');
 s.id='csai-matlab-visualizer-style';
 s.textContent=[
  '.matlab-workbench{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:14px;margin:14px 0;border:1px solid var(--border);border-radius:12px;background:var(--panel);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}',
  '@media(max-width:860px){.matlab-workbench{grid-template-columns:1fr}}',
  '.matlab-pane{display:flex;flex-direction:column;min-width:0}',
  '.matlab-pane-editor{border-right:1px solid var(--border);background:var(--code)}',
  '@media(max-width:860px){.matlab-pane-editor{border-right:none;border-bottom:1px solid var(--border)}}',
  '.matlab-pane-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--pill);color:var(--pilltext);font-size:.8rem;font-weight:800;letter-spacing:.02em;border-bottom:1px solid var(--border)}',
  '.matlab-pane-header-editor{background:#17212c;color:#c6d1da;border-color:#344352}',
  '.matlab-pane-body{padding:10px;flex:1;display:flex;flex-direction:column;overflow:auto}',
  '.matlab-pane-body pre.code{margin:0;border:none;background:transparent;flex:1;font-size:.86rem;line-height:1.55;color:#f4f7fb}',
  '.matlab-preview-btn{border:1px solid #17649a;border-radius:8px;background:#17649a;color:#fff;padding:8px 14px;font:800 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
  '.matlab-preview-btn:hover{filter:brightness(1.1)}',
  '.matlab-preview-btn:disabled{opacity:.58;cursor:wait}',
  '.matlab-preview-output{padding:8px 4px;background:transparent;color:var(--text);overflow:auto;flex:1}',
  '.matlab-result-summary{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:9px;font-size:.85rem}',
  '.matlab-result-summary span{color:var(--muted);font-size:.8rem}',
  '.matlab-command-output{margin:8px 0;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg)}',
  '.matlab-command-output pre{margin:6px 0 0;white-space:pre-wrap;font:500 .86rem/1.5 ui-monospace,monospace}',
  '.matlab-prompt-line{color:var(--accent);font-weight:700}',
  '.matlab-result-table{margin:9px 0;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--panel)}',
  '.matlab-result-table summary{cursor:pointer;font-size:.85rem}',
  '.matlab-table-scroll{overflow:auto;margin-top:7px}',
  '.matlab-result-table table{border-collapse:collapse;min-width:240px;width:100%;font:12px/1.4 ui-monospace,monospace}',
  '.matlab-result-table th,.matlab-result-table td{padding:4px 7px;border:1px solid var(--border);text-align:right;white-space:nowrap}',
  '.matlab-result-table th{background:var(--pill);color:var(--pilltext);font-weight:700}',
  '.matlab-result-table small{color:var(--muted)}',
  '.matlab-plot-card{margin:10px 0;border:1px solid var(--border);border-radius:8px;padding:8px;overflow:auto;background:var(--panel)}',
  '.matlab-plot-heading{font-weight:800;font-size:.85rem;margin:0 0 6px}',
  '.matlab-plot-card svg{display:block;min-width:320px;max-width:100%;height:auto}',
  '.matlab-preview-notes{margin-top:10px;color:var(--muted);font-size:.82rem}'
 ].join('');
 document.head.appendChild(s);
}
function mount(node){
 if(node.dataset.matlabPreviewReady)return;
 node.dataset.matlabPreviewReady='1';
 var card=node.closest('.lesson-run-card')||node.closest('.csai-study-example')||node.parentElement;
 if(!card)return;

 var existingWorkbench=node.closest('.matlab-workbench');
 var workbench,editorPane,commandPane,out,button;

 if(!existingWorkbench){
  workbench=document.createElement('div');
  workbench.className='matlab-workbench';

  editorPane=document.createElement('div');
  editorPane.className='matlab-pane matlab-pane-editor';
  var editorHeader=document.createElement('div');
  editorHeader.className='matlab-pane-header matlab-pane-header-editor';
  editorHeader.innerHTML='<span>📄 MATLAB Editor — Script (.m) / Function</span><span style="font-size:.72rem;opacity:.8">Script Window</span>';
  editorPane.appendChild(editorHeader);

  var editorBody=document.createElement('div');
  editorBody.className='matlab-pane-body';
  node.parentNode.insertBefore(workbench,node);
  editorBody.appendChild(node);
  editorPane.appendChild(editorBody);

  var toolbar=document.createElement('div');
  toolbar.className='lesson-run-toolbar';
  toolbar.style.padding='8px 10px';
  toolbar.style.borderTop='1px solid #344352';
  toolbar.style.background='#17212c';
  button=document.createElement('button');
  button.type='button';
  button.className='matlab-preview-btn';
  button.textContent='▶ Run Script / Evaluate';
  button.setAttribute('data-matlab-preview','');
  toolbar.appendChild(button);
  editorPane.appendChild(toolbar);
  workbench.appendChild(editorPane);

  commandPane=document.createElement('div');
  commandPane.className='matlab-pane matlab-pane-command';
  var commandHeader=document.createElement('div');
  commandHeader.className='matlab-pane-header';
  commandHeader.innerHTML='<span>💻 Command Window &amp; Workspace</span><span style="font-size:.72rem;opacity:.8">Main Window (&gt;&gt;)</span>';
  commandPane.appendChild(commandHeader);

  var commandBody=document.createElement('div');
  commandBody.className='matlab-pane-body';
  out=document.createElement('div');
  out.className='matlab-preview-output';
  out.innerHTML='<div class="matlab-command-output"><b>Command Window (&gt;&gt;)</b><pre><span class="matlab-prompt-line">&gt;&gt; </span>Ready. Press <b>Run Script / Evaluate</b> to execute script.</pre></div>';
  commandBody.appendChild(out);
  commandPane.appendChild(commandBody);
  workbench.appendChild(commandPane);
 } else {
  button=existingWorkbench.querySelector('.matlab-preview-btn');
  out=existingWorkbench.querySelector('.matlab-preview-output');
 }

 function run(){
  if(button)button.disabled=true;
  var state=execute(sourceFor(node));
  if(out)out.innerHTML=resultHtml(state);
  if(button)button.disabled=false;
 }

 if(button)button.addEventListener('click',run);
 if(/\bplot\s*\(|\[[^\]]+;[^\]]+\]/.test(sourceFor(node)))setTimeout(run,0);
}
function scan(rootNode){
 var q=[];
 if(rootNode&&rootNode.matches&&rootNode.matches('pre[data-language="matlab"],textarea[data-language="matlab"]'))q.push(rootNode);
 if(rootNode&&rootNode.querySelectorAll)q=q.concat(Array.from(rootNode.querySelectorAll('pre[data-language="matlab"],textarea[data-language="matlab"]')));
 q.forEach(mount);
}
function boot(){
 addStyle();
 scan(document);
 new MutationObserver(function(records){
  records.forEach(function(r){
   Array.from(r.addedNodes||[]).forEach(function(n){if(n.nodeType===1)scan(n);});
  });
 }).observe(document.documentElement,{childList:true,subtree:true});
}
var api={execute:execute,renderResult:resultHtml};
if(typeof module==='object'&&module.exports)module.exports=api;
else{
 root.CSAIMatlabVisualizer=api;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
}
})(typeof window==='object'?window:globalThis);

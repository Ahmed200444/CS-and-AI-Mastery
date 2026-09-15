(function(){
'use strict';

var ROOT_ID='csai-catalog-recovery';
var WRAP='csai-filter-wrap';
var STYLE='csai-filter-controls-style';
var openWrap=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

function addStyle(){
  if(document.getElementById(STYLE))return;
  var s=document.createElement('style');
  s.id=STYLE;
  s.textContent=`
  #${ROOT_ID} .scr-select.${WRAP}-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;overflow:hidden!important;white-space:nowrap!important}
  #${ROOT_ID} .${WRAP}{position:relative;min-width:0;width:100%}
  #${ROOT_ID} .csai-filter-button{width:100%;min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;border:1px solid #b9c7d5;border-radius:10px;background:#fff;color:#172231;font:inherit;text-align:left;cursor:pointer}
  #${ROOT_ID} .csai-filter-button:hover,#${ROOT_ID} .csai-filter-button:focus-visible{border-color:#5d83a5;outline:none;box-shadow:0 0 0 2px rgba(23,100,154,.15)}
  #${ROOT_ID} .csai-filter-chevron{font-size:.72rem;transition:transform .15s ease}
  #${ROOT_ID} .${WRAP}.open .csai-filter-chevron{transform:rotate(180deg)}
  #${ROOT_ID} .csai-filter-menu{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:2147483646;display:none;max-height:300px;overflow:auto;padding:6px;border:1px solid #b9c7d5;border-radius:10px;background:#fff;box-shadow:0 14px 34px rgba(0,0,0,.22)}
  #${ROOT_ID} .${WRAP}.open .csai-filter-menu{display:block}
  #${ROOT_ID} .csai-filter-option{display:flex;align-items:center;width:100%;padding:9px 10px;border:0;border-radius:7px;background:transparent;color:#172231;font:inherit;text-align:left;cursor:pointer}
  #${ROOT_ID} .csai-filter-option:hover,#${ROOT_ID} .csai-filter-option:focus-visible{background:#e8f1f8;outline:none}
  #${ROOT_ID} .csai-filter-option.selected{background:#dcecf8;color:#124e79;font-weight:800}
  html[data-theme="dark"] #${ROOT_ID} .csai-filter-button,body[data-theme="dark"] #${ROOT_ID} .csai-filter-button{background:#111b25;color:#edf3f8;border-color:#455464}
  html[data-theme="dark"] #${ROOT_ID} .csai-filter-menu,body[data-theme="dark"] #${ROOT_ID} .csai-filter-menu{background:#111b25;border-color:#455464;box-shadow:0 14px 34px rgba(0,0,0,.5)}
  html[data-theme="dark"] #${ROOT_ID} .csai-filter-option,body[data-theme="dark"] #${ROOT_ID} .csai-filter-option{color:#edf3f8}
  html[data-theme="dark"] #${ROOT_ID} .csai-filter-option:hover,html[data-theme="dark"] #${ROOT_ID} .csai-filter-option:focus-visible,body[data-theme="dark"] #${ROOT_ID} .csai-filter-option:hover,body[data-theme="dark"] #${ROOT_ID} .csai-filter-option:focus-visible{background:#223446}
  html[data-theme="dark"] #${ROOT_ID} .csai-filter-option.selected,body[data-theme="dark"] #${ROOT_ID} .csai-filter-option.selected{background:#274760;color:#cfeaff}
  @media(max-width:680px){#${ROOT_ID} .csai-filter-menu{position:static;margin-top:6px}}
  `;
  document.head.appendChild(s);
}

function closeAll(except){
  document.querySelectorAll('#'+ROOT_ID+' .'+WRAP+'.open').forEach(function(w){
    if(w!==except){w.classList.remove('open');var b=w.querySelector('.csai-filter-button');if(b)b.setAttribute('aria-expanded','false')}
  });
  if(!except)openWrap=null;
}

function sync(select,wrap){
  var opt=select.options[select.selectedIndex]||select.options[0];
  var label=wrap.querySelector('[data-filter-label]');
  if(label)label.textContent=opt?opt.textContent:'';
  wrap.querySelectorAll('.csai-filter-option').forEach(function(btn){
    var selected=btn.getAttribute('data-value')===select.value;
    btn.classList.toggle('selected',selected);
    btn.setAttribute('aria-selected',selected?'true':'false');
  });
}

function enhance(select){
  if(!select||select.dataset.csaiCustomFilter==='1')return;
  select.dataset.csaiCustomFilter='1';
  select.classList.add(WRAP+'-native');
  var wrap=document.createElement('div');
  wrap.className=WRAP;
  wrap.setAttribute('data-filter-key',select.getAttribute('data-scr-filter')||'');
  var current=select.options[select.selectedIndex]||select.options[0];
  var button=document.createElement('button');
  button.type='button';button.className='csai-filter-button';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  button.innerHTML='<span data-filter-label>'+esc(current?current.textContent:'')+'</span><span class="csai-filter-chevron">▼</span>';
  var menu=document.createElement('div');menu.className='csai-filter-menu';menu.setAttribute('role','listbox');
  Array.from(select.options).forEach(function(opt){
    var item=document.createElement('button');item.type='button';item.className='csai-filter-option';item.setAttribute('role','option');item.setAttribute('data-value',opt.value);item.textContent=opt.textContent;
    item.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      select.value=opt.value;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      sync(select,wrap);
      wrap.classList.remove('open');button.setAttribute('aria-expanded','false');openWrap=null;
    });
    menu.appendChild(item);
  });
  button.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var willOpen=!wrap.classList.contains('open');
    closeAll(wrap);
    wrap.classList.toggle('open',willOpen);
    button.setAttribute('aria-expanded',willOpen?'true':'false');
    openWrap=willOpen?wrap:null;
  });
  button.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'||e.key==='Enter'||e.key===' '){e.preventDefault();if(!wrap.classList.contains('open'))button.click();var first=menu.querySelector('.csai-filter-option.selected')||menu.querySelector('.csai-filter-option');if(first)first.focus()}
    if(e.key==='Escape'){wrap.classList.remove('open');button.setAttribute('aria-expanded','false')}
  });
  menu.addEventListener('keydown',function(e){
    var items=Array.from(menu.querySelectorAll('.csai-filter-option')),i=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[Math.min(items.length-1,i+1)]?.focus()}
    if(e.key==='ArrowUp'){e.preventDefault();items[Math.max(0,i-1)]?.focus()}
    if(e.key==='Escape'){e.preventDefault();wrap.classList.remove('open');button.setAttribute('aria-expanded','false');button.focus()}
  });
  select.parentNode.insertBefore(wrap,select.nextSibling);
  wrap.appendChild(button);wrap.appendChild(menu);
  select.addEventListener('change',function(){sync(select,wrap)});
  sync(select,wrap);
}

function enhanceAll(){
  addStyle();
  var root=document.getElementById(ROOT_ID);if(!root)return;
  root.querySelectorAll('select.scr-select[data-scr-filter]').forEach(enhance);
  root.querySelectorAll('select.scr-select[data-scr-filter]').forEach(function(select){
    var wrap=select.nextElementSibling;if(wrap&&wrap.classList.contains(WRAP))sync(select,wrap);
  });
}

document.addEventListener('click',function(e){
  if(!e.target.closest('.'+WRAP))closeAll();
  if(e.target.closest('[data-scr-clear]'))setTimeout(enhanceAll,0);
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll()});

var observer=new MutationObserver(function(mutations){
  var relevant=false;
  for(var i=0;i<mutations.length;i++){
    if(mutations[i].addedNodes&&mutations[i].addedNodes.length){relevant=true;break}
  }
  if(relevant)setTimeout(enhanceAll,0);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceAll);else enhanceAll();
})();

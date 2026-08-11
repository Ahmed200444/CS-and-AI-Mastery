(function(){
'use strict';
var warmed=false;
function preconnect(){if(document.querySelector('link[data-csai-runner-preconnect]'))return;var link=document.createElement('link');link.rel='preconnect';link.href='https://cdn.jsdelivr.net';link.crossOrigin='anonymous';link.setAttribute('data-csai-runner-preconnect','1');document.head.appendChild(link);}
function warm(){if(warmed)return;var runner=window.CSAIPythonRunner;if(!runner||typeof runner.prewarm!=='function')return;warmed=true;runner.prewarm();document.documentElement.setAttribute('data-csai-python-prewarm','intent');}
function relevant(target){return !!(target&&target.closest&&target.closest('[data-study-run],.csai-study-code,[data-adaptive-run="python"],[data-adaptive-code]'));}
function boot(){preconnect();document.addEventListener('pointerover',function(event){if(relevant(event.target))warm();},{passive:true,capture:true});document.addEventListener('focusin',function(event){if(relevant(event.target))warm();},true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

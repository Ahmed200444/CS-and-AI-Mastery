(function(){
'use strict';
var PYTHON_IDS=['python','dsa','problem-solving','oop','debugging','testing','algorithms','data-structures','systems-programming','embedded-systems','advanced-computer-organization'];
var warmed=false,timer=0;
function meta(){try{var n=document.getElementById('course-page-meta');return n?JSON.parse(n.textContent||'{}'):{};}catch(e){return{};}}
function courseId(){var m=meta();return String(m.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();}
function pythonCourse(){return PYTHON_IDS.indexOf(courseId())>=0;}
function preconnect(){if(!document.querySelector('link[data-csai-runner-preconnect]')){var l=document.createElement('link');l.rel='preconnect';l.href='https://cdn.jsdelivr.net';l.crossOrigin='anonymous';l.setAttribute('data-csai-runner-preconnect','1');document.head.appendChild(l);}}
function warmPython(){if(warmed||!pythonCourse())return false;if(window.CSAIPythonRunner&&typeof window.CSAIPythonRunner.prewarm==='function'){warmed=true;window.CSAIPythonRunner.prewarm();document.documentElement.setAttribute('data-csai-python-prewarm','started');return true;}var tab=document.querySelector('[data-adaptive-run="python"],[data-adaptive-code]');if(!tab)return false;warmed=true;try{tab.dispatchEvent(new Event('pointerover',{bubbles:true}));}catch(e){}document.documentElement.setAttribute('data-csai-python-prewarm','started');return true;}
function schedule(){preconnect();if(!pythonCourse())return;var run=function(){if(!warmPython()){clearTimeout(timer);timer=setTimeout(run,160);}};if('requestIdleCallback' in window)window.requestIdleCallback(run,{timeout:700});else timer=setTimeout(run,180);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();window.addEventListener('pagehide',function(){clearTimeout(timer);});
})();

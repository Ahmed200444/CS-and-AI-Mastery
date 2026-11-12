(function(){
'use strict';
// Lesson videos v1 — curated YouTube videos for every course, shown inside each lesson.
// Links only: nothing is downloaded or re-hosted. Videos open on YouTube; "Play here" is offered only in
// browsers that support credentialless iframes (needed because this site uses cross-origin isolation for
// the in-browser Python runner). Reads the page, writes no learner data.
if(window.__csaiLessonVideosV1)return;window.__csaiLessonVideosV1=true;
var DATA={"docker":[["3c-iBn73dDE","Docker Tutorial for Beginners [FULL COURSE in 3 Hours]"],["fqMOX6JJhGo","Docker Tutorial for Beginners - A Full DevOps Course on How to Run Applications in Containers"],["GFgJkfScVNU","Learn Docker in 1 Hour | Full Docker Course for Beginners"]],"python":[["rfscVS0vtbw","Learn Python - Full Course for Beginners [Tutorial]"],["H2EJuAcrZYU","Python Full Course for Beginners | Complete All-in-One Tutorial | 9 Hours"],["eWRfhZUzrAc","Python for Beginners – Full Course [Programming Tutorial]"],["ix9cRaBkVe0","Python Full Course for free"],["ZDa-Z5JzLYM","Python OOP Tutorial 1: Classes and Instances"],["IbMDCwVm63M","Python Object Oriented Programming Full Course"]],"sql":[["HXV3zeQKqGY","SQL Tutorial - Full Database Course for Beginners"],["7S_tz1z_5bA","SQL Course for Beginners [Full Course]"],["NTgejLheGeU","SQL Tutorial for Beginners [Ultimate Full Course] - From Zero to HERO"]],"dsa":[["8hly31xKli0","Algorithms and Data Structures Tutorial - Full Course for Beginners"],["pkYVOmU3MgA","Data Structures and Algorithms in Python - Full Course for Beginners"],["CBYHwZcbD-s","Data Structures and Algorithms Full Course"]],"cpp-dsa":[["vLnPwxZdW4Y","C++ Tutorial for Beginners - Full Course"],["-TkoO8Z07hI","C++ Full Course for free"],["GQp1zzTwrIg","C++ FULL COURSE For Beginners (Learn C++ in 10 hours)"],["8hly31xKli0","Algorithms and Data Structures Tutorial - Full Course for Beginners"]],"git":[["vA5TTz6BXhY","Git & GitHub Crash Course 2025"],["i76ts_0UryI","The Ultimate Git & GitHub Crash Course - Learn to Version Control for Beginners"],["h1fU01_eE_Q","~3 HOUR Git & GitHub Course for Beginners (Windows, Linux, or Mac)"]],"linux":[["ZtqBQ68cfJc","The 50 Most Popular Linux & Terminal Commands - Full Course for Beginners"],["iwolPf6kN-k","Introduction to Linux & Terminal Commands - Full Course for Beginners"],["mABpAI-pCw0","Command Line Basics for Beginners - Full Course"]],"databases":[["26ls5lNiijk","Relational Database Design – Full Course"],["HXV3zeQKqGY","SQL Tutorial - Full Database Course for Beginners"],["jOSzuof1A4s","Database Design and Management - Full Course"]],"apis":[["WXsD0ZgxjRw","APIs for Beginners - How to use an API (Full Course / Tutorial)"],["_IC6wEt6KRc","Full Backend Development For Beginners - Project Based Course [10+ Hours]"],["Wz-zOpzk1Jk","Become a Backend Developer in 3 Hours - Beginner To Advanced"]],"backend":[["_IC6wEt6KRc","Full Backend Development For Beginners - Project Based Course [10+ Hours]"],["9BD9eK9VqXA","Backend Full Course | NodeJS ExpressJS PostgreSQL Prisma & Docker"],["Wz-zOpzk1Jk","Become a Backend Developer in 3 Hours - Beginner To Advanced"]],"kubernetes":[["_4uQI4ihGVU","Learn Kubernetes in 6 Hours – Full Course with Real-World Project"],["JB3bP1RXqYo","Kubernetes Tutorial For Beginners [Full Course From KubeAcademy]"],["lXqqhyCPWC0","Kubernetes Tutorial for Beginners"]],"cicd":[["bnzuS2R8gck","GitHub Actions Tutorial for Beginners: CI/CD Made Easy!"],["0PbxpIao_EU","GitHub Actions Tutorial for Beginners"],["G3z0s7OdzFQ","Mastering GitHub Actions CI/CD"]],"cloud-computing":[["EN4fEbcFZ_E","Cloud Computing Full Course"],["SqqDCV_muIE","Cloud Computing Full Course 2025"]],"networking":[["qiQR5rTSshw","Computer Networking Course - Network Engineering [CompTIA Network+ Exam Prep]"],["IPvYjXCsTg8","Computer Networking Full Course - OSI Model Deep Dive with Real Life Examples"],["JPYzd2gaoyk","Learn Computer Networking for Beginners - Full Course"]],"system-design":[["o_ldk1_jzqQ","5-Hour System Design Course: Complete Foundations for Interviews"],["Ru54dxzCyD0","How to Prepare for System Design Interviews w/ Meta Staff Engineer"],["oz5c88cO5P8","System Design Interview Prep for Beginners (Full Course)"]],"testing":[["L6N3BgZh2AA","Unit Testing in Python with pytest"],["tHu-QLJDhdA","Python Unit Testing for Beginners"],["IVrGz8w0H8c","Python unit testing - pytest fixtures"]],"comparch-os":[["yK1uBHPdp30","Operating Systems Course for Beginners"],["dOiA2nNJpc0","Introduction to Operating System | Full Course for Beginners"],["pdELBTmufQY","Learn Operating System - Full Course for Beginners"]],"ai-ml":[["i_LwzRVP7bg","Machine Learning for Everybody – Full Course"],["hDKCxebp88A","Machine Learning with Python and Scikit-Learn"]],"deep-learning":[["dPWYUELwIdM","How Deep Neural Networks Work - Full Course for Beginners"],["p4n0cJzqyTA","Neural Networks Explained: From Perceptrons to Backpropagation"],["V_xro1bcAuA","PyTorch for Deep Learning & Machine Learning – Full Course"]],"transformers":[["KJtZARuO3JY","Visualizing transformers and attention"],["bCz4OMemCcA","Attention is all you need (Transformer) - Model explanation (including math), Inference and Training"],["fjJOgb-E41w","Attention mechanism: Overview"]],"llms":[["LPZh9BOjkQs","Large Language Models explained briefly"],["zjkBMFhNj_g","[1hr Talk] Intro to Large Language Models"],["o3CieQj3BsQ","Large Language Models: A short introduction to the core concepts of transformers and LLM training"]],"ai-agents":[["OhI005_aJkA","Full Course (Lessons 1-10) AI Agents for Beginners"],["rV3HJ4LEZ7k","Complete Agentic AI Course In 10 Hours - Langchain, Langgraph, RAG, Guardrails, Evals"],["MnG0ugK2JAI","Build Your Own AI Agent"]],"rag":[["sVcwVQRHIc8","Learn RAG From Scratch"],["qN_2fnOPY-M","Local Retrieval Augmented Generation (RAG) from Scratch (step by step tutorial)"],["vT-DpLvf29Q","Complete RAG Tutorial 2026 (Free Labs)"]],"pytorch":[["V_xro1bcAuA","PyTorch for Deep Learning & Machine Learning – Full Course"],["GIsg-ZUy0MY","PyTorch for Deep Learning - Full Course / Tutorial"],["IFsVsXAqPto","Deep Learning with PyTorch Full Course | Master PyTorch, Tensors, and Neural Networks"]],"tensorflow":[["tpCFfeUEGs8","Learn TensorFlow and Deep Learning fundamentals with Python (code-first introduction)"],["gWvwu7qLjJs","TensorFlow Crash Course for Beginners (2026)"],["cPmjQ9V6Hbk","TensorFlow 2 and Python for computer vision - complete course"]],"huggingface":[["QEaBAZQCtwE","Getting Started With Hugging Face in 15 Minutes"],["GSt00_-0ncQ","HuggingFace Crash Course - Sentiment Analysis, Model Hub, Fine Tuning"],["rZ4fTIoWInQ","Getting Started with Hugging Face Transformers in Python"]],"nlp":[["xrtn9j-fJdk","ENTIRE Natural Language Processing CRASH COURSE in 45 MINS!"],["G6wdZQw4d8Y","Natural Language Processing - in 30 minutes"],["9LOyEYJsy6k","NLP full course: fundamentals, NLTK, spaCy, embeddings and transformers"]],"computer-vision":[["oXlwWbU8l2o","OpenCV Course - Full Tutorial with Python"],["eDIj5LuIL4A","OpenCV tutorial for beginners"],["P4Z8_qe2Cu0","OpenCV Python Course - Learn Computer Vision and AI"]],"generative-ai":[["nJ25yl34Uqw","GenAI Essentials – Full Course for Beginners"],["LPZh9BOjkQs","Large Language Models explained briefly"],["kmGJpgL1oNo","Generative AI Course For Beginners 2026"]],"diffusion":[["UYVObn1HUeU","Diffusion Models explained"],["fbJac4qQy04","Diffusion Models Explained with Math From Scratch"],["ZBKpAp_6TGI","Coding Stable Diffusion from scratch in PyTorch"]],"gans":[["Sw9r8CL98N0","Generative Adversarial Networks (GANs) - Computerphile"],["RAa55G-oEuk","Understanding GANs (Generative Adversarial Networks)"],["TpMIssRdhco","What are GANs (Generative Adversarial Networks)?"]],"vaes":[["9zKuYvjFFS8","Variational Autoencoders"],["geH5HnRapRs","Variational Autoencoder - Explained"],["h9kWaQQloPk","Variational Autoencoder - VISUALLY EXPLAINED!"]],"data-science":[["CMEWVn1uZpQ","Learn Python for Data Science – Full Course for Beginners"],["r-uOLxNrNk8","Data Analysis with Python - Full Course for Beginners (Numpy, Pandas, Matplotlib, Seaborn)"],["LHBE6Q9XlzI","Python for Data Science - Course for Beginners (Learn Python, Pandas, NumPy, Matplotlib)"]],"practical-math-ml":[["fNk_zzaMoSs","Vectors | Chapter 1, Essence of linear algebra"],["HZGCoVF3YvM","Bayes theorem, the geometry of changing beliefs"],["IHZwWFHWa-w","Gradient descent, how neural networks learn | Deep Learning Chapter 2"]],"data-engineering":[["PHsC_t0j1dU","Data Engineering Course for Beginners"],["_q--EfWGISQ","Building Data Pipelines Using Python Tutorial"],["XMmfJFS_MFQ","Python for Data Engineers Full Course 2026 | Basics to Advanced"]],"mlops":[["-dJPoLm_gtE","MLOps Course"],["w71RHxAWxaM","Ultimate MLOps Full Course in One Video"],["tVskbekONlw","Learn MLOps with MLflow and Databricks – Full Course for Machine Learning Engineers"]],"reinforcement-learning-post-training":[["VnpRp7ZglfA","The FASTEST introduction to Reinforcement Learning on the internet"],["Mut_u40Sqz4","Reinforcement Learning in 3 Hours"],["ELE2_Mftqoc","Reinforcement Learning Course - Full Machine Learning Tutorial"]],"classical-ai":[["WbzNRTTrX0g","Search - Lecture 0 - CS50's Introduction to Artificial Intelligence with Python 2020"],["TA5ZJm1ZYS4","Optimization - Lecture 3 - CS50's Introduction to Artificial Intelligence with Python 2020"],["eey91kzfOZs","CS50 2020 - Artificial Intelligence"]],"llm-evaluation-testing":[["KeCXEegca-w","How to Evaluate LLMs: Concepts, Architecture, and Tools"],["RIGU1hy3UR8","How to evaluate an LLM application"],["HAoKJT3af7Y","Evaluate LLMs in Python with DeepEval"]],"secure-ai-applications":[["jZXvqEqJT7o","How to secure your AI Agents: A Technical Deep-dive"],["giGBj3JKHEU","What is prompt injection? Example attacks, defenses and testing"],["yTUaOiCaHLY","OWASP LLM01:2025 Prompt Injection Explained - Attacks, Examples, and Defenses"]],"large-scale-ai":[["toUSzwR0EV8","Distributed Training with PyTorch: complete tutorial with cloud infrastructure and code"],["lXhB486NWzM","Distributed Training Deep Dive in 3 Hours"],["qZBibWYcKH4","How AI Models Scale Beyond a Single GPU Across LLM Workloads"],["1lbBrTqUTqE","Distributed Inference with Multi Machine & Multi GPU Setup: Deploying Large Models via vLLM & Ray"]],"prompt-engineering":[["_ZvnD73m40o","Prompt Engineering Tutorial"],["LWiMwhDZ9as","Learn Prompt Engineering: Full Beginner Crash Course (5 HOURS!)"],["JVlPwLo_9ok","Prompt Engineering Full Course in One Video - Few-Shot, Temperature, Hallucinations, & More"]],"cybersecurity":[["U_P23SqJaDc","Cyber Security Full Course for Beginner"],["t52oGu-kGTM","Cybersecurity Full Course for Beginners"],["dRKodDrMZJ0","Cyber Security Full Course 2025"]],"distributed-systems":[["cQP8WApzIQQ","Lecture 1: Introduction - MIT 6.824 Distributed Systems (Spring 2020)"],["QrL4RMQPmK0","Distributed systems course. Lecture 1: Introduction"],["Sa_gJwB55jY","Distributed Systems Design Introduction (Concepts & Challenges)"]],"software-architecture":[["UsNl8kcU4UA","SOLID Design Principles | Complete Guide with Code Examples"],["pTB30aXS77U","Uncle Bob's SOLID Principles Made Easy - In Python!"],["LIgKa1X7FbE","5-Hour Microservices Course: Complete Architecture Patterns for Interviews (47 Patterns)"],["exJ8oLnq4dM","Architectural Patterns"]],"observability":[["L-dDeZjZUiA","Prometheus and Grafana for Monitoring and Observability - For Beginners"],["xM5Ys0rbtVQ","Prometheus Monitoring With Grafana Tutorial For Beginners"],["Au8RifPLhsw","Observability Top 3 Key Metrics - RED Method with Grafana & Prometheus PromQL"]],"digital-hardware":[["8bmt4UJmJ_k","Digital Logic Design Full Course for Beginners"],["jBcFKHG1hBU","Digital Design & Comp Arch - Lecture 12: Pipelining (Spring 2023)"],["yuF1d3j4G84","Computer Architecture - Lecture 2: Fundamentals, Memory Hierarchy, Caches (ETH Zürich, Fall 2017)"]],"embedded-systems":[["3V9eqvkMzHA","#0 Modern Embedded Systems Programming: Getting Started"],["F8cM8e6_fw4","Practical Embedded Computing - A Beginner's Guide To ARM Microcontrollers"],["sGptGOOGH2E","Embedded Systems: Inside a Microcontroller"],["LIJ_G-LU_Qg","STM32 Full Course for Beginners | CubeIDE, UART, ADC, I2C, SPI, Timers, LCD, SD Card"]],"advanced-computer-organization":[["yuF1d3j4G84","Computer Architecture - Lecture 2: Fundamentals, Memory Hierarchy, Caches (ETH Zürich, Fall 2017)"],["jBcFKHG1hBU","Digital Design & Comp Arch - Lecture 12: Pipelining (Spring 2023)"],["BGaLNhyr-2Q","Computer Architecture - Lecture 32: Cache Design and Management (Fall 2023)"],["Ig_PgDAy2I8","CPU Clock Speed, Cores, Cache Memory, Pipelining, Von-Neumann, Harvard (5-minute tutorial)"]],"frontend-dev":[["zJSY8tbf_ys","Frontend Web Development Bootcamp Course (JavaScript, HTML, CSS)"],["c4n0CjXuZAY","Frontend development in 90 minutes"],["kUJPZbUPqro","Front End Web Development Full Course [22 Hours]"]],"web-dev":[["nu_pCVPKzTk","Full Stack Web Development for Beginners (Full Course on HTML, CSS, JavaScript, Node.js, MongoDB)"],["zJSY8tbf_ys","Frontend Web Development Bootcamp Course (JavaScript, HTML, CSS)"],["_IC6wEt6KRc","Full Backend Development For Beginners - Project Based Course [10+ Hours]"]],"interview-prep":[["7UlslIXHNsw","How to Prepare for Technical Interviews, Part 1 - Coding"],["2nVFdxJJdLw","How To Prepare For Coding Interviews Efficiently"],["ybyjhWDr6w4","How to Prepare FAST for Coding Interviews"]],"company-prep":[["7UlslIXHNsw","How to Prepare for Technical Interviews, Part 1 - Coding"],["Ru54dxzCyD0","How to Prepare for System Design Interviews w/ Meta Staff Engineer"],["wVM75kHbV6c","Software Engineering Interview Prep guide"]],"resume-prep":[["ciIkiWwZnlc","How to Write a Great Software Engineer Resume"],["aKjsy-b00QM","The Resume That Got Me Into Google (software engineer resume tips)"],["i43Wr35UYNU","How to Write a Resume For Software Engineering Roles!"]],"debugging":[["DQEVZ5efnO0","Be a Better Programmer By Mastering Debugging"],["NUrV_FbJqWs","How To Debug Like a Pro - From Beginner To Expert"],["WHmapcIjCTQ","Debugging Methods Explained: Guide for all Software Engineers"]],"oop":[["ZDa-Z5JzLYM","Python OOP Tutorial 1: Classes and Instances"],["-pEs-Bss8Wc","Object Oriented Programming (OOP) In Python - Beginner Crash Course"],["IbMDCwVm63M","Python Object Oriented Programming Full Course"]],"influencing-without-authority":[["sudG0QMt1xU","How To Influence People Who Don't Report To You"],["aTStHESmSwI","How Engineers Can Build Influence Without a Leadership Title"],["KFKIAfZ86vY","How to Build Influence Without Authority: 3 Key Tips"]],"software-engineering-practice":[["d9_fweNDjKw","Better Code Reviews in 6 SIMPLE STEPS"],["KRDoN-ZkDdk","5 Easy Principles for ALWAYS Writing Clean Code"],["HcijbAI4eB0","3 Tips To Write Clean Code (from an ex-Google software engineer)"],["rii6QRX8ZLs","Coding Best Practices With Examples"]],"problem-solving":[["8hly31xKli0","Algorithms and Data Structures Tutorial - Full Course for Beginners"],["2nVFdxJJdLw","How To Prepare For Coding Interviews Efficiently"],["DQEVZ5efnO0","Be a Better Programmer By Mastering Debugging"]],"systems-programming":[["yK1uBHPdp30","Operating Systems Course for Beginners"],["dOiA2nNJpc0","Introduction to Operating System | Full Course for Beginners"],["iwolPf6kN-k","Introduction to Linux & Terminal Commands - Full Course for Beginners"]],"ai-system-design":[["o_ldk1_jzqQ","5-Hour System Design Course: Complete Foundations for Interviews"],["-dJPoLm_gtE","MLOps Course"],["sVcwVQRHIc8","Learn RAG From Scratch"]],"deployment":[["3c-iBn73dDE","Docker Tutorial for Beginners [FULL COURSE in 3 Hours]"],["-dJPoLm_gtE","MLOps Course"],["bnzuS2R8gck","GitHub Actions Tutorial for Beginners: CI/CD Made Easy!"]],"capstone":[["i76ts_0UryI","The Ultimate Git & GitHub Crash Course - Learn to Version Control for Beginners"],["_IC6wEt6KRc","Full Backend Development For Beginners - Project Based Course [10+ Hours]"],["ciIkiWwZnlc","How to Write a Great Software Engineer Resume"]]};
var STOP={the:1,and:1,for:1,with:1,from:1,into:1,your:1,how:1,what:1,why:1,when:1,are:1,you:1,this:1,that:1,full:1,course:1,tutorial:1,beginners:1,beginner:1,complete:1,learn:1,introduction:1,intro:1,basics:1,basic:1,part:1,lecture:1,hours:1,hour:1,free:1,guide:1,explained:1,using:1,use:1,practice:1,foundations:1,depth:1,advanced:1,crash:1,tips:1,best:1,easy:1,made:1,all:1,one:1,get:1,not:1,its:1,can:1,more:1,real:1,world:1,step:1,simple:1,deep:1,dive:1,project:1,projects:1,based:1,first:1,build:1,building:1,code:1,coding:1,programming:1,development:1,software:1,engineering:1,engineer:1,engineers:1,systems:1,system:1,data:1,model:1,models:1};
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn()}
function $(s,r){return (r||document).querySelector(s)}
function $all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function courseId(){
  var b=document.body&&document.body.getAttribute('data-course-id');
  var id=b||(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
  if(!DATA[id]&&window.__csaiCourseId)id=String(window.__csaiCourseId);
  return id.toLowerCase();
}
function tokens(s){
  var out={},m=String(s||'').toLowerCase().replace(/c\+\+/g,'cpp').match(/[a-z0-9]{3,}/g)||[];
  m.forEach(function(t){if(!STOP[t])out[t.replace(/(ing|es|s)$/,'')]=1});
  return out;
}
function pick(list,lessonTitle,courseTokens){
  var lt=tokens(lessonTitle),best=0,bestScore=0;
  list.forEach(function(v,i){
    var vt=tokens(v[1]),score=0;
    for(var k in lt){if(lt.hasOwnProperty(k)&&vt[k]&&!courseTokens[k])score++}
    if(score>bestScore){bestScore=score;best=i}
  });
  return {index:best,matched:bestScore>0};
}
var canInline=false;
try{canInline='credentialless' in HTMLIFrameElement.prototype}catch(e){}
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function link(href,text,cls){var a=el('a',cls,text);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a}
function watchUrl(id){return 'https://www.youtube.com/watch?v='+encodeURIComponent(id)}
function searchUrl(q){return 'https://www.youtube.com/results?search_query='+encodeURIComponent(q)}
function thumb(id,title){
  var b=el('a','lv-thumb');b.href=watchUrl(id);b.target='_blank';b.rel='noopener noreferrer';b.setAttribute('aria-label','Watch on YouTube: '+title);
  var img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';img.width=320;img.height=180;
  img.referrerPolicy='no-referrer';img.src='https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/mqdefault.jpg';
  img.addEventListener('error',function(){b.classList.add('lv-noimg')});
  b.appendChild(img);b.appendChild(el('span','lv-play','▶'));return b;
}
function playInline(card,id,title){
  var frame=$('.lv-frame',card);
  if(frame){frame.parentNode.removeChild(frame);return false}
  frame=el('div','lv-frame');
  var f=document.createElement('iframe');
  f.setAttribute('credentialless','');f.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
  f.setAttribute('allowfullscreen','');f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');f.title=title;
  f.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0';
  frame.appendChild(f);card.appendChild(frame);return true;
}
function videoRow(v,opts){
  var row=el('div','lv-row');row.appendChild(thumb(v[0],v[1]));
  var body=el('div','lv-body');
  if(opts&&opts.kicker)body.appendChild(el('div','lv-kicker',opts.kicker));
  body.appendChild(el('div','lv-title',v[1]));
  var acts=el('div','lv-actions');
  if(canInline){
    var btn=el('button','lv-btn lv-primary','Play here');btn.type='button';
    btn.addEventListener('click',function(){var open=playInline(row.parentNode,v[0],v[1]);btn.textContent=open?'Close player':'Play here'});
    acts.appendChild(btn);
    acts.appendChild(link(watchUrl(v[0]),'Watch on YouTube ↗','lv-btn'));
  }else{
    acts.appendChild(link(watchUrl(v[0]),'Watch on YouTube ↗','lv-btn lv-primary'));
  }
  if(opts&&opts.more)acts.appendChild(link(opts.more,'More videos on this topic ↗','lv-btn lv-ghost'));
  body.appendChild(acts);row.appendChild(body);return row;
}
function lessonTitle(d){var t=$('summary .title',d);return (t?t.textContent:'').replace(/\s+/g,' ').trim()}
function courseTitle(){var h=$('main.wrap .hero h1');return (h?h.textContent:document.title).replace(/[^\x20-\x7E]/g,' ').replace(/\s+/g,' ').trim()}
function addLessonCard(d,list,cTitle,cTokens){
  if(d.getAttribute('data-lv')==='1')return;
  var body=$('.body',d);if(!body)return;
  d.setAttribute('data-lv','1');
  var title=lessonTitle(d),p=pick(list,title,cTokens),v=list[p.index];
  var card=el('section','lv-card');card.setAttribute('aria-label','Video for this lesson');
  card.setAttribute('data-lv-match',p.matched?'lesson':'course');
  card.appendChild(videoRow(v,{kicker:p.matched?'Watch · picked for this lesson':'Watch · course video',more:searchUrl(cTitle+' '+title)}));
  card.appendChild(el('p','lv-note','External video hosted on YouTube. It is a companion to this lesson, not part of the course itself.'));
  var anchor=$('.csai-lesson-question',body);
  if(anchor&&anchor.parentNode===body)body.insertBefore(card,anchor.nextSibling);else body.insertBefore(card,body.firstChild);
}
function addCourseList(list){
  var hero=$('main.wrap .hero');if(!hero||$('.lv-course',hero))return;
  var box=el('details','lv-course');var sum=el('summary',null,'Course videos ('+list.length+')');box.appendChild(sum);
  var wrap=el('div','lv-course-list');
  list.forEach(function(v){var c=el('div','lv-card lv-mini');c.appendChild(videoRow(v,null));wrap.appendChild(c)});
  box.appendChild(wrap);hero.appendChild(box);
}
function addStyle(){
  if(document.getElementById('lv-style'))return;
  var s=document.createElement('style');s.id='lv-style';
  s.textContent=
'.lv-card{margin:14px 0;padding:14px;border:1px solid var(--border,#d8e1ea);border-radius:14px;background:var(--panel,#fff);color:var(--text,#172231);min-width:0}'+
'.lv-row{display:flex;gap:14px;align-items:flex-start;min-width:0}'+
'.lv-thumb{position:relative;flex:0 0 200px;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#6253e8,#3d6fe2);display:block}'+
'.lv-thumb img{width:100%;height:100%;object-fit:cover;display:block}.lv-thumb.lv-noimg img{display:none}'+
'.lv-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(15,18,40,.72);color:#fff;font-size:15px;padding-left:3px;box-sizing:border-box;transition:transform .18s}'+
'.lv-thumb:hover .lv-play{transform:translate(-50%,-50%) scale(1.1)}'+
'.lv-body{min-width:0;flex:1 1 auto}'+
'.lv-kicker{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--accent,#5850e0);margin-bottom:4px}'+
'.lv-title{font-weight:750;line-height:1.35;overflow-wrap:anywhere}'+
'.lv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'+
'.lv-btn{display:inline-flex;align-items:center;min-height:38px;padding:7px 12px;border-radius:10px;border:1px solid var(--border,#d8e1ea);background:var(--panel,#fff);color:var(--text,#172231);font:inherit;font-size:.84rem;font-weight:750;text-decoration:none;cursor:pointer}'+
'.lv-btn:hover{border-color:#6253e8}'+
'.lv-btn.lv-primary{background:linear-gradient(135deg,#6253e8,#3d6fe2);border-color:transparent;color:#fff}'+
'.lv-btn.lv-ghost{border-style:dashed}'+
'.lv-note{margin:10px 0 0;font-size:.76rem;color:var(--muted,#5d6c7c)}'+
'.lv-frame{position:relative;margin-top:12px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000}'+
'.lv-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'+
'.lv-course{margin-top:14px;border:1px solid var(--border,#d8e1ea);border-radius:12px;background:var(--panel,#fff)}'+
'.lv-course>summary{cursor:pointer;padding:11px 14px;font-weight:800;font-size:.92rem}'+
'.lv-course-list{padding:0 12px 12px;display:grid;gap:10px}'+
'.lv-mini{margin:0;padding:10px}.lv-mini .lv-thumb{flex-basis:132px}'+
'@media(max-width:560px){.lv-row{flex-direction:column}.lv-thumb,.lv-mini .lv-thumb{flex:0 0 auto;width:100%}.lv-btn{flex:1 1 auto;justify-content:center}}';
  document.head.appendChild(s);
}
ready(function(){
  try{
    var lessons=$all('details.lesson');if(!$('main.wrap')||!lessons.length)return;
    var list=DATA[courseId()];if(!list||!list.length)return;
    addStyle();
    var cTitle=courseTitle(),cTokens=tokens(cTitle);
    addCourseList(list);
    lessons.forEach(function(d){
      if(d.open)addLessonCard(d,list,cTitle,cTokens);
      d.addEventListener('toggle',function(){if(d.open)addLessonCard(d,list,cTitle,cTokens)});
    });
  }catch(e){}
});
})();

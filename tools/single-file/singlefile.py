import re,os,json,base64,sys,glob
root=sys.argv[1]; out=sys.argv[2]
rd0=lambda p:open(os.path.join(root,p),encoding='utf8').read()
RT=[('/runtime/pyodide/',os.environ.get('CSAI_PYODIDE_BASE','https://cdn.jsdelivr.net/pyodide/v0.26.2/full/')),
    ('/runtime/sql/',os.environ.get('CSAI_SQL_BASE','https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/')),
    ('/runtime/cpp/',os.environ.get('CSAI_CPP_BASE','https://cdn.jsdelivr.net/gh/felixhao28/JSCPP@76e3534f04abf9c2547aa73ddca275e8935bed38/dist/'))]
def patch(code):
    # Language engines are normally served from /runtime/*; a standalone file loads them from the public CDNs instead.
    for a,b in RT: code=code.replace(a,b)
    code=code.replace('location.assign(','__csaiNav(')
    code=re.sub(r"location\.href=((?:'/?courses/'|\"/?courses/\")\+encodeURIComponent\([^)]*\)\+'\.html')",r"__csaiNav(\1)",code)
    code=code.replace("new URL('python-terminal-worker.js',script.src).href","'../assets/python-terminal-worker.js'")
    return code
rd=lambda p:patch(rd0(p)) if (p.endswith('.js') or p=='index.html') else rd0(p)
def clean(src): return src.split('?')[0].split('#')[0].lstrip('/')
def esc(js): return re.sub(r'</(script)',r'<\\/\1',js,flags=re.I)
J=lambda o:json.dumps(o,separators=(',',':'),ensure_ascii=False)
h=rd('index.html')
MODS=['full-track-lessons','dsa-complete-course','course-knowledge-checks','internship-focus','course-learning-tools','course-metadata-panel','github-integration']
data={}
for f in sorted(os.listdir(os.path.join(root,'assets/course-data'))): data['assets/course-data/'+f]=rd0('assets/course-data/'+f)
for f in ('assets/catalog-data.json','assets/learning-quality.json'): data[f]=rd0(f)
mods={'./%s.js'%m:rd('assets/%s.js'%m) for m in MODS}
pages={};A={}
for f in sorted(glob.glob(os.path.join(root,'courses/*.html'))):
    cid=os.path.basename(f)[:-5]; ph=rd0('courses/'+cid+'.html'); pages[cid]=patch(ph)
    for m in re.findall(r'<script[^>]*\bsrc=["\']([^"\']+)',ph)+re.findall(r'<link[^>]*\bhref=["\']([^"\']+\.css)',ph):
        k=m.split('?')[0].replace('../','').lstrip('/')
        if k.startswith('assets/') and k not in A and os.path.exists(os.path.join(root,k)): A[k]=rd(k)
pre='<script>'+open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'rt.js')).read().replace('__DATA__',esc(J(data))).replace('__MODS__',esc(J(mods))).replace('__PAGES__',esc(J(pages))).replace('__ASSETS__',esc(J(A)))+'</script>'
deferred=[]
def script_sub(m):
    attrs=m.group(1); src=re.search(r'\bsrc=["\']([^"\']+)',attrs)
    if not src or re.match(r'https?:',src.group(1)): return m.group(0)
    f=clean(src.group(1)); code=rd(f)
    if f.endswith('course-practice-routing.js'):
        assert code.count('import(name)')==1; code=code.replace('import(name)','__csaiImport(name)')
    typ='type="module"' if re.search(r'type=["\']module',attrs) else ''
    new='<script %s data-src="%s">%s</script>'%(typ,f,esc(code))
    if re.search(r'\bdefer\b',attrs) or typ: deferred.append(new); return ''
    return new
h=re.sub(r'<script([^>]*)>\s*</script>',script_sub,h,flags=re.I)
def css_sub(m):
    tag=m.group(0)
    if 'stylesheet' not in tag: return tag
    href=clean(re.search(r'href=["\']([^"\']+)',tag).group(1)); return '<style data-src="%s">%s</style>'%(href,rd0(href))
h=re.sub(r'<link[^>]*>',css_sub,h)
h=h.replace('<link href="manifest.webmanifest" rel="manifest"/>','')
ico='data:image/svg+xml;base64,'+base64.b64encode(open(os.path.join(root,'icon.svg'),'rb').read()).decode()
h=h.replace('<link href="icon.svg" rel="apple-touch-icon"/>','<link rel="icon" href="%s"/>'%ico)
i=h.lower().index('<head>')+6; h=h[:i]+pre+h[i:]
j=h.lower().rindex('</body>'); h=h[:j]+''.join(deferred)+h[j:]
open(out,'w',encoding='utf8').write(h)
print(len(h)//1024,'KB;',len(pages),'pages;',len(A),'assets;',len(deferred),'deferred')

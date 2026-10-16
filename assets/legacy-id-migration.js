/* One-time migration: lesson/exercise ids that used an older prefix are renamed to the "core-" prefix.
   Rewrites saved progress, resume points and logs in this browser so nothing is lost. Runs once. */
(function(){
  try{
    var FLAG='csai-core-id-migration-v1',OLD='apt'+'ech-',NEW='core-';
    if(localStorage.getItem(FLAG))return;
    var keys=[],i;
    for(i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
    keys.forEach(function(k){
      var v=localStorage.getItem(k);
      if(v===null)return;
      var nv=v.indexOf(OLD)>-1?v.split(OLD).join(NEW):v;
      if(k.indexOf(OLD)>-1){
        var nk=k.split(OLD).join(NEW);
        if(localStorage.getItem(nk)===null)localStorage.setItem(nk,nv);
        localStorage.removeItem(k);
      }else if(nv!==v){
        localStorage.setItem(k,nv);
      }
    });
    localStorage.setItem(FLAG,'1');
  }catch(e){}
})();

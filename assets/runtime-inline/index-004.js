
window.cxSkipToMain = function(){
  var views = document.querySelectorAll('.app, .hub');
  for(var i=0;i<views.length;i++){
    var el = views[i];
    if(getComputedStyle(el).display !== 'none'){ el.setAttribute('tabindex','-1'); el.focus(); return; }
  }
};

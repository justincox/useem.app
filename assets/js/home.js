(function(){
  var cluster=document.getElementById('cluster'),ticker=document.getElementById('ticker'),hero=document.getElementById('top');
  var chips=[].slice.call(ticker.querySelectorAll('.chip'));
  var n=chips.length,cur=0,elapsed=0,last=performance.now(),holdUntil=0,paused=false;
  var DUR=3200,HOLD=6000;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(i){
    cur=i;elapsed=0;
    [].forEach.call(cluster.querySelectorAll('.slide'),function(s){s.classList.toggle('on',+s.getAttribute('data-i')===i)});
    chips.forEach(function(c,k){c.setAttribute('aria-pressed',k===i?'true':'false');c.style.removeProperty('--p')});
    var c=chips[i];if(ticker.scrollWidth>ticker.clientWidth){ticker.scrollTo({left:c.offsetLeft-24,behavior:'smooth'})}
  }
  function frame(t){
    var dt=Math.min(t-last,100);last=t;
    if(!reduce&&!paused&&!document.hidden&&t>=holdUntil){
      elapsed+=dt;
      if(elapsed>=DUR){show((cur+1)%n)}
    }
    var p=Math.min(elapsed/DUR,1);
    chips[cur].style.setProperty('--p',p.toFixed(4));
    hero.style.setProperty('--g',((cur+p)/n).toFixed(4));
    requestAnimationFrame(frame);
  }
  chips.forEach(function(c){c.addEventListener('click',function(){show(+c.getAttribute('data-i'));holdUntil=performance.now()+HOLD})});
  [cluster,ticker].forEach(function(el){
    el.addEventListener('mouseenter',function(){paused=true});el.addEventListener('mouseleave',function(){paused=false});
    el.addEventListener('focusin',function(){paused=true});el.addEventListener('focusout',function(){paused=false});
  });
  requestAnimationFrame(function(t){last=t;requestAnimationFrame(frame)});
  window.addEventListener('load',function(){[].forEach.call(cluster.querySelectorAll('img.slide'),function(i){i.loading='eager'})});
  var nav=document.getElementById('nav'),menu=document.getElementById('menu');
  menu.addEventListener('click',function(){var o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o)});
  [].forEach.call(document.querySelectorAll('#navlinks a'),function(a){a.addEventListener('click',function(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')})});
  var bar=document.getElementById('bar'),cta=document.getElementById('herocta');
  if('IntersectionObserver' in window){new IntersectionObserver(function(e){bar.classList.toggle('show',!e[0].isIntersecting&&e[0].boundingClientRect.top<0)}).observe(cta)}
})();

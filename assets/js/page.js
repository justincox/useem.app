(function(){var nav=document.getElementById('nav'),menu=document.getElementById('menu');if(!nav||!menu)return;
menu.addEventListener('click',function(){var o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o)});
[].forEach.call(nav.querySelectorAll('.nav__links a'),function(a){a.addEventListener('click',function(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')})});})();

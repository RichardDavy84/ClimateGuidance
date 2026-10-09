const menu=document.querySelector('.hamburger'),toggle=document.querySelector('#menu-toggle');
if(menu&&toggle){menu.tabIndex=0;menu.setAttribute('role','button');menu.setAttribute('aria-label','Toggle navigation');menu.setAttribute('aria-expanded','false');menu.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle.checked=!toggle.checked;toggle.dispatchEvent(new Event('change'));}});toggle.addEventListener('change',()=>menu.setAttribute('aria-expanded',toggle.checked));}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const d of document.querySelectorAll('.cc-nav[open]')){d.open=false;d.querySelector('summary').focus();}}});
document.addEventListener('click',e=>{for(const d of document.querySelectorAll('.cc-nav[open]'))if(!d.contains(e.target))d.open=false;});

// Keep collapsed mobile links out of the keyboard and screen-reader order.
const nav=document.querySelector("nav.navbar"),mobileNav=matchMedia("(max-width:768px)");
function syncNavigation(){if(nav&&toggle)nav.inert=mobileNav.matches&&!toggle.checked;}
toggle?.addEventListener("change",syncNavigation);mobileNav.addEventListener("change",syncNavigation);syncNavigation();

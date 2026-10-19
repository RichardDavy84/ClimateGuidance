const menu=document.querySelector('.profile-menu'),nav=document.querySelector('.profile-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.dataset.open=String(open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.profile-about[open]').forEach(d=>{d.open=false;d.querySelector('summary').focus()});if(menu?.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');nav.dataset.open='false';menu.focus()}}});
document.addEventListener('click',e=>document.querySelectorAll('.profile-about[open]').forEach(d=>{if(!d.contains(e.target))d.open=false}));
const filters=document.querySelectorAll('[data-filter]'),publications=document.querySelectorAll('.publication[data-themes]');
filters.forEach(b=>b.addEventListener('click',()=>{filters.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));let visible=0;for(const p of publications){p.hidden=b.dataset.filter!=='All research'&&!p.dataset.themes.split('|').includes(b.dataset.filter);if(!p.hidden)visible++}document.querySelector('#publication-count').textContent=`${visible} selected publication${visible===1?'':'s'}`;}));
const reason=document.querySelector('#enquiry-reason'),q=new URLSearchParams(location.search).get('reason');
if(reason&&[...reason.options].some(o=>o.value===q))reason.value=q;

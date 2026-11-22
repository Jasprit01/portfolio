(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const S = window.Shared, signal = S.signal, body = document.body;
  const safeStore = {get(k,d){try{return localStorage.getItem(k)??d}catch{return d}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
  const playSound = k => S.sfx(k);   // theme + sound buttons and effects live in ../shared.js
  // Boot sequence
  const loader=$('#loader'),bar=$('#loaderBar'),pct=$('#loaderPercent');
  if(loader&&bar&&pct){let progress=0;signal.addEventListener('abort',()=>clearInterval(boot));const boot=setInterval(()=>{progress=Math.min(100,progress+Math.ceil(Math.random()*17));bar.style.width=progress+'%';pct.textContent=String(progress).padStart(2,'0')+'%';if(progress>=100){clearInterval(boot);setTimeout(()=>loader.classList.add('done'),250)}},65)}
  const glow=$('#cursorGlow');if(glow)window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'},{passive:true,signal});
  $('#menuBtn')?.addEventListener('click',()=>$('#nav')?.classList.toggle('open'));
  $$('nav a').forEach(a=>a.addEventListener('click',()=>$('#nav')?.classList.remove('open')));

  // Terminal simulator (safe local demo only)
  const responses={help:'Available commands: help, about, projects, skills, contact, play, queue, security, clear',about:'Jasprit Singh Chopra — Python-focused Discord bot developer. Founder at Oxalic Lab.',projects:'Wavieo [MUSIC] · Wavieo Air [MUSIC] · Hydrogen [AIO] · Oxygen [AIO]',skills:'Python (primary) · discord.py · asyncio · HTML/CSS (basic) · Golang (beginner) · API integration · debugging',contact:'jasprit.exe@proton.me | github.com/Jasprit01 | Oxalic Lab Discord',play:'[DEMO] Searching a track… No real Discord action is executed.',queue:'[DEMO] Queue preview: 01 — Current track · 02 — Next track · 03 — Up next',security:'[DEMO] Oxygen suite: Antinuke · Automod · Antibot · Whitelist',clear:'__CLEAR__'};
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function runCommand(raw){const out=$('#terminalOutput');if(!out)return;const cmd=raw.trim().toLowerCase().replace(/^\//,'');if(cmd==='clear'){out.textContent='';playSound('close');return}out.innerHTML='<span class="prompt">guest@oxalic:~$</span> '+escapeHtml(raw)+'\n'+escapeHtml(responses[cmd]||'Command not found. Type help to see available commands.');playSound('submit')}
  $('#terminalForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#terminalInput');if(input?.value.trim()){runCommand(input.value);input.value=''}});
  $$('[data-cmd]').forEach(b=>b.addEventListener('click',()=>runCommand(b.dataset.cmd)));

  // Project details
  const botData={
    wavieo:{title:'WAVIEO',type:'MUSIC BOT',text:'A Lavalink-powered Discord music bot with a broad playback and server customization toolkit.',features:['Music playback and voice controls','Queue management: shuffle, remove, move, clear and duplicate cleanup','Playback navigation: skip, seek, rewind and vote skip','Audio filters including speed and pitch','Synced lyrics and now-playing cards','Server settings, prefix and profile customization'],note:'Built with a Node/Bun runtime in the supplied source archive.'},
    oxygen:{title:'OXYGEN',type:'ALL-IN-ONE BOT',text:'A server utility and protection bot with configurable safeguards and automation.',features:['Antinuke protection and configurable limits','Automod rules and punishment controls','Antibot detection and whitelist tools','Role and bot-role protection systems','Autoresponder and reaction-role utilities','Quarantine tools and moderation workflows'],note:'Feature categories verified from the supplied project README and source structure.'},
    hydrogen:{title:'HYDROGEN',type:'ALL-IN-ONE BOT',text:'An all-in-one community bot in the Oxalic Lab ecosystem, designed to bring multiple server utilities together.',features:['Multi-purpose community tooling','Server utility and moderation direction','Designed as part of the four-bot ecosystem'],note:'Detailed feature inventory was not available; this overview avoids unverified command claims.'},
    'wavieo-air':{title:'WAVIEO AIR',type:'MUSIC BOT',text:'The first music bot in the Oxalic Lab lineup, with a distinct identity and a music-first experience.',features:['Music-focused Discord experience','Voice playback and queue-oriented workflow','A growing community around its own identity'],note:'The full source archive was not available; no unverified features are claimed.'}
  };
  const modal=$('#botModal'),modalContent=$('#modalContent');
  $$('[data-open]').forEach(b=>b.addEventListener('click',()=>{const d=botData[b.dataset.open];if(!d||!modal||!modalContent)return;modalContent.innerHTML=`<span class="micro-label">${d.type}</span><h3>${d.title}</h3><p>${d.text}</p><ul>${d.features.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p class="muted">${d.note}</p>`;modal.classList.add('open');modal.setAttribute('aria-hidden','false');playSound('open')}));
  function closeModal(){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');playSound('close')}
  $$('[data-close]').forEach(b=>b.addEventListener('click',closeModal));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()},{signal});

  // Public GitHub data, with graceful fallback
  const repoCount=$('#repoCount'),followers=$('#followerCount'),ghStatus=$('#githubStatus');
  if(repoCount||followers||ghStatus){fetch('https://api.github.com/users/Jasprit01').then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).then(d=>{if(repoCount)repoCount.textContent=d.public_repos??'—';if(followers)followers.textContent=d.followers??'—';if(ghStatus)ghStatus.textContent='Public profile data · synced just now'}).catch(()=>{if(ghStatus)ghStatus.textContent='Live stats unavailable — open the public profile instead.'})}
  const activity=$('#githubActivity');if(activity){fetch('https://api.github.com/users/Jasprit01/events/public?per_page=5').then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).then(events=>{if(!events.length){activity.innerHTML='<p class="muted">No recent public events to show.</p>';return}activity.innerHTML=events.slice(0,5).map(ev=>{const kind=ev.type.replace('Event','').toUpperCase(),repo=(ev.repo?.name||'public repository').split('/').pop(),date=new Date(ev.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'});return `<div class="activity-item"><span><b>${escapeHtml(kind)}</b> · ${escapeHtml(repo)}</span><small>${date}</small></div>`}).join('')}).catch(()=>activity.innerHTML='<p class="muted">Public activity is unavailable right now. Visit GitHub for the latest updates.</p>')}

  // Reveal animation
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.1});$$('.section-head,.about-grid,.stats-row,.bot-card,.lab-panel,.team-member,.milestone,.terminal-window,.github-card,.contact-links,.achievement-grid article,.activity-panel,.hub-card').forEach(el=>{el.classList.add('reveal');observer.observe(el)})}
  let typed='';document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='j'){secret();return}if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){typed=(typed+e.key.toLowerCase()).slice(-5);if(typed==='jassi')secret()}},{signal});
  function secret(){playSound('success');if(!location.pathname.endsWith('/dev-room.html')){S.go('dev-room.html');return}toast('EASTER EGG FOUND · KEEP BUILDING ✦');body.classList.toggle('secret-mode')}
  function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2100)}
  $('#backTop')?.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});playSound('back')});

  // Command deck: Ctrl/Cmd + K
  const palette=$('#commandPalette'),paletteInput=$('#paletteInput'),paletteResults=$('#paletteResults');
  const destinations=[['void.py','../index.html','Profile front page'],['Home','index.html','Overview'],['About','about.html','Profile and skills'],['Projects','projects.html','Four Discord bots'],['Oxalic Lab','lab.html','Team and organization'],['Terminal','terminal.html','Command simulator'],['GitHub','github.html','Repositories and activity'],['Achievements','achievements.html','Milestones'],['Contact','contact.html','Get in touch'],['Developer Room','dev-room.html','Hidden Easter egg']];
  function renderPalette(q=''){if(!paletteResults)return;const list=destinations.filter(x=>(x.join(' ')+' home').toLowerCase().includes(q.toLowerCase()));paletteResults.innerHTML=list.map(x=>`<a href="${x[1]}"><span>${x[0]}</span><small>${x[2]} ↗</small></a>`).join('')||'<p class="muted">No matching destination.</p>'}
  function openPalette(){if(!palette)return;renderPalette();palette.classList.add('open');palette.setAttribute('aria-hidden','false');paletteInput?.focus();playSound('open')}
  function closePalette(){if(!palette)return;palette.classList.remove('open');palette.setAttribute('aria-hidden','true');playSound('close')}
  renderPalette();document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape')closePalette()},{signal});
  paletteInput?.addEventListener('input',e=>renderPalette(e.target.value));$$('[data-palette-close]').forEach(x=>x.addEventListener('click',closePalette));

  // Honest per-device visit counter; it does not claim to count all visitors.
  const visitEl=$('#visitCount');if(visitEl){const key='jassi-device-visits';const count=(Number(safeStore.get(key,'0'))||0)+1;safeStore.set(key,String(count));visitEl.textContent=count.toLocaleString()}
})();

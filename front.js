/* front page (void.py): live Discord status, visitor counter, player UI. Theme/sound/music live in ../shared.js */
(() => {
const S = window.Shared, signal = S.signal, au = S.audio;
const CONFIG = {
  discordId: "1410852730427277374",
  spotify:   "https://open.spotify.com/user/31rwdoqkfjir4n5qawjj5cfiy6om",
  github:    "Jasprit01",
  server:    "https://discord.gg/AsgewsVDFJ",
  track:     { title: "void-lofi", artist: "midnight loop" },
  counterNamespace: "jasprit01-void-py"   // visitor counter bucket
};
const $ = id => document.getElementById(id);

/* links */
$("lDiscord").href = "https://discord.com/users/" + CONFIG.discordId;
$("lSpotify").href = CONFIG.spotify;
$("lGit").href = "https://github.com/" + CONFIG.github;
$("lServer").href = CONFIG.server;

/* live Discord presence (Lanyard: REST first, then websocket) */
const COL = { online:"#6ee7a8", idle:"#ffd24a", dnd:"#ff6b7d", offline:"#6f77ad" };
const EM = { online:["🟢","online"], idle:["🌙","idle"], dnd:["⛔","do not disturb"], offline:["💤","offline"] };
function render(d){
  if(!d || signal.aborted || !$("st")){ return; }
  const s = EM[d.discord_status] ? d.discord_status : "offline", e = EM[s][0];
  document.body.dataset.s = s; document.documentElement.style.setProperty("--st", COL[s]);
  $("st").textContent = s; $("badge").textContent = e; $("em2").textContent = e;
  $("pill").innerHTML = '<span class="em">' + e + '</span> ' + EM[s][1];
  let note = "";
  if(d.listening_to_spotify && d.spotify) note = "listening to " + d.spotify.song + ", " + d.spotify.artist;
  else { const g = (d.activities || []).find(a => a.type === 0); if(g) note = "playing " + g.name; }
  $("act").hidden = !note; $("act").innerHTML = '    <span class="c"></span>';
  $("act").firstElementChild.textContent = "# " + note;
}
let hb, ws, retry;
signal.addEventListener("abort", () => { clearInterval(hb); clearTimeout(retry); try{ ws && ws.close(); }catch(e){} });
async function presence(){
  if(signal.aborted) return;
  try{ const r = await (await fetch("https://api.lanyard.rest/v1/users/" + CONFIG.discordId)).json();
       if(r.success) render(r.data); else if($("pill")){ $("pill").textContent = "join discord.gg/lanyard to go live"; } }catch(e){}
  if(signal.aborted) return;
  ws = new WebSocket("wss://api.lanyard.rest/socket");
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if(m.op === 1){ ws.send(JSON.stringify({ op:2, d:{ subscribe_to_id: CONFIG.discordId } }));
                    hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op:3 })), m.d.heartbeat_interval); }
    else if(m.op === 0) render(m.d); };
  ws.onclose = () => { clearInterval(hb); if(!signal.aborted) retry = setTimeout(presence, 6000); };
}
presence();

/* real visitor counter: one hit per browser, shared count for everyone */
(async () => {
  const ns = CONFIG.counterNamespace, key = "visits", first = !localStorage.getItem("void_seen");
  const providers = [
    { hit:`https://abacus.jasoncameron.dev/hit/${ns}/${key}`, get:`https://abacus.jasoncameron.dev/get/${ns}/${key}`, val:j=>j.value },
    { hit:`https://api.counterapi.dev/v1/${ns}/${key}/up`,   get:`https://api.counterapi.dev/v1/${ns}/${key}`,        val:j=>j.count }
  ];
  for(const p of providers){
    try{ let r = await fetch(first ? p.hit : p.get); if(!r.ok && !first) r = await fetch(p.hit);
         const v = p.val(await r.json()); if(Number.isFinite(v)){ if($("views")) $("views").textContent = v.toLocaleString(); localStorage.setItem("void_seen","1"); return; } }catch(e){}
  }
  if($("views")) $("views").textContent = "n/a";
})();

/* music player UI (the audio itself is shared and keeps playing between pages) */
const pp = $("pp"), bar = $("bar");
$("title").textContent = CONFIG.track.title + " by " + CONFIG.track.artist;
const fmt = t => isFinite(t) ? Math.floor(t/60) + ":" + String(Math.floor(t%60)).padStart(2,"0") : "0:00";
const PLAY = "M7 4l13 8-13 8z", PAUSE = "M6 4h4v16H6zM14 4h4v16h-4z";
function sync(){ const on = !au.paused; $("player").classList.toggle("playing", on); $("ico").setAttribute("d", on ? PAUSE : PLAY);
  pp.setAttribute("aria-label", on ? "Pause" : "Play"); $("state").textContent = on ? "now playing" : "paused"; }
function time(){ $("cur").textContent = fmt(au.currentTime); if(au.duration) bar.value = au.currentTime / au.duration * 100; }
pp.onclick = () => S.music.toggle();
au.addEventListener("play", () => { sync(); viz(); }, { signal }); au.addEventListener("pause", sync, { signal });
au.addEventListener("loadedmetadata", () => $("dur").textContent = fmt(au.duration), { signal });
au.addEventListener("timeupdate", time, { signal });
bar.oninput = () => { if(au.duration) au.currentTime = bar.value / 100 * au.duration; };
if(au.duration) $("dur").textContent = fmt(au.duration);
time(); sync();

/* extras: boot order, spotlight, floating code, audio visualizer */
document.querySelectorAll(".ln").forEach((l,i) => l.style.setProperty("--i", i));
document.querySelectorAll(".win").forEach(w => w.addEventListener("pointermove", e => { const r = w.getBoundingClientRect();
  w.style.setProperty("--mx", e.clientX - r.left + "px"); w.style.setProperty("--my", e.clientY - r.top + "px"); }));
if(!matchMedia("(prefers-reduced-motion:reduce)").matches){
  const W = ["async","await","def","None","{}","0x7f","yield","import","<>","self","lambda","::","True","try:","[ ]"];
  for(let i = 0; i < 24; i++){ const g = document.createElement("span"); g.className = "g"; g.textContent = W[i % W.length];
    const side = i % 2 ? Math.random() * 18 : 82 + Math.random() * 16;   /* hug the left and right edges */
    g.style.cssText = `left:${side}%;font-size:${12 + Math.random() * 16}px;color:${i % 3 ? "var(--blue)" : "var(--yellow)"};opacity:${.1 + Math.random() * .2};animation-duration:${16 + Math.random() * 22}s;animation-delay:-${Math.random() * 30}s;--r:${Math.random() * 40 - 20}deg`;
    document.body.appendChild(g); }
}
let an, run = false; const cv = $("viz"), cx = cv.getContext("2d");
function viz(){ an = S.analyser(); if(!run){ run = true; draw(); } }
function draw(){
  const w = cv.width = cv.clientWidth, h = cv.height = cv.clientHeight; cx.clearRect(0, 0, w, h);
  if(au.paused || signal.aborted){ run = false; return; }
  const n = 40, bw = w / n, d = new Uint8Array(an ? an.frequencyBinCount : 0); if(an) an.getByteFrequencyData(d);
  const g = cx.createLinearGradient(0, 0, w, 0); const cs = getComputedStyle(document.documentElement); g.addColorStop(0, cs.getPropertyValue("--yellow")); g.addColorStop(.5, cs.getPropertyValue("--blue")); g.addColorStop(1, "#ff7ad9"); cx.fillStyle = g;
  for(let i = 0; i < n; i++){ const v = an ? d[i % 48] / 255 : .35 + .35 * Math.sin(Date.now() / 220 + i), bh = Math.max(3, v * h); cx.fillRect(i * bw + 2, h - bh, bw - 4, bh); }
  requestAnimationFrame(draw);
}
if(!au.paused) viz();

/* front page -> portfolio, with a short leave animation */
$("goPortfolio").addEventListener("click", e => { if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); S.sfx("theme"); document.body.classList.add("leave"); const h = e.currentTarget.href; setTimeout(() => S.go(h), 380); });
addEventListener("pageshow", () => document.body.classList.remove("leave"), { signal });
})();

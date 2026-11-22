/* ===== shared.js : ONE place for theme + sound buttons, music and page navigation =====
   Front page and every portfolio page load this file. Change something here and it changes everywhere.
   Music never stops between pages because pages are swapped in place (no full reload). */
(() => {
  if (window.Shared) return;
  const SRC = document.currentScript.src, ROOT = new URL("./", SRC).href;
  const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
  const S = window.Shared = {};
  let ctl = new AbortController(); S.signal = ctl.signal;

  /* ---------- APP ICON + INSTALL (PWA): same icon and manifest on every page ---------- */
  const ic = n => new URL("icons/" + n, ROOT).href;
  const addLink = (rel, href, extra) => { const l = document.createElement("link"); l.rel = rel; l.href = href; Object.assign(l, extra || {}); document.head.appendChild(l); };
  document.head.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]').forEach(n => { if (!n.href.startsWith(ROOT + "icons/")) n.remove(); });
  if (!document.head.querySelector('link[rel~="icon"]')){ addLink("icon", ic("favicon-48.png"), { type:"image/png" }); addLink("icon", ic("icon-192.png"), { type:"image/png" }); }
  if (!document.head.querySelector('link[rel="apple-touch-icon"]')) addLink("apple-touch-icon", ic("apple-touch-icon.png"));
  if (!document.head.querySelector('link[rel="manifest"]')) addLink("manifest", new URL("manifest.webmanifest", ROOT).href);
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) addEventListener("load", () => navigator.serviceWorker.register(new URL("sw.js", ROOT).href, { scope:ROOT }).catch(() => {}));
  let ip = null;   /* browser's install prompt, kept until the person taps the install button */
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); ip = e; S.mountTools(); });
  addEventListener("appinstalled", () => { ip = null; S.mountTools(); S.toast("app installed"); });

  /* ---------- THEMES (single list, used by both front page and portfolio) ---------- */
  /* name, accent (yellow), accent2 (blue), blob colour */
  const THEMES = [
    ["python","#ffd24a","#78b0ee","#3446ff"], ["cyan","#62e8ff","#b58cff","#1b3a9c"], ["red","#ff647c","#ffb36b","#8a1b33"],
    ["mono","#e6e6e6","#9aa0c8","#3a3f5c"], ["matrix","#6dff9b","#d5ff6d","#0f6b3a"], ["amber","#ffc45c","#ff7d52","#8a4a10"],
    ["pink","#ff79d1","#a98bff","#7a1f66"], ["blue","#6e9bff","#6ff3ff","#1b3a9c"], ["violet","#b58cff","#62e8ff","#4b2cb8"]
  ];
  let ti = Math.max(0, THEMES.findIndex(t => t[0] === (store.get("od_theme") || store.get("void_theme"))));
  function applyTheme(i, say){
    ti = i; const [n, a, b, c] = THEMES[i], st = document.documentElement.style;
    st.setProperty("--yellow", a); st.setProperty("--accent", a);
    st.setProperty("--blue", b);   st.setProperty("--accent2", b); st.setProperty("--b1", c);
    store.set("od_theme", n); if (say) S.toast("theme: " + n);
  }
  S.theme = { next(){ applyTheme((ti + 1) % THEMES.length, true); S.sfx("theme"); } };
  applyTheme(ti, false);

  /* ---------- TOAST ---------- */
  S.toast = m => { const t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(S.toast.id); S.toast.id = setTimeout(() => t.classList.remove("show"), 1500); };

  /* ---------- SOUND EFFECTS ---------- */
  let snd = store.get("od_snd") !== "off", sc;
  const PAT = {
    click:[[560,0,.055,"triangle",.06,120]], hover:[[880,0,.035,"sine",.02,80]],
    nav:[[440,0,.06,"triangle",.05,110],[660,.065,.075,"sine",.04,0]],
    open:[[420,0,.065,"triangle",.05,100],[620,.065,.07,"sine",.04,150],[880,.14,.09,"sine",.03,0]],
    close:[[760,0,.06,"sine",.045,-160],[480,.06,.08,"triangle",.035,-90]],
    theme:[[390,0,.07,"sine",.07,130],[590,.07,.07,"triangle",.06,160],[820,.14,.1,"sine",.05,0]],
    toggle:[[520,0,.06,"sine",.07,130],[780,.07,.075,"sine",.06,0]],
    submit:[[350,0,.07,"triangle",.05,90],[540,.08,.085,"sine",.04,160]],
    success:[[523,0,.08,"sine",.05,0],[659,.09,.08,"sine",.05,0],[784,.18,.12,"sine",.045,0]],
    back:[[680,0,.05,"triangle",.04,-120],[460,.06,.075,"sine",.035,-80]]
  };
  const PITCH = { cyan:1.12, red:.88, mono:.72, matrix:1.22, amber:1.04, pink:1.3, blue:.96, violet:1.08 };
  S.sfx = k => { if (!snd) return;
    try{ sc = sc || new (window.AudioContext || window.webkitAudioContext)(); if (sc.state === "suspended") sc.resume();
      const t = sc.currentTime, p = PITCH[THEMES[ti][0]] || 1;
      for (const [f, o, d, w, g, sl] of (PAT[k] || PAT.click)){
        const os = sc.createOscillator(), am = sc.createGain(); os.type = w; os.frequency.setValueAtTime(f * p, t + o);
        if (sl) os.frequency.exponentialRampToValueAtTime(Math.max(30, (f + sl) * p), t + o + d);
        am.gain.setValueAtTime(.0001, t + o); am.gain.exponentialRampToValueAtTime(g, t + o + .01); am.gain.exponentialRampToValueAtTime(.0001, t + o + d);
        os.connect(am); am.connect(sc.destination); os.start(t + o); os.stop(t + o + d + .03); }
    }catch(e){} };
  function paintSnd(){ document.querySelectorAll("[data-snd-btn]").forEach(b => { b.textContent = snd ? "🔊" : "🔇"; b.setAttribute("aria-label", snd ? "Mute touch sounds" : "Enable touch sounds"); b.title = snd ? "Touch sounds on" : "Touch sounds off"; }); }
  function toggleSnd(){ if (snd){ S.sfx("toggle"); snd = false; } else { snd = true; S.sfx("toggle"); } store.set("od_snd", snd ? "on" : "off"); paintSnd(); S.toast(snd ? "touch sounds on" : "touch sounds off"); }

  /* ---------- THE ONLY theme + sound buttons: any <span data-tools> gets them ---------- */
  S.mountTools = () => { document.querySelectorAll("[data-tools]").forEach(h => { h.innerHTML =
    (ip ? '<button class="odtb" type="button" data-install-btn aria-label="Install app" title="Install app">📲</button>' : '') +
    '<button class="odtb" type="button" data-theme-btn aria-label="Change theme" title="Change theme">🎨</button><button class="odtb" type="button" data-snd-btn></button>'; }); paintSnd(); };

  const SEL = 'button,a,[role="button"],.bot-card,select';
  addEventListener("pointerdown", e => { const el = e.target.closest && e.target.closest(SEL); if (!el || el.closest("[data-tools]")) return;
    S.sfx(el.matches("a") ? (el.matches("[data-back]") ? "back" : el.closest("nav") ? "nav" : "click")
      : el.matches("[data-close],.modal-close") ? "close" : el.matches("[data-open]") ? "open" : el.matches("[data-cmd]") ? "submit" : el.id === "backTop" ? "back" : "click"); }, { passive:true });
  addEventListener("pointerover", e => { if (e.pointerType !== "mouse") return; const el = e.target.closest && e.target.closest("button,a,select");
    if (el && !el.contains(e.relatedTarget)){ const n = Date.now(); if (n - (S.lh || 0) < 140) return; S.lh = n; S.sfx("hover"); } }, { passive:true });

  /* ---------- MUSIC (one audio element for the whole site, never recreated) ---------- */
  const au = S.audio = new Audio(); au.loop = true; au.preload = "auto"; au.src = new URL("music/void-lofi.mp3", ROOT).href;
  let M = {}; try{ M = JSON.parse(store.get("od_music") || "{}"); }catch(e){}
  let want = M.on !== false;
  au.addEventListener("loadedmetadata", () => { if (M.t > 0 && au.duration){ let t = M.t + (M.was ? (Date.now() - M.ts) / 1000 : 0); try{ au.currentTime = t % au.duration; }catch(e){} M = {}; } }, { once:true });
  const saveM = () => store.set("od_music", JSON.stringify({ on:want, t:au.currentTime || 0, ts:Date.now(), was:!au.paused }));
  setInterval(() => { if (!au.paused) saveM(); }, 1000); addEventListener("pagehide", saveM);
  const tryPlay = () => au.play().catch(() => {});
  if (want) tryPlay();
  /* browsers block autoplay: start on the first tap/key anywhere (skip the player's own controls) */
  const gest = e => { if (want && au.paused && !(e.target.closest && e.target.closest("[data-music-ui]"))) tryPlay(); };
  addEventListener("pointerdown", gest, true); addEventListener("keydown", gest, true);
  S.music = { toggle(){ if (au.paused){ want = true; tryPlay(); } else { want = false; au.pause(); } saveM(); } };
  let an; S.analyser = () => { if (an !== undefined) return an; an = null;
    if (location.protocol.startsWith("http")){ try{ const AC = new (window.AudioContext || window.webkitAudioContext)(), src = AC.createMediaElementSource(au);
      an = AC.createAnalyser(); an.fftSize = 128; src.connect(an); an.connect(AC.destination); AC.resume(); }catch(e){ an = null; } }
    return an; };

  /* ---------- NAVIGATION: swap pages in place so the music keeps playing ---------- */
  const keep = n => { const h = n.getAttribute("href") || ""; return !/fonts\.googleapis|shared\.css/.test(h); };
  const sheets = root => [...root.querySelectorAll("link[rel=stylesheet],style")].filter(keep);
  const keyOf = (n, base) => n.tagName === "LINK" ? "L:" + new URL(n.getAttribute("href"), base).href : "S:" + n.textContent;
  sheets(document.head).forEach(n => { n.dataset.pg = "1"; n.dataset.pgk = keyOf(n, location.href); });
  history.replaceState(Object.assign({ od:0 }, history.state || {}), "");
  let navId = 0, curPath = location.pathname + location.search;
  const isPage = u => u.origin === location.origin && u.href.startsWith(ROOT) && (/\.html$/.test(u.pathname) || u.pathname.endsWith("/"));
  const loadCss = l => new Promise(r => { l.onload = l.onerror = r; setTimeout(r, 4000); });

  async function swap(href, push){
    const id = ++navId; let html;
    try{ const r = await fetch(href); if (!r.ok) throw 0; html = await r.text(); }catch(e){ location.href = href; return; }
    if (id !== navId) return;
    try{
      const doc = new DOMParser().parseFromString(html, "text/html");
      if (push) { if (href === location.href) history.replaceState(history.state, "", href); else history.pushState({ od:((history.state && history.state.od) || 0) + 1 }, "", href); }
      curPath = location.pathname + location.search;
      /* styles of the incoming page (added switched-off, enabled at swap time) */
      const have = new Set([...document.head.querySelectorAll("[data-pg]")].map(n => n.dataset.pgk)), fresh = [], wanted = new Set();
      for (const n of sheets(doc.head)){ const k = keyOf(n, href); wanted.add(k); if (have.has(k)) continue;
        let el; if (n.tagName === "LINK"){ el = document.createElement("link"); el.rel = "stylesheet"; el.href = new URL(n.getAttribute("href"), href).href; } else { el = document.createElement("style"); el.textContent = n.textContent; }
        el.media = "not all"; el.dataset.pg = "1"; el.dataset.pgk = k; document.head.appendChild(el); fresh.push(el); }
      await Promise.all(fresh.filter(e => e.tagName === "LINK").map(loadCss));
      if (id !== navId) return;
      document.head.querySelectorAll("[data-pg]").forEach(n => { if (!wanted.has(n.dataset.pgk)) n.remove(); });
      fresh.forEach(e => e.removeAttribute("media"));
      document.title = doc.title;
      /* leave old page, enter new one */
      ctl.abort(); ctl = new AbortController(); S.signal = ctl.signal;
      const nb = doc.body, b = document.body;
      [...b.attributes].forEach(a => b.removeAttribute(a.name)); [...nb.attributes].forEach(a => b.setAttribute(a.name, a.value));
      const scripts = [...nb.querySelectorAll("script")].map(s => ({ src:s.getAttribute("src"), text:s.textContent }));
      b.innerHTML = nb.innerHTML;
      S.mountTools();
      const h = new URL(href).hash; scrollTo(0, 0);
      for (const s of scripts){ if (s.src && /shared\.js/.test(s.src)) continue;
        await new Promise(res => { const el = document.createElement("script"); if (s.src){ el.src = new URL(s.src, href).href; el.onload = el.onerror = res; } else { el.textContent = s.text; }
          document.body.appendChild(el); if (!s.src) res(); }); }
      if (h){ const t = document.getElementById(decodeURIComponent(h.slice(1))); if (t) t.scrollIntoView(); }
    }catch(e){ console.error(e); location.href = href; }
  }
  S.go = u => swap(new URL(u, location.href).href, true);
  S.back = fallback => { const st = history.state; if (st && st.od > 0) history.back(); else S.go(fallback); };
  addEventListener("popstate", () => { if (location.pathname + location.search !== curPath) swap(location.href, false); });

  document.addEventListener("click", e => {
    const tb = e.target.closest("[data-theme-btn]"); if (tb){ S.theme.next(); return; }
    const sb = e.target.closest("[data-snd-btn]"); if (sb){ toggleSnd(); return; }
    if (e.target.closest("[data-install-btn]")){ if (ip){ const p = ip; ip = null; S.mountTools(); p.prompt(); p.userChoice.catch(() => {}); } return; }
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]"); if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    if (a.matches("[data-back]")){ e.preventDefault(); S.back(a.href); return; }
    const u = new URL(a.href, location.href); if (!isPage(u)) return;
    if (u.pathname === location.pathname && u.search === location.search && u.hash) return;
    e.preventDefault(); S.go(u.href);
  });

  S.mountTools();
})();

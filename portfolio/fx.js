(() => {
  const signal = window.Shared.signal;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  /* ambient background: aurora blobs and code words drifting up at the edges */
  const bg = (c) => { const d = document.createElement("div"); d.className = c; document.body.prepend(d); };
  bg("blob b2"); bg("blob b1");
  if (!calm) {
    const W = ["async", "await", "def", "None", "{}", "0x7f", "yield", "import", "<>", "self", "lambda", "::", "True", "try:", "[ ]", "discord.py"];
    for (let i = 0; i < 22; i++) {
      const g = document.createElement("span"); g.className = "g"; g.textContent = W[i % W.length];
      g.style.cssText = `left:${i % 2 ? Math.random() * 14 : 80 + Math.random() * 12}%;font-size:${12 + Math.random() * 16}px;color:${i % 3 ? "var(--accent2)" : "var(--accent)"};opacity:${.08 + Math.random() * .16};animation-duration:${18 + Math.random() * 22}s;animation-delay:-${Math.random() * 30}s;--r:${Math.random() * 40 - 20}deg`;
      document.body.appendChild(g);
    }
  }
  /* spotlight that follows the pointer inside each panel */
  const panels = ".hub-card,.bot-card,.team-member,.github-card,.achievement-grid article,.contact-links a,.stats-row div";
  document.addEventListener("pointermove", (e) => { const p = e.target.closest?.(panels); if (!p) return; const r = p.getBoundingClientRect(); p.style.setProperty("--mx", e.clientX - r.left + "px"); p.style.setProperty("--my", e.clientY - r.top + "px"); }, { passive: true, signal });
  /* typing role line */
  const role = $("#roleText");
  if (role && !calm) {
    const roles = ["PYTHON DEVELOPER", "DISCORD BOT BUILDER", "ASYNCIO ENTHUSIAST", "FOUNDER @ OXALIC LAB"]; let i = 0, n = 0, del = false;
    const tick = () => { if (signal.aborted) return; const w = roles[i]; n += del ? -1 : 1; role.textContent = w.slice(0, n);
      let t = del ? 35 : 80; if (!del && n === w.length) { del = true; t = 1600; } else if (del && n === 0) { del = false; i = (i + 1) % roles.length; t = 350; } setTimeout(tick, t); };
    setTimeout(tick, 1400);
  }
  /* count-up stats */
  $$("[data-count]").forEach((el) => { const to = +el.dataset.count; if (calm) return; let v = 0; const id = setInterval(() => { v++; el.textContent = String(v).padStart(2, "0"); if (v >= to) clearInterval(id); }, 220); signal.addEventListener("abort", () => clearInterval(id)); });
})();

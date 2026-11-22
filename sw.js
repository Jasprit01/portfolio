/* service worker: makes the site installable and keeps it working offline.
   network first (so new deploys show up right away), cache as fallback. Music is streamed, never cached. */
const V = "od-v1";
const SHELL = ["./", "index.html", "shared.js", "shared.css", "front.js", "manifest.webmanifest", "pfp.jpg",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png",
  "portfolio/index.html", "portfolio/about.html", "portfolio/projects.html", "portfolio/lab.html", "portfolio/terminal.html",
  "portfolio/github.html", "portfolio/achievements.html", "portfolio/contact.html", "portfolio/style.css", "portfolio/script.js", "portfolio/fx.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || r.headers.has("range") || r.destination === "audio" || r.destination === "video") return;
  e.respondWith(fetch(r).then(res => { if (res.ok){ const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});

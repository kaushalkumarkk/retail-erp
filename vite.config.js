import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
function offlineApp() {
  return {
    name: "retailer-offline-app",
    apply: "build",
    generateBundle(_, bundle) {
      const files = [
        "./",
        "./index.html",
        "./icon.svg",
        "./manifest.webmanifest",
        ...Object.keys(bundle)
          .filter((k) => k !== "index.html")
          .map((k) => "./" + k),
      ];
      const hash = createHash("sha256")
        .update(Object.keys(bundle).join("|"))
        .digest("hex")
        .slice(0, 12);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `const CACHE='retailer-${hash}';const FILES=${JSON.stringify(files)};self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('retailer-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(event.request,{ignoreVary:true})).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))});`,
      });
    },
  };
}
export default defineConfig({ plugins: [react(), offlineApp()], base: "./" });

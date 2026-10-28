/* Lưu ứng dụng vào máy để mở được khi mất mạng.
   - Trang app (index.html): lấy bản mới khi có mạng, mất mạng thì dùng bản đã lưu.
   - Thư viện (QR, Excel): lưu lần đầu rồi dùng lại.
   - Máy chủ dữ liệu (Google) và ảnh: không lưu. */
const BAN = 'kct-v1';
const THU_VIEN = [
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(BAN).then(c => Promise.all(
    ['./', './index.html'].concat(THU_VIEN).map(u => c.add(u).catch(() => {}))
  )));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== BAN).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/(^|\.)google\.com$|googleusercontent\.com$|googleapis\.com$/.test(u.hostname)) return;

  if (u.origin === self.location.origin) {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(BAN).then(x => x.put(r.mode === 'navigate' ? './index.html' : r, c)); }
        return res;
      }).catch(() => caches.match(r, { ignoreSearch: true })
        .then(m => m || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(BAN).then(x => x.put(r, c)); }
      return res;
    }))
  );
});

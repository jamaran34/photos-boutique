/* Service worker : fonctionnement hors ligne + reception des photos
   envoyees par le menu Partager d'Android. */

var CACHE = 'photos-boutique-v1';
var PARTAGE = 'pb-partage';
var RESSOURCES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(RESSOURCES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (cles) {
        return Promise.all(cles.map(function (k) {
          if (k !== CACHE && k !== PARTAGE) { return caches.delete(k); }
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Photos partagees depuis la galerie : on les range puis on ouvre l'application.
  if (e.request.method === 'POST' && url.pathname.endsWith('/partage')) {
    e.respondWith((async function () {
      try {
        var donnees = await e.request.formData();
        var fichiers = donnees.getAll('images');
        var c = await caches.open(PARTAGE);
        var anciennes = await c.keys();
        await Promise.all(anciennes.map(function (k) { return c.delete(k); }));
        for (var i = 0; i < fichiers.length; i++) {
          await c.put(
            new Request('./__partage/' + i),
            new Response(fichiers[i], {
              headers: {
                'Content-Type': fichiers[i].type || 'image/jpeg',
                'X-Nom': encodeURIComponent(fichiers[i].name || ('photo-' + (i + 1) + '.jpg'))
                  .replace(/%20/g, ' ')
              }
            })
          );
        }
      } catch (err) { /* rien a ranger */ }
      return Response.redirect('./?partage=1', 303);
    })());
    return;
  }

  if (e.request.method !== 'GET' || url.origin !== location.origin) { return; }

  e.respondWith(
    caches.match(e.request).then(function (rep) {
      if (rep) { return rep; }
      return fetch(e.request).then(function (reseau) {
        if (reseau && reseau.status === 200 && reseau.type === 'basic') {
          var copie = reseau.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copie); });
        }
        return reseau;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});

const APP_SHELL_CACHE = "kisah-shell-v2";
const RUNTIME_CACHE = "kisah-runtime-v2";
const STORY_API_CACHE = "kisah-story-api-v2";
const STORY_IMAGE_CACHE = "kisah-story-images-v2";
const MAP_CACHE = "kisah-map-v2";

const scopeUrl = new URL(self.registration.scope);
const APP_SCOPE = scopeUrl.pathname.endsWith("/")
  ? scopeUrl.pathname
  : `${scopeUrl.pathname}/`;

function fromScope(path = "") {
  return `${APP_SCOPE}${path}`;
}

const APP_SHELL = [
  fromScope(""),
  fromScope("index.html"),
  fromScope("favicon.png"),
  fromScope("manifest.webmanifest"),
  fromScope("images/logo.png"),
  fromScope("images/icons/icon-192.png"),
  fromScope("images/icons/icon-512.png"),
  fromScope("images/icons/maskable-192.png"),
  fromScope("images/icons/maskable-512.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const allowedCaches = [
    APP_SHELL_CACHE,
    RUNTIME_CACHE,
    STORY_API_CACHE,
    STORY_IMAGE_CACHE,
    MAP_CACHE,
  ];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => !allowedCaches.includes(cacheName))
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_SHELL_CACHE, fromScope("index.html")));
    return;
  }

  if (url.origin === "https://story-api.dicoding.dev") {
    const cacheName =
      request.destination === "image" ? STORY_IMAGE_CACHE : STORY_API_CACHE;
    event.respondWith(networkFirst(request, cacheName));
    return;
  }

  if (
    url.hostname.includes("openstreetmap.org") ||
    url.hostname.includes("cartocdn.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("googleapis.com")
  ) {
    event.respondWith(cacheFirst(request, MAP_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function networkFirst(request, cacheName, fallbackUrl = null) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (fallbackUrl ? await caches.match(fallbackUrl) : undefined) ||
      new Response("Konten belum tersedia saat offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cachedResponse || (await fetchPromise) || caches.match(fromScope("index.html"));
}

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "Kisah Nusantara", options: { body: event.data.text() } };
    }
  }

  const title = payload.title || "Story berhasil dibuat";
  const options = {
    body:
      payload.options?.body ||
      payload.body ||
      "Cerita baru berhasil dibuat di Kisah Nusantara.",
    icon: payload.options?.icon || fromScope("images/icons/icon-192.png"),
    badge: fromScope("images/icons/icon-192.png"),
    image: payload.options?.image,
    data: {
      url: payload.options?.data?.url || payload.data?.url || fromScope("#/"),
    },
    actions: [
      {
        action: "open-story",
        title: "Buka cerita",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || fromScope("#/");

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const sameOriginClient = clientList.find((client) =>
          client.url.startsWith(self.location.origin),
        );
        if (sameOriginClient) {
          sameOriginClient.focus();
          sameOriginClient.navigate(targetUrl);
          return;
        }
        return clients.openWindow(targetUrl);
      }),
  );
});

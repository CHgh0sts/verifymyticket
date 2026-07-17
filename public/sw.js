/* VerifyMyTicket service worker — push notifications */
self.addEventListener("push", (event) => {
  let data = { title: "VerifyMyTicket", body: "Nouvelle alerte", url: "/dashboard/alerts" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png",
      badge: "/favicon.png",
      tag: data.tag || "vmt",
      data: { url: data.url || "/dashboard/alerts" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/alerts";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

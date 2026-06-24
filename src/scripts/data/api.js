import CONFIG from "../config";

async function request(path, options = {}) {
  const response = await fetch(`${CONFIG.BASE_URL}${path}`, options);
  let result;
  try {
    result = await response.json();
  } catch {
    result = { message: "Respons server tidak valid." };
  }
  if (!response.ok || result.error)
    throw new Error(result.message || "Permintaan gagal diproses.");
  return result;
}

export const StoryApi = {
  register({ name, email, password }) {
    return request("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
  },
  login({ email, password }) {
    return request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },
  getStories(token) {
    return request("/stories?size=30&location=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addStory(token, { description, photo, lat, lon }) {
    const body = new FormData();
    body.append("description", description);
    body.append("photo", photo, photo.name || "foto-kamera.jpg");
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      body.append("lat", lat);
      body.append("lon", lon);
    }
    return request("/stories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  },
  subscribeNotification(token, subscription) {
    const { endpoint, keys } = subscription.toJSON();

    return request("/notifications/subscribe", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      }),
    });
  },
  unsubscribeNotification(token, endpoint) {
    return request("/notifications/subscribe", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint }),
    });
  },
};

export const SessionModel = {
  getToken: () => localStorage.getItem(CONFIG.TOKEN_KEY),
  getUser: () => JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || "null"),
  save(loginResult) {
    localStorage.setItem(CONFIG.TOKEN_KEY, loginResult.token);
    localStorage.setItem(
      CONFIG.USER_KEY,
      JSON.stringify({ id: loginResult.userId, name: loginResult.name }),
    );
  },
  clear() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },
};

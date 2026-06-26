const DATABASE_NAME = "kisah-nusantara";
const DATABASE_VERSION = 2;
const SAVED_STORE = "saved-stories";
const CACHE_STORE = "cached-stories";
const PENDING_STORE = "pending-stories";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(SAVED_STORE)) {
        const savedStore = database.createObjectStore(SAVED_STORE, {
          keyPath: "id",
        });
        savedStore.createIndex("createdAt", "createdAt");
        savedStore.createIndex("name", "name");
      }

      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = database.createObjectStore(PENDING_STORE, {
          keyPath: "id",
        });
        pendingStore.createIndex("createdAt", "createdAt");
      }
    };
  });
}

async function withStore(storeName, mode, callback) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

const Database = {
  async saveStory(story) {
    if (!story?.id) throw new Error("Cerita tidak valid untuk disimpan.");
    return withStore(SAVED_STORE, "readwrite", (store) =>
      store.put({ ...story, savedAt: new Date().toISOString() }),
    );
  },

  async getSavedStories() {
    return withStore(SAVED_STORE, "readonly", (store) => store.getAll());
  },

  async getSavedStory(id) {
    return withStore(SAVED_STORE, "readonly", (store) => store.get(id));
  },

  async deleteSavedStory(id) {
    return withStore(SAVED_STORE, "readwrite", (store) => store.delete(id));
  },

  async cacheStories(stories) {
    return withStore(CACHE_STORE, "readwrite", (store) => {
      stories.forEach((story) => store.put(story));
      return store.getAll();
    });
  },

  async getCachedStories() {
    return withStore(CACHE_STORE, "readonly", (store) => store.getAll());
  },

  async addPendingStory(story) {
    const pendingStory = {
      id: `pending-${Date.now()}-${crypto.randomUUID()}`,
      description: story.description.trim(),
      photo: story.photo,
      lat: story.lat,
      lon: story.lon,
      createdAt: new Date().toISOString(),
    };

    await withStore(PENDING_STORE, "readwrite", (store) =>
      store.put(pendingStory),
    );
    return pendingStory;
  },

  async getPendingStories() {
    return withStore(PENDING_STORE, "readonly", (store) => store.getAll());
  },

  async deletePendingStory(id) {
    return withStore(PENDING_STORE, "readwrite", (store) => store.delete(id));
  },

  async countPendingStories() {
    return withStore(PENDING_STORE, "readonly", (store) => store.count());
  },
};

export default Database;

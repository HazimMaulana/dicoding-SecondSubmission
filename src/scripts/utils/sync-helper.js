import Database from "../data/database";
import { SessionModel, StoryApi } from "../data/api";
import { showToast } from "./index";

let isSyncing = false;

export async function getPendingStoriesCount() {
  return Database.countPendingStories();
}

export async function syncPendingStories({ notify = true } = {}) {
  if (isSyncing) return { synced: 0, failed: 0, pending: 0 };
  if (!navigator.onLine) {
    if (notify) showToast("Perangkat masih offline. Sinkronisasi ditunda.", "error");
    return { synced: 0, failed: 0, pending: await getPendingStoriesCount() };
  }

  const token = SessionModel.getToken();
  if (!token) return { synced: 0, failed: 0, pending: await getPendingStoriesCount() };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingStories = await Database.getPendingStories();
    for (const story of pendingStories) {
      try {
        await StoryApi.addStory(token, story);
        await Database.deletePendingStory(story.id);
        synced += 1;
      } catch (error) {
        console.error("syncPendingStories: failed:", error);
        failed += 1;
      }
    }
  } finally {
    isSyncing = false;
  }

  const pending = await getPendingStoriesCount();
  if (notify && synced > 0 && failed === 0) {
    showToast(`${synced} cerita offline berhasil disinkronkan.`);
  } else if (notify && failed > 0) {
    showToast(`${failed} cerita belum berhasil disinkronkan.`, "error");
  }

  return { synced, failed, pending };
}

export function setupOfflineSync(onSynced = () => {}) {
  window.addEventListener("online", async () => {
    const result = await syncPendingStories({ notify: true });
    onSynced(result);
  });

  if (navigator.onLine) {
    setTimeout(async () => {
      const result = await syncPendingStories({ notify: false });
      onSynced(result);
    }, 1000);
  }
}

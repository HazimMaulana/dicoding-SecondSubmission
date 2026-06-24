import CONFIG from "../config";
import { StoryApi, SessionModel } from "../data/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
}

export async function getPushSubscription() {
  if (!isNotificationSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function isPushSubscribed() {
  return Boolean(await getPushSubscription());
}

export async function subscribePushNotification() {
  const token = SessionModel.getToken();
  if (!token) throw new Error("Masuk terlebih dahulu untuk mengaktifkan notifikasi.");
  if (!isNotificationSupported()) throw new Error("Browser tidak mendukung push notification.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Izin notifikasi tidak diberikan.");

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    });
  }

  await StoryApi.subscribeNotification(token, subscription);
  return subscription;
}

export async function unsubscribePushNotification() {
  const token = SessionModel.getToken();
  const subscription = await getPushSubscription();
  if (!subscription) return;

  await StoryApi.unsubscribeNotification(token, subscription.endpoint);
  await subscription.unsubscribe();
}

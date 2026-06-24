import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { SessionModel } from "../data/api";
import { escapeHtml, showToast } from "../utils";
import {
  isNotificationSupported,
  isPushSubscribed,
  subscribePushNotification,
  unsubscribePushNotification,
} from "../utils/notification-helper";

class App {
  constructor({ navigationDrawer, drawerButton, content }) {
    this.content = content;
    this.drawerButton = drawerButton;
    this.navigationDrawer = navigationDrawer;
    this.setupDrawer();
    this.updateNavigation();
  }
  setupDrawer() {
    this.drawerButton.addEventListener("click", () => {
      const open = this.navigationDrawer.classList.toggle("open");
      this.drawerButton.setAttribute("aria-expanded", String(open));
    });
    document.body.addEventListener("click", (event) => {
      if (
        !this.navigationDrawer.contains(event.target) &&
        !this.drawerButton.contains(event.target)
      )
        this.closeDrawer();
      if (event.target.closest("#logout-button")) {
        SessionModel.clear();
        this.updateNavigation();
        location.hash = "#/login";
      }
      if (event.target.closest("#push-toggle")) this.togglePushNotification();
      if (event.target.closest(".navigation-drawer a")) this.closeDrawer();
    });
  }
  closeDrawer() {
    this.navigationDrawer.classList.remove("open");
    this.drawerButton.setAttribute("aria-expanded", "false");
  }
  async updateNavigation() {
    const loggedIn = Boolean(SessionModel.getToken());
    const user = SessionModel.getUser();
    document.querySelector("#nav-list").innerHTML = loggedIn
      ? `<li><a href="#/">Beranda</a></li><li><a href="#/add">Tambah cerita</a></li><li><a href="#/saved">Tersimpan</a></li><li><a href="#/about">Tentang</a></li><li><span class="user-label">${escapeHtml(user?.name || "Pengguna")}</span></li><li><button id="push-toggle" class="nav-button neutral" type="button">Notifikasi</button></li><li><button id="logout-button" class="nav-button" type="button">Keluar</button></li>`
      : `<li><a href="#/about">Tentang</a></li><li><a href="#/login">Masuk</a></li><li><a class="nav-register" href="#/register">Daftar</a></li>`;

    if (loggedIn) await this.updatePushToggle();
  }
  async updatePushToggle() {
    const button = document.querySelector("#push-toggle");
    if (!button) return;
    if (!isNotificationSupported()) {
      button.textContent = "Notifikasi tidak didukung";
      button.disabled = true;
      return;
    }
    const subscribed = await isPushSubscribed();
    button.textContent = subscribed ? "Matikan notifikasi" : "Aktifkan notifikasi";
    button.classList.toggle("subscribed", subscribed);
  }
  async togglePushNotification() {
    const button = document.querySelector("#push-toggle");
    try {
      button.disabled = true;
      if (await isPushSubscribed()) {
        await unsubscribePushNotification();
        showToast("Langganan push notification dimatikan.");
      } else {
        await subscribePushNotification();
        showToast("Langganan push notification aktif.");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      button.disabled = false;
      await this.updatePushToggle();
    }
  }
  async renderPage() {
    await this.currentPage?.destroy?.();
    await this.updateNavigation();
    const page = routes[getActiveRoute()] || routes["/not-found"];
    this.currentPage = page;
    const render = async () => {
      this.content.innerHTML = await page.render();
      await page.afterRender();
      this.content.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    if (document.startViewTransition)
      await document.startViewTransition(render).finished;
    else await render();
  }
}
export default App;

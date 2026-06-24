import { StoryApi, SessionModel } from "../../data/api";
import { showToast } from "../../utils";
import AuthPresenter from "./auth-presenter";

export default class LoginPage {
  async render() {
    return `<section class="auth-page container"><div class="auth-copy"><span class="eyebrow">Jelajahi Indonesia</span><h1>Setiap tempat punya cerita.</h1><p>Temukan momen autentik dari berbagai penjuru Nusantara dan bagikan kisahmu sendiri.</p></div><div class="auth-card"><h2>Masuk</h2><p class="muted">Lanjutkan perjalanan ceritamu.</p><form id="login-form"><div class="field"><label for="email">Alamat email</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="nama@email.com"></div><div class="field"><label for="password">Kata sandi</label><input id="password" name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Minimal 8 karakter"></div><p id="form-error" class="form-message error" role="alert"></p><button class="button primary full" type="submit">Masuk</button></form><p class="auth-switch">Belum punya akun? <a href="#/register">Daftar sekarang</a></p></div></section>`;
  }
  async afterRender() {
    if (SessionModel.getToken()) {
      location.hash = "#/";
      return;
    }
    this.presenter = new AuthPresenter({
      view: this,
      api: StoryApi,
      session: SessionModel,
    });
    document
      .querySelector("#login-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        this.presenter.login({
          email: data.get("email").trim(),
          password: data.get("password"),
        });
      });
  }
  setLoading(active) {
    const button = document.querySelector("#login-form button");
    button.disabled = active;
    button.textContent = active ? "Memproses..." : "Masuk";
  }
  showError(message) {
    document.querySelector("#form-error").textContent = message;
  }
  onSuccess(message) {
    showToast(message);
    location.hash = "#/";
  }
}

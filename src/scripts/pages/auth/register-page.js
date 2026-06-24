import { StoryApi, SessionModel } from "../../data/api";
import { showToast } from "../../utils";
import AuthPresenter from "./auth-presenter";

export default class RegisterPage {
  async render() {
    return `<section class="auth-page container"><div class="auth-copy"><span class="eyebrow">Bergabung bersama kami</span><h1>Bagikan sudut pandangmu.</h1><p>Satu foto dan cerita sederhana dapat membawa orang lain mengenal tempat yang belum pernah mereka kunjungi.</p></div><div class="auth-card"><h2>Buat akun</h2><p class="muted">Mulai bagikan cerita dari sekitarmu.</p><form id="register-form"><div class="field"><label for="name">Nama lengkap</label><input id="name" name="name" autocomplete="name" required maxlength="60"></div><div class="field"><label for="email">Alamat email</label><input id="email" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="password">Kata sandi</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required><small>Minimal 8 karakter.</small></div><p id="form-error" class="form-message error" role="alert"></p><button class="button primary full" type="submit">Daftar</button></form><p class="auth-switch">Sudah punya akun? <a href="#/login">Masuk</a></p></div></section>`;
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
      .querySelector("#register-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        this.presenter.register({
          name: data.get("name").trim(),
          email: data.get("email").trim(),
          password: data.get("password"),
        });
      });
  }
  setLoading(active) {
    const button = document.querySelector("#register-form button");
    button.disabled = active;
    button.textContent = active ? "Memproses..." : "Daftar";
  }
  showError(message) {
    document.querySelector("#form-error").textContent = message;
  }
  onSuccess(message) {
    showToast(message);
    location.hash = "#/login";
  }
}

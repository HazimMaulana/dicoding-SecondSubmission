export default class AuthPresenter {
  constructor({ view, api, session }) {
    this.view = view;
    this.api = api;
    this.session = session;
  }
  async login(credentials) {
    try {
      this.view.setLoading(true);
      const response = await this.api.login(credentials);
      this.session.save(response.loginResult);
      this.view.onSuccess("Login berhasil. Selamat datang!");
    } catch (error) {
      this.view.showError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }
  async register(data) {
    try {
      this.view.setLoading(true);
      await this.api.register(data);
      this.view.onSuccess("Akun berhasil dibuat. Silakan masuk.");
    } catch (error) {
      this.view.showError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }
}

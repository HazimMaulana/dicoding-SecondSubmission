export default class AddPresenter {
  constructor({ view, api, session }) {
    this.view = view;
    this.api = api;
    this.session = session;
  }
  async submit(data) {
    const token = this.session.getToken();
    if (!token) {
      this.view.requireLogin();
      return;
    }
    if (!data.description.trim()) {
      this.view.showError("Deskripsi cerita wajib diisi.");
      return;
    }
    if (!data.photo) {
      this.view.showError("Pilih foto atau ambil foto dari kamera.");
      return;
    }
    if (data.photo.size > 1024 * 1024) {
      this.view.showError(
        "Ukuran foto maksimal 1 MB. Pilih foto yang lebih kecil.",
      );
      return;
    }
    if (!Number.isFinite(data.lat) || !Number.isFinite(data.lon)) {
      this.view.showError("Pilih lokasi dengan mengeklik peta.");
      return;
    }
    try {
      this.view.setLoading(true);
      await this.api.addStory(token, data);
      this.view.onSuccess();
    } catch (error) {
      this.view.showError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }
}

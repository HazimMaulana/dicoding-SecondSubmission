export default class NotFoundPage {
  async render() {
    return `<section class="container about-page not-found-page"><span class="eyebrow">404</span><h1>Halaman tidak ditemukan</h1><p>Rute yang dibuka tidak tersedia di aplikasi ini.</p><a class="button primary" href="#/">Kembali ke beranda</a></section>`;
  }

  async afterRender() {}
}

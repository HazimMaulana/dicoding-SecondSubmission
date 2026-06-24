export default class AboutPage {
  async render() {
    return `<section class="container about-page"><span class="eyebrow">Tentang aplikasi</span><h1>Kisah Nusantara</h1><p>Aplikasi SPA untuk menjelajahi cerita komunitas beserta lokasi geografisnya. Data cerita berasal dari Dicoding Story API dan divisualisasikan menggunakan Leaflet.</p><div class="about-grid"><article><strong>01</strong><h2>Cerita nyata</h2><p>Foto dan pengalaman dari pengguna di berbagai daerah.</p></article><article><strong>02</strong><h2>Peta interaktif</h2><p>Kartu cerita tersinkronisasi dengan marker dan pilihan tampilan peta.</p></article><article><strong>03</strong><h2>Kontribusi mudah</h2><p>Unggah foto atau gunakan kamera, kemudian pilih lokasi langsung di peta.</p></article></div></section>`;
  }
  async afterRender() {}
}

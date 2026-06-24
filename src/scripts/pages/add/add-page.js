import { StoryApi, SessionModel } from "../../data/api";
import { createMap, L } from "../../utils/map";
import { showToast } from "../../utils";
import AddPresenter from "./add-presenter";

export default class AddPage {
  photo = null;
  stream = null;
  marker = null;

  async render() {
    return `<section class="container form-page"><div class="page-intro"><span class="eyebrow">Cerita baru</span><h1>Bagikan momenmu</h1><p>Tambahkan foto, ceritakan pengalamanmu, lalu tandai lokasi kejadiannya.</p></div><form id="story-form" class="story-form"><div class="form-panel"><div class="field"><label for="description">Deskripsi cerita</label><textarea id="description" name="description" rows="6" maxlength="1000" required placeholder="Apa yang menarik dari momen atau tempat ini?"></textarea><small>Maksimal 1000 karakter.</small></div><fieldset><legend>Foto cerita</legend><div class="photo-actions"><label class="button secondary file-button" for="photo">Pilih dari perangkat</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"><button id="camera-start" class="button secondary" type="button">Gunakan kamera</button></div><div id="camera-area" class="camera-area" hidden><video id="camera-video" autoplay playsinline aria-label="Pratinjau kamera"></video><div class="camera-controls"><button id="capture" class="button primary" type="button">Ambil foto</button><button id="camera-stop" class="button ghost" type="button">Tutup kamera</button></div><canvas id="camera-canvas" hidden></canvas></div><div id="photo-preview" class="photo-preview" aria-live="polite"></div></fieldset></div><div class="form-panel"><fieldset><legend>Lokasi cerita</legend><p class="muted">Klik posisi pada peta. Gunakan tombol lokasi saya jika diperlukan.</p><button id="my-location" class="button secondary small" type="button">Gunakan lokasi saya</button><div id="location-map" class="location-map" aria-label="Peta untuk memilih lokasi"></div><div class="coordinate-grid"><div class="field"><label for="latitude">Latitude</label><input id="latitude" readonly required></div><div class="field"><label for="longitude">Longitude</label><input id="longitude" readonly required></div></div></fieldset></div><p id="form-error" class="form-message error wide" role="alert"></p><div class="form-submit"><a class="button ghost" href="#/">Batal</a><button class="button primary" type="submit">Kirim cerita</button></div></form></section>`;
  }

  async afterRender() {
    if (!SessionModel.getToken()) {
      this.requireLogin();
      return;
    }
    this.presenter = new AddPresenter({
      view: this,
      api: StoryApi,
      session: SessionModel,
    });
    this.map = createMap("location-map", { zoom: 5 });
    this.map.on("click", ({ latlng }) =>
      this.selectLocation(latlng.lat, latlng.lng),
    );
    document.querySelector("#photo").addEventListener("change", (event) => {
      this.photo = event.target.files[0] || null;
      this.renderPreview();
    });
    document
      .querySelector("#camera-start")
      .addEventListener("click", () => this.startCamera());
    document
      .querySelector("#camera-stop")
      .addEventListener("click", () => this.stopCamera());
    document
      .querySelector("#capture")
      .addEventListener("click", () => this.capturePhoto());
    document
      .querySelector("#my-location")
      .addEventListener("click", () => this.useCurrentLocation());
    document
      .querySelector("#story-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        this.presenter.submit({
          description: document.querySelector("#description").value,
          photo: this.photo,
          lat: Number(document.querySelector("#latitude").value),
          lon: Number(document.querySelector("#longitude").value),
        });
      });
  }

  selectLocation(lat, lon) {
    document.querySelector("#latitude").value = lat.toFixed(6);
    document.querySelector("#longitude").value = lon.toFixed(6);
    if (this.marker) this.marker.setLatLng([lat, lon]);
    else {
      this.marker = L.marker([lat, lon], {
        draggable: true,
        title: "Lokasi cerita",
        alt: "Marker lokasi cerita",
      }).addTo(this.map);
    }
    this.marker.off("dragend");
    this.marker.on("dragend", () => {
      const point = this.marker.getLatLng();
      this.selectLocation(point.lat, point.lng);
    });
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError("Browser tidak mendukung geolokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.selectLocation(coords.latitude, coords.longitude);
        this.map.setView([coords.latitude, coords.longitude], 14);
      },
      (error) => this.showError(`Lokasi tidak dapat diakses: ${error.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async startCamera() {
    try {
      this.stopCamera();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      const area = document.querySelector("#camera-area");
      const video = document.querySelector("#camera-video");
      area.hidden = false;
      video.srcObject = this.stream;
      await video.play();
    } catch (error) {
      this.showError(`Kamera tidak dapat digunakan: ${error.message}`);
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const video = document.querySelector("#camera-video");
    if (video) video.srcObject = null;
    const area = document.querySelector("#camera-area");
    if (area) area.hidden = true;
  }

  capturePhoto() {
    const video = document.querySelector("#camera-video");
    const canvas = document.querySelector("#camera-canvas");
    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        this.photo = new File([blob], `kisah-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        this.renderPreview();
        this.stopCamera();
      },
      "image/jpeg",
      0.82,
    );
  }

  renderPreview() {
    const preview = document.querySelector("#photo-preview");
    if (!this.photo) {
      preview.innerHTML = "";
      return;
    }
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(this.photo);
    preview.innerHTML = `<img src="${this.previewUrl}" alt="Pratinjau foto yang akan dikirim"><p>${this.photo.name}</p>`;
  }

  setLoading(active) {
    const button = document.querySelector('#story-form [type="submit"]');
    button.disabled = active;
    button.textContent = active ? "Mengirim..." : "Kirim cerita";
  }

  showError(message) {
    document.querySelector("#form-error").textContent = message;
    document
      .querySelector("#form-error")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  }

  onSuccess() {
    this.stopCamera();
    showToast("Cerita berhasil dibagikan.");
    location.hash = "#/";
  }

  requireLogin() {
    location.hash = "#/login";
  }

  destroy() {
    this.stopCamera();
    this.map?.remove();
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
  }
}

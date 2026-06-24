import { StoryApi, SessionModel } from "../../data/api";
import Database from "../../data/database";
import { createMap, L } from "../../utils/map";
import { escapeHtml, showFormattedDate, showToast } from "../../utils";
import HomePresenter from "./home-presenter";

export default class HomePage {
  async render() {
    return `<section class="hero"><div class="container"><div><span class="eyebrow">Cerita dari seluruh negeri</span><h1>Temukan kisah.<br><em>Kenali tempatnya.</em></h1><p>Jelajahi cerita nyata dan momen berharga yang dibagikan komunitas dari berbagai sudut Indonesia.</p><a class="button primary" href="#/add">+ Bagikan cerita</a></div><div class="hero-stat"><strong>Indonesia</strong><span>satu peta, ribuan cerita</span></div></div></section><section class="container content-section" aria-labelledby="stories-heading"><div class="section-heading"><div><span class="eyebrow">Jelajahi</span><h2 id="stories-heading">Cerita terbaru</h2></div><p>Pilih kartu atau marker untuk melihat lokasi terkait.</p></div><div id="stories-status" class="status-box" role="status">Memuat cerita...</div><div id="story-map" class="story-map" aria-label="Peta lokasi cerita"></div><div id="story-list" class="story-grid"></div></section>`;
  }

  async afterRender() {
    this.presenter = new HomePresenter({
      view: this,
      api: StoryApi,
      session: SessionModel,
      database: Database,
    });
    await this.presenter.loadStories();
  }

  requireLogin() {
    location.hash = "#/login";
  }

  showLoading() {
    document.querySelector("#stories-status").hidden = false;
  }

  showError(message) {
    const status = document.querySelector("#stories-status");
    status.className = "status-box error";
    status.textContent = `Gagal memuat cerita: ${message}`;
  }

  showOfflineStories(stories) {
    const status = document.querySelector("#stories-status");
    this.showStories(stories);
    status.hidden = false;
    status.className = "status-box";
    status.textContent =
      "Anda sedang offline. Cerita berikut ditampilkan dari penyimpanan lokal.";
  }

  showStories(stories) {
    const status = document.querySelector("#stories-status");
    if (!stories.length) {
      status.textContent = "Belum ada cerita untuk ditampilkan.";
      return;
    }

    status.hidden = true;
    const list = document.querySelector("#story-list");
    list.innerHTML = stories.map((story) => this.createStoryCard(story)).join("");

    const located = stories.filter(
      (story) => Number.isFinite(story.lat) && Number.isFinite(story.lon),
    );
    if (!located.length) {
      document.querySelector("#story-map").innerHTML =
        '<p class="status-box">Belum ada cerita dengan lokasi.</p>';
      this.bindStoryCards(stories);
      return;
    }

    this.map = createMap("story-map");
    this.markers = new Map();
    const bounds = [];
    located.forEach((story) => {
      const marker = L.marker([story.lat, story.lon], {
        title: `Cerita oleh ${story.name}`,
        alt: `Lokasi cerita ${story.name}`,
      })
        .addTo(this.map)
        .bindPopup(
          `<strong>${escapeHtml(story.name)}</strong><br>${escapeHtml(story.description).slice(0, 100)}`,
        );
      marker.on("click", () => this.focusStory(story.id, false));
      this.markers.set(story.id, marker);
      bounds.push([story.lat, story.lon]);
    });
    this.map.fitBounds(bounds, { padding: [35, 35], maxZoom: 12 });
    this.bindStoryCards(stories);
  }

  createStoryCard(story) {
    const locationText = Number.isFinite(story.lat)
      ? `Pin ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}`
      : "Lokasi tidak dicantumkan";

    return `<article class="story-card" id="story-${story.id}" tabindex="0" data-id="${story.id}"><img src="${story.photoUrl}" alt="Foto cerita oleh ${escapeHtml(story.name)}" loading="lazy"><div class="story-body"><span class="story-date">${showFormattedDate(story.createdAt)}</span><h3>${escapeHtml(story.name)}</h3><p>${escapeHtml(story.description)}</p><span class="coordinates">${locationText}</span><button class="button secondary small save-story" type="button" data-id="${story.id}">Simpan</button></div></article>`;
  }

  bindStoryCards(stories) {
    const list = document.querySelector("#story-list");
    list.querySelectorAll(".story-card").forEach((card) => {
      const activate = () => this.focusStory(card.dataset.id, true);
      card.addEventListener("click", activate);
      card.addEventListener("focus", activate);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });

    list.querySelectorAll(".save-story").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        const story = stories.find((item) => item.id === button.dataset.id);
        await Database.saveStory(story);
        showToast("Cerita disimpan ke IndexedDB.");
      });
    });
  }

  focusStory(id, moveMap) {
    document
      .querySelectorAll(".story-card.active")
      .forEach((card) => card.classList.remove("active"));
    const card = document.querySelector(`#story-${CSS.escape(id)}`);
    card?.classList.add("active");
    const marker = this.markers?.get(id);
    if (marker && moveMap) {
      this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 10));
      marker.openPopup();
    }
    if (!moveMap) card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  destroy() {
    this.map?.remove();
    this.map = null;
  }
}

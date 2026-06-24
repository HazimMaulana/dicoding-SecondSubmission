import Database from "../../data/database";
import { createMap, L } from "../../utils/map";
import { escapeHtml, showFormattedDate, showToast } from "../../utils";

export default class SavedPage {
  stories = [];

  async render() {
    return `<section class="container content-section saved-page" aria-labelledby="saved-heading"><div class="section-heading"><div><span class="eyebrow">IndexedDB</span><h1 id="saved-heading">Cerita tersimpan</h1></div><p>Data di halaman ini disimpan lokal sehingga tetap bisa dibuka saat offline.</p></div><div class="saved-toolbar"><label class="field compact" for="saved-search"><span>Cari cerita</span><input id="saved-search" type="search" placeholder="Nama atau deskripsi"></label><label class="field compact" for="saved-sort"><span>Urutkan</span><select id="saved-sort"><option value="newest">Terbaru disimpan</option><option value="oldest">Terlama disimpan</option><option value="name">Nama pembuat</option></select></label></div><div id="saved-status" class="status-box" role="status">Memuat cerita tersimpan...</div><div id="saved-map" class="story-map" aria-label="Peta cerita tersimpan"></div><div id="saved-list" class="story-grid"></div></section>`;
  }

  async afterRender() {
    this.stories = await Database.getSavedStories();
    document
      .querySelector("#saved-search")
      .addEventListener("input", () => this.populateStories());
    document
      .querySelector("#saved-sort")
      .addEventListener("change", () => this.populateStories());
    this.populateStories();
  }

  populateStories() {
    const status = document.querySelector("#saved-status");
    const list = document.querySelector("#saved-list");
    const mapContainer = document.querySelector("#saved-map");

    this.map?.remove();
    this.map = null;
    mapContainer.innerHTML = "";

    const stories = this.getFilteredStories();
    if (!stories.length) {
      status.hidden = false;
      status.textContent = this.stories.length
        ? "Tidak ada cerita tersimpan yang cocok dengan pencarian."
        : "Belum ada cerita tersimpan. Simpan cerita dari halaman beranda.";
      list.innerHTML = "";
      mapContainer.innerHTML = '<p class="status-box">Belum ada lokasi tersimpan.</p>';
      return;
    }

    status.hidden = true;
    list.innerHTML = stories.map((story) => this.createStoryCard(story)).join("");
    list.querySelectorAll(".delete-story").forEach((button) => {
      button.addEventListener("click", async () => {
        await Database.deleteSavedStory(button.dataset.id);
        this.stories = this.stories.filter((story) => story.id !== button.dataset.id);
        this.populateStories();
        showToast("Cerita dihapus dari IndexedDB.");
      });
    });

    this.renderMap(stories);
  }

  getFilteredStories() {
    const keyword = document.querySelector("#saved-search").value.toLowerCase();
    const sort = document.querySelector("#saved-sort").value;
    const filtered = this.stories.filter((story) => {
      const text = `${story.name} ${story.description}`.toLowerCase();
      return text.includes(keyword);
    });

    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const aTime = new Date(a.savedAt || a.createdAt).getTime();
      const bTime = new Date(b.savedAt || b.createdAt).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }

  createStoryCard(story) {
    const locationText = Number.isFinite(story.lat)
      ? `Pin ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}`
      : "Lokasi tidak dicantumkan";

    return `<article class="story-card"><img src="${story.photoUrl}" alt="Foto cerita oleh ${escapeHtml(story.name)}" loading="lazy"><div class="story-body"><span class="story-date">${showFormattedDate(story.createdAt)}</span><h2>${escapeHtml(story.name)}</h2><p>${escapeHtml(story.description)}</p><span class="coordinates">${locationText}</span><button class="button ghost small delete-story" type="button" data-id="${story.id}">Hapus</button></div></article>`;
  }

  renderMap(stories) {
    const located = stories.filter(
      (story) => Number.isFinite(story.lat) && Number.isFinite(story.lon),
    );

    if (!located.length) {
      document.querySelector("#saved-map").innerHTML =
        '<p class="status-box">Cerita tersimpan belum memiliki lokasi.</p>';
      return;
    }

    this.map = createMap("saved-map");
    const bounds = [];
    located.forEach((story) => {
      L.marker([story.lat, story.lon], {
        title: `Cerita tersimpan oleh ${story.name}`,
        alt: `Lokasi cerita tersimpan ${story.name}`,
      })
        .addTo(this.map)
        .bindPopup(`<strong>${escapeHtml(story.name)}</strong>`);
      bounds.push([story.lat, story.lon]);
    });
    this.map.fitBounds(bounds, { padding: [35, 35], maxZoom: 12 });
  }

  destroy() {
    this.map?.remove();
    this.map = null;
  }
}

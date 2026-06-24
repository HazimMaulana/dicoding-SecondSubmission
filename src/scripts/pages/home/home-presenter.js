export default class HomePresenter {
  constructor({ view, api, session, database }) {
    this.view = view;
    this.api = api;
    this.session = session;
    this.database = database;
  }
  async loadStories() {
    const token = this.session.getToken();
    if (!token) {
      this.view.requireLogin();
      return;
    }
    try {
      this.view.showLoading();
      const response = await this.api.getStories(token);
      const stories = response.listStory || [];
      await this.database.cacheStories(stories);
      this.view.showStories(stories);
    } catch (error) {
      const cachedStories = await this.database.getCachedStories();
      if (cachedStories.length) {
        this.view.showOfflineStories(cachedStories);
        return;
      }
      this.view.showError(error.message);
    }
  }
}

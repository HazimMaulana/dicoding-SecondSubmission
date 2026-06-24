# Deployment GitHub Pages

Proyek ini sudah disiapkan untuk GitHub Pages dengan GitHub Actions.

1. Buat repository baru di GitHub.

2. Inisialisasi Git dan push proyek ini ke branch `main`.

```bash
git init
git add .
git commit -m "Prepare submission project"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA_REPO.git
git push -u origin main
```

3. Buka repository di GitHub, lalu masuk ke `Settings` -> `Pages`.

4. Pada bagian `Build and deployment`, pilih:

```text
Source: GitHub Actions
```

5. Buka tab `Actions`, tunggu workflow `Deploy to GitHub Pages` selesai.

6. URL publik biasanya berbentuk:

```text
https://USERNAME.github.io/NAMA_REPO/
```

7. Ubah `STUDENT.txt` dengan URL publik tersebut.

```text
APP_URL=https://USERNAME.github.io/NAMA_REPO/
MAP_SERVICE_API_KEY=Tidak diperlukan (OpenStreetMap dan CARTO tanpa API key)
```

8. Buka URL publik di browser untuk memastikan aplikasi, manifest, service worker, dan route `#/saved` berjalan.

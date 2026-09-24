# AQIBS WEB2

JKBOSE study portal for Class 10th, 11th and 12th — chapter notes, previous year papers, and textbooks.

Built as a static single-page site so it can live on GitHub Pages with no build step.

## Local preview

Open `index.html` in a browser, or from this folder:

```bash
python -m http.server 5173
```

Then visit http://localhost:5173

## Add real PDFs later

All study items live in [`data.js`](data.js). Each note, paper, and book has:

```js
{
  id: "10-sci-1",
  subject: "sci",
  chapter: "1",
  title: "Chemical Reactions and Equations",
  viewUrl: "",      // paste a Google Drive / PDF.js / hosted PDF link
  downloadUrl: ""   // paste a direct download link
}
```

Empty URLs keep the buttons working: they show a short on-page notice instead of a dead link.

## Publish on GitHub Pages

1. Create a GitHub account if you do not have one, then create a new **public** repository named `aqib-web-2` (no README).
2. In this folder, run:

```bash
git init
git add .
git commit -m "Publish AQIBS WEB2 JKBOSE study portal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aqib-web-2.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

3. On GitHub open the repo → **Settings** → **Pages**.
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
   - Save
5. After a minute the live site is:

`https://YOUR_USERNAME.github.io/aqib-web-2/`

If GitHub Pages asks for a custom 404, you do not need one — this app is a single `index.html`.

## Google search

The live site is already public. Google still needs a few days to list a new site.

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://jan656899-design.github.io/aqib-web-2/`
3. Use the HTML-file method. The file `google3ce6725d59e34104.html` is already on the live site.
4. After it verifies, open **URL Inspection**, paste `https://jan656899-design.github.io/aqib-web-2/`, then click **Request indexing**.
5. Also submit `https://jan656899-design.github.io/aqib-web-2/sitemap.xml`.

Until Google finishes, anyone can still open the site with the live link. Searching `AQIBS WEB2` may take a few days.

## Credit

Developed by Aqib Ali, Sheikh Wadi Pora.

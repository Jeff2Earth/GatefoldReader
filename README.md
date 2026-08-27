# Gatefold Reader — GitHub Pages

Upload these files and folders to the **root of your GitHub repository**:

- `index.html`
- `manifest.json`
- `sw.js`
- `icons/`
  - `icon-192.png`
  - `icon-512.png`

## GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Branch: **main**
5. Folder: **/(root)**
6. Click **Save**.

GitHub will show the Pages address after deployment.

## Android install

Open the GitHub Pages address in Chrome, open the browser menu, then choose
**Install app** or **Add to Home screen**.

The reader caches its required libraries after the first successful online load,
so it can subsequently launch offline from the installed PWA.

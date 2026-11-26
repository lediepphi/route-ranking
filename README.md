# Trekking infographic editor

Run `python server.py` and open `http://127.0.0.1:8765`.

- Poster settings are stored in `config/settings.json`.
- Input images are stored in `assets/`; the active top artwork is `assets/6peaks.png`.
- Six difficulty labels are placed over the peaks.
- The criteria label is `assets/criteria-label.png`; its edge-connected white background is made transparent for the preview and PNG export.
- Seven appearance sliders adjust heading, route, and level-label sizes plus the criteria label's position and scale; values are saved with the poster settings.
- The poster preview uses HTML/CSS; PNG download uses a separate Canvas export renderer and is 2160 pixels wide.
- The “Top 10 đỉnh núi” tab overlays the provided mountain photos on `assets/top10/Top 10 Đỉnh Núi Miền Nam - Tây Nguyên.png` and exports a PNG at the background image's original dimensions. Browser-ready versions of the provided HEIC/JPEG/PNG photos are stored in `assets/top10/crops/`; requested crops emphasize the peaks while keeping their tips visible, and the background is extended where needed.
- Route columns, editable title, and footer are generated from `config/settings.json`.
- Styles are in `styles/main.css`.
- JavaScript behavior is in `app/app.js`, separate from `index.html`.
# Trekking infographic editor

Run `python server.py` and open `http://127.0.0.1:8765`.

- Poster settings are stored in `config/settings.json`.
- Input images are stored in `assets/`; the active top artwork is `assets/6peaks.png`.
- Six difficulty labels are placed over the peaks.
- The criteria label is `assets/criteria-label.png`; its edge-connected white background is made transparent for the preview and PNG export.
- The poster preview uses HTML/CSS; PNG download uses a separate Canvas export renderer and is 2160 pixels wide.
- Route columns, editable title, and footer are generated from `config/settings.json`.
- Styles are in `styles/main.css`.
- JavaScript behavior is in `app/app.js`, separate from `index.html`.
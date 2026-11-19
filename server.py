import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
CONFIG_DIR = ROOT / "config"
SETTINGS_FILE = CONFIG_DIR / "settings.json"
VALID_ICONS = {"box", "check", "x"}
MAX_REQUEST_SIZE = 1_000_000
DEFAULT_APPEARANCE = {
    "subtitleFontSize": 27,
    "titleFontSize": 78,
    "routeFontSize": 14,
    "levelLabelFontSize": 16,
    "criteriaLabelVertical": 30,
    "criteriaLabelHorizontal": 14,
    "criteriaLabelScale": 100,
}
APPEARANCE_RANGES = {
    "subtitleFontSize": (16, 48),
    "titleFontSize": (24, 100),
    "routeFontSize": (9, 24),
    "levelLabelFontSize": (10, 30),
    "criteriaLabelVertical": (0, 200),
    "criteriaLabelHorizontal": (0, 400),
    "criteriaLabelScale": (50, 200),
}


def validate_settings(value):
    if not isinstance(value, dict):
        raise ValueError("Settings must be a JSON object.")

    title = value.get("title")
    footer = value.get("footer")
    groups = value.get("routes")
    appearance = value.get("appearance", {})
    if not isinstance(title, str) or len(title) > 5000:
        raise ValueError("Title must be a string of at most 5000 characters.")
    if not isinstance(footer, str) or len(footer) > 5000:
        raise ValueError("Footer must be a string of at most 5000 characters.")
    if not isinstance(groups, list) or len(groups) != 6:
        raise ValueError("Routes must contain exactly six groups.")
    if not isinstance(appearance, dict):
        raise ValueError("Appearance settings must be an object.")
    if set(appearance) - set(DEFAULT_APPEARANCE):
        raise ValueError("Appearance settings contain unsupported properties.")

    clean_appearance = {}
    for key, default in DEFAULT_APPEARANCE.items():
        setting = appearance.get(key, default)
        minimum, maximum = APPEARANCE_RANGES[key]
        if type(setting) is not int or not minimum <= setting <= maximum:
            raise ValueError(f"{key} must be an integer between {minimum} and {maximum}.")
        clean_appearance[key] = setting

    routes = []
    for group in groups:
        if not isinstance(group, list) or len(group) > 1000:
            raise ValueError("Each route group must be a list of at most 1000 routes.")
        clean_group = []
        for route in group:
            if (
                not isinstance(route, list)
                or len(route) != 2
                or not isinstance(route[0], str)
                or len(route[0]) > 1000
                or not isinstance(route[1], str)
                or route[1] not in VALID_ICONS
            ):
                raise ValueError("Each route must be [name, icon] with a supported icon.")
            clean_group.append([route[0], route[1]])
        routes.append(clean_group)

    return {
        "title": title,
        "footer": footer,
        "routes": routes,
        "appearance": clean_appearance,
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlsplit(self.path).path != "/api/settings":
            return super().do_GET()

        if not SETTINGS_FILE.exists():
            self.send_json(404, {"error": "Settings file does not exist."})
            return

        try:
            settings = validate_settings(json.loads(SETTINGS_FILE.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError, ValueError) as error:
            self.send_json(500, {"error": f"Could not read settings file: {error}"})
            return
        self.send_json(200, settings)

    def do_PUT(self):
        if urlsplit(self.path).path != "/api/settings":
            self.send_json(404, {"error": "Not found."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_REQUEST_SIZE:
                raise ValueError("Request body must be between 1 byte and 1 MB.")
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            settings = validate_settings(payload)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            self.send_json(400, {"error": str(error)})
            return

        try:
            CONFIG_DIR.mkdir(parents=True, exist_ok=True)
            temporary_file = SETTINGS_FILE.with_suffix(".json.tmp")
            temporary_file.write_text(
                json.dumps(settings, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            os.replace(temporary_file, SETTINGS_FILE)
        except OSError as error:
            self.send_json(500, {"error": f"Could not write settings file: {error}"})
            return

        self.send_json(200, {"saved": True})


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = True


def main():
    address = ("127.0.0.1", 8765)
    with LocalServer(address, Handler) as server:
        print(f"Open http://{address[0]}:{address[1]} in your browser.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()

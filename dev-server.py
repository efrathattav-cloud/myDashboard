"""Local development server for LeadFlow.

Same as `python -m http.server`, but tells the browser never to cache files.
Without this, the browser keeps serving old JS and CSS after you edit them.

Usage:  python dev-server.py       (then open http://localhost:8010)

This file is for development only. It is not part of the published site:
GitHub Pages serves index.html, css/ and js/ as plain static files.
"""

import http.server

PORT = 8010


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    print(f"LeadFlow dev server running at http://localhost:{PORT}")
    http.server.test(HandlerClass=NoCacheHandler, port=PORT, bind="127.0.0.1")

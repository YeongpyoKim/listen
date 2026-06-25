import http.server
import socketserver
import webbrowser
from pathlib import Path

PORT = 8000
SITE_DIR = Path(__file__).resolve().parent / "site"

class DualStackServer(socketserver.TCPServer):
    allow_reuse_address = True

class SiteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

def main():
    print(f"[*] Serving site from: {SITE_DIR}")
    print(f"[*] Access URL: http://localhost:{PORT}/")
    
    # Open webbrowser automatically
    try:
        webbrowser.open(f"http://localhost:{PORT}/")
    except Exception as e:
        print(f"[!] Could not open web browser automatically: {e}")

    try:
        with DualStackServer(("", PORT), SiteHandler) as httpd:
            print(f"[+] Local server started on port {PORT}. Press Ctrl+C to stop.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[-] Server stopped by user.")
    except Exception as e:
        print(f"[!] Server error: {e}")

if __name__ == "__main__":
    main()

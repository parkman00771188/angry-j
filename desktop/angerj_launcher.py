from __future__ import annotations

import argparse
import ctypes
import functools
import http.server
import json
import os
import pathlib
import socket
import sys
import threading
import time
import urllib.parse
import urllib.request

APP_NAME = "앵그리 J"
DEFAULT_PORT = int(os.environ.get("ANGRYJ_PORT", "5173"))
BIND_HOST = "0.0.0.0"
LOCAL_HOST = "127.0.0.1"


def app_root() -> pathlib.Path:
    if getattr(sys, "frozen", False):
        return pathlib.Path(getattr(sys, "_MEIPASS"))
    return pathlib.Path(__file__).resolve().parents[1]


def show_error(message: str) -> None:
    try:
        ctypes.windll.user32.MessageBoxW(None, message, APP_NAME, 0x10)
    except Exception:
        print(message, file=sys.stderr)


def log_message(message: str) -> None:
    try:
        log_dir = pathlib.Path(os.environ.get("LOCALAPPDATA", pathlib.Path.home())) / "AngryJ"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "launcher.log"
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        with log_path.open("a", encoding="utf-8") as file:
            file.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass


def get_lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        try:
            ip = socket.gethostbyname(socket.gethostname())
            return ip if not ip.startswith("127.") else "127.0.0.1"
        except OSError:
            return "127.0.0.1"


def find_free_port(start_port: int) -> int:
    for port in range(start_port, start_port + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((BIND_HOST, port))
            except OSError:
                continue
            return port
    raise RuntimeError("사용 가능한 포트를 찾지 못했습니다.")


def wait_until_server_ready(port: int, timeout_seconds: float = 15.0) -> bool:
    deadline = time.time() + timeout_seconds
    url = f"http://{LOCAL_HOST}:{port}/"

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1.5) as response:
                if response.status == 200:
                    return True
        except Exception as exc:
            log_message(f"server not ready: {exc}")
            time.sleep(0.25)

    return False


class AngryJRequestHandler(http.server.SimpleHTTPRequestHandler):
    server_version = "AngryJServer/1.1"

    def log_message(self, format: str, *args: object) -> None:
        return

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/server-info.json":
            self.send_server_info()
            return

        requested = pathlib.Path(urllib.parse.unquote(parsed.path.lstrip("/")))
        full_path = pathlib.Path(self.directory) / requested

        if parsed.path != "/" and not full_path.exists() and "." not in requested.name:
            self.path = "/index.html"

        super().do_GET()

    def send_server_info(self) -> None:
        host_ip = get_lan_ip()
        payload = {
            "appName": APP_NAME,
            "hostIp": host_ip,
            "port": self.server.server_port,
            "localUrl": f"http://{LOCAL_HOST}:{self.server.server_port}",
            "lanUrl": f"http://{host_ip}:{self.server.server_port}",
            "bindHost": BIND_HOST,
            "storage": "localStorage",
            "shell": "webview2",
        }
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class AngryJServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def start_server(dist_dir: pathlib.Path, port: int) -> AngryJServer:
    handler = functools.partial(AngryJRequestHandler, directory=str(dist_dir))
    server = AngryJServer((BIND_HOST, port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def get_webview_storage_path() -> pathlib.Path:
    base = pathlib.Path(os.environ.get("LOCALAPPDATA", pathlib.Path.home()))
    storage_path = base / "AngryJ" / "WebView2"
    storage_path.mkdir(parents=True, exist_ok=True)
    return storage_path


def launch_webview(url: str) -> None:
    try:
        import webview
    except Exception as exc:
        show_error(
            "앵그리 J 창을 여는 데 필요한 WebView 모듈을 불러오지 못했습니다.\n\n"
            f"{exc}"
        )
        return

    log_message(f"opening webview: {url}")
    webview.create_window(
        APP_NAME,
        url,
        width=1440,
        height=920,
        min_size=(1080, 720),
        text_select=True,
    )
    webview.start(
        gui="edgechromium",
        private_mode=False,
        storage_path=str(get_webview_storage_path()),
        debug=False,
    )


def check_webview_runtime() -> bool:
    try:
        import webview  # noqa: F401
    except Exception as exc:
        show_error(f"WebView 모듈 점검에 실패했습니다.\n\n{exc}")
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=f"{APP_NAME} desktop launcher")
    parser.add_argument("--server-only", action="store_true", help="창을 열지 않고 서버만 실행합니다.")
    parser.add_argument("--check-webview", action="store_true", help="WebView 모듈 포함 여부만 확인합니다.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="시작 포트입니다.")
    args = parser.parse_args()

    if args.check_webview:
        return 0 if check_webview_runtime() else 1

    dist_dir = app_root() / "dist"
    index_file = dist_dir / "index.html"
    if not index_file.exists():
        show_error("웹 빌드 결과(dist/index.html)를 찾지 못했습니다. 먼저 npm run build를 실행해주세요.")
        return 1

    try:
        port = find_free_port(args.port)
        server = start_server(dist_dir, port)
        if not wait_until_server_ready(server.server_port):
            server.shutdown()
            server.server_close()
            show_error("앵그리 J 서버가 준비되지 않아 창을 열 수 없습니다.")
            return 1
    except Exception as exc:
        show_error(f"서버를 시작하지 못했습니다.\n\n{exc}")
        return 1

    local_url = f"http://{LOCAL_HOST}:{server.server_port}"
    lan_url = f"http://{get_lan_ip()}:{server.server_port}"
    print(f"{APP_NAME} 서버 실행 중")
    print(f"로컬: {local_url}")
    print(f"같은 네트워크: {lan_url}")

    try:
        if args.server_only:
            threading.Event().wait()
        else:
            launch_webview(local_url)
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

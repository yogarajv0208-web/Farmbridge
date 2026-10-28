"""
FarmBridge Public Shareable Tunnel Launcher
Creates an instant, secure public HTTPS link for FarmBridge using localhost.run / SSH tunnels.
No registration, no tokens, and no interstitial browser warnings.
Automatically copies the public link to your clipboard and opens it in your default browser.
"""

import sys
import os
import re
import time
import subprocess
import urllib.request
import webbrowser

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

PORT = 8000
LOCAL_URL = f"http://127.0.0.1:{PORT}"
HEALTH_URL = f"{LOCAL_URL}/api/health"

def is_local_server_running():
    try:
        with urllib.request.urlopen(HEALTH_URL, timeout=1.5) as res:
            return res.status == 200
    except Exception:
        return False

def ensure_local_server():
    if is_local_server_running():
        print(f"[✓] Local FarmBridge server already running on port {PORT}.")
        return None

    print(f"[*] Starting local FarmBridge server (server.py)...")
    server_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")
    proc = subprocess.Popen(
        [sys.executable, server_script],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    )
    # Wait for server to boot
    for _ in range(15):
        time.sleep(0.5)
        if is_local_server_running():
            print(f"[✓] Local server successfully started at {LOCAL_URL}")
            return proc
    print("[!] Warning: Local server took long to respond, continuing anyway...")
    return proc

def copy_to_clipboard(text):
    try:
        if os.name == "nt":
            p = subprocess.Popen(["clip"], stdin=subprocess.PIPE, shell=True)
            p.communicate(text.encode("utf-8"))
            return True
    except Exception:
        pass
    return False

def main():
    print("=" * 70)
    print("  🌾 FarmBridge - Public Shareable HTTPS Link Generator")
    print("=" * 70)
    print()

    # 1. Ensure local server
    server_proc = ensure_local_server()

    # 2. Check for SSH
    ssh_cmd = "ssh"
    print("[*] Connecting to secure public tunnel relay (localhost.run)...")

    cmd = [
        ssh_cmd,
        "-o", "StrictHostKeyChecking=no",
        "-o", "ServerAliveInterval=30",
        "-o", "ServerAliveCountMax=3",
        "-R", f"80:127.0.0.1:{PORT}",
        "nokey@localhost.run"
    ]

    try:
        tunnel_proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding="utf-8",
            errors="replace"
        )
    except FileNotFoundError:
        print("[X] Error: 'ssh' command was not found on your system.")
        print("    Please install OpenSSH Client (Windows Settings > Optional Features).")
        return

    found_url = None

    try:
        while True:
            line = tunnel_proc.stdout.readline()
            if not line:
                if tunnel_proc.poll() is not None:
                    break
                continue

            match = re.search(r"https://[a-zA-Z0-9.\-]+\.lhr\.life", line)
            if match and match.group(0) != found_url:
                found_url = match.group(0)
                copy_success = copy_to_clipboard(found_url)
                    
                    print("\n" + "=" * 70)
                    print("  🎉 YOUR PUBLIC SHARE LINK IS READY & LIVE!")
                    print("=" * 70)
                    print()
                    print(f"  👉 PUBLIC SHARE LINK:  {found_url}")
                    print(f"  🏠 LOCALHOST LINK:     {LOCAL_URL}")
                    print()
                    if copy_success:
                        print("  📋 [COPIED TO CLIPBOARD!] Press Ctrl+V in WhatsApp/Discord/Browser to share!")
                    else:
                        print("  📋 Copy the link above to share with anyone.")
                    print()
                    print("  🌐 Opening link in your browser...")
                    print("=" * 70)
                    print()

                    try:
                        webbrowser.open(found_url)
                    except Exception:
                        pass
                    continue

            # Print tunnel log / QR code lines cleanly
            if "tunneled with tls" not in line and "Welcome to localhost.run" not in line:
                sys.stdout.write(line)
                sys.stdout.flush()

    except KeyboardInterrupt:
        print("\n[*] Stopping tunnel...")
    finally:
        tunnel_proc.terminate()
        if server_proc:
            server_proc.terminate()
        print("[✓] Tunnel closed.")

if __name__ == "__main__":
    main()

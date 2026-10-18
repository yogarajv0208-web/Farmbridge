"""
Builds a standalone, single-file FarmBridge.html in the project root.
This allows opening the website by simply double-clicking FarmBridge.html
in any browser, with ZERO server, ZERO localhost, and ZERO dependencies.
"""

import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "static")

def build():
    # Read HTML
    with open(os.path.join(STATIC_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()

    # Read CSS
    with open(os.path.join(STATIC_DIR, "css", "styles.css"), "r", encoding="utf-8") as f:
        css = f.read()

    # Read JS modules
    with open(os.path.join(STATIC_DIR, "js", "i18n.js"), "r", encoding="utf-8") as f:
        i18n_js = f.read()

    with open(os.path.join(STATIC_DIR, "js", "sample_data.js"), "r", encoding="utf-8") as f:
        sample_data_js = f.read()

    with open(os.path.join(STATIC_DIR, "js", "parser.js"), "r", encoding="utf-8") as f:
        parser_js = f.read()

    with open(os.path.join(STATIC_DIR, "js", "speech.js"), "r", encoding="utf-8") as f:
        speech_js = f.read()

    with open(os.path.join(STATIC_DIR, "js", "app.js"), "r", encoding="utf-8") as f:
        app_js = f.read()

    # Replace CSS link with inline style
    css_tag = f"<style>\n{css}\n</style>"
    html = html.replace('<link rel="stylesheet" href="css/styles.css">', css_tag)

    # Replace JS script tags with inline scripts
    js_bundle = f"""
  <script>
{i18n_js}
  </script>
  <script>
{sample_data_js}
  </script>
  <script>
{parser_js}
  </script>
  <script>
{speech_js}
  </script>
  <script>
{app_js}
  </script>
"""
    old_scripts = """  <!-- SCRIPTS -->
  <script src="js/i18n.js"></script>
  <script src="js/sample_data.js"></script>
  <script src="js/parser.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/app.js"></script>"""

    if old_scripts in html:
        html = html.replace(old_scripts, f"  <!-- INLINE SCRIPTS (STANDALONE OFFLINE BUNDLE) -->\n{js_bundle}")
    else:
        # Fallback replacement
        for script_name in ["js/i18n.js", "js/sample_data.js", "js/parser.js", "js/speech.js", "js/app.js"]:
            html = html.replace(f'<script src="{script_name}"></script>', '')
        html = html.replace('</body>', f'{js_bundle}\n</body>')

    # Output standalone FarmBridge.html in the root
    output_path = os.path.join(ROOT_DIR, "FarmBridge.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Standalone single-file created: {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    build()

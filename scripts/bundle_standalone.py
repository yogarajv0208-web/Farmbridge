"""
Standalone Bundler for FarmBridge.
Compiles static/index.html, static/css/styles.css, and static/js/*.js
into root index.html and FarmBridge.html for zero-dependency offline & Vercel deployment.
"""

import os
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(ROOT_DIR, "static")

def build_standalone():
    html_src = os.path.join(STATIC_DIR, "index.html")
    css_src = os.path.join(STATIC_DIR, "css", "styles.css")
    
    with open(html_src, "r", encoding="utf-8") as f:
        html = f.read()

    with open(css_src, "r", encoding="utf-8") as f:
        css = f.read()

    # Replace CSS link with inline <style>
    css_tag = '<link rel="stylesheet" href="css/styles.css">'
    inline_style = f"<style>\n{css}\n</style>"
    html = html.replace(css_tag, inline_style)

    # Replace each script src with inline <script>
    scripts = ["i18n.js", "sample_data.js", "parser.js", "speech.js", "app.js"]
    for s in scripts:
        js_path = os.path.join(STATIC_DIR, "js", s)
        with open(js_path, "r", encoding="utf-8") as f:
            js_code = f.read()
        
        src_tag = f'<script src="js/{s}"></script>'
        inline_script = f"<script>\n{js_code}\n</script>"
        html = html.replace(src_tag, inline_script)

    out_index = os.path.join(ROOT_DIR, "index.html")
    out_farmbridge = os.path.join(ROOT_DIR, "FarmBridge.html")

    with open(out_index, "w", encoding="utf-8") as f:
        f.write(html)

    with open(out_farmbridge, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Standalone bundles generated successfully!")
    print(f"  index.html: {len(html)} characters")
    print(f"  FarmBridge.html: {len(html)} characters")

if __name__ == "__main__":
    build_standalone()

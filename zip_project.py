import os, zipfile
project_root = r'D:\hackathon pratice farm bridge'
artifact_dir = r'C:\Users\Yogaraj V\.gemini\antigravity\brain\80993161-4b4d-44b0-978f-f1f718cd6386'
zip_path = os.path.join(project_root, 'FarmBridge_Final.zip')
SKIP_DIRS = {'farmbridgeshare2', 'FarmBridge_Shareable', '__pycache__', '.git', 'scratch'}
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith('.zip') or f == 'zip_project.py':
                continue
            full = os.path.join(root, f)
            zf.write(full, os.path.join('FarmBridge', os.path.relpath(full, project_root)))
print('ZIP created at:', zip_path)

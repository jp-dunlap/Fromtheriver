# Deployment notes

## Nginx configuration

Ensure the Vite manifest files are served directly with the correct MIME type before falling back to the single-page application entry point:

```
location = /manifest.json { try_files /manifest.json =404; add_header Content-Type application/json; }
location = /.vite/manifest.json { try_files /.vite/manifest.json =404; add_header Content-Type application/json; }
location / { try_files $uri /index.html; }
```

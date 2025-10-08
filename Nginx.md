###  Full Guide: Setting Up Nginx for Veiltrace URL Translation on Windows 11

Veiltrace is a symbolic image and data archival system running on Node.js and Express, typically served on port 3000. In production, however, users expect to access it via standard port 80 (HTTP). To bridge this gap, we use **Nginx as a reverse proxy**—a quiet gatekeeper that listens on port 80 and forwards requests to Veiltrace’s internal engine.

This guide will walk you through setting up Nginx on Windows 11 to fulfill the following URL translations:

- `http://localhost/` → `http://localhost:3000/`
- `http://localhost/vt` → `http://localhost:3000/`


#### Step 1: Download and Install Nginx

1. Visit the official Nginx download page: [nginx.org/en/download.html](https://nginx.org/en/download.html)
2. Download the **mainline version** for Windows.
3. Extract the ZIP file to a directory like `C:\nginx`.

You now have Nginx installed locally. No installer is required—just unzip and run.


#### Step 2: Understand the Nginx Folder Structure

Inside `C:\nginx`, you’ll find:

- `conf/nginx.conf`: Main configuration file
- `logs/`: Access and error logs
- `html/`: Default static content
- `nginx.exe`: The executable


#### Step 3: Configure nginx.conf for Reverse Proxy

Open `C:\nginx\conf\nginx.conf` in a text editor. Replace the default `server` block with the following:

```nginx
http {
  include       mime.types;
  default_type  application/octet-stream;
  sendfile        on;
  keepalive_timeout  65;

  server {
    listen 80;

    # Proxy /vt to Veiltrace backend
    location /vt/ {
      proxy_pass http://localhost:3000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy root to Veiltrace backend
    location / {
      proxy_pass http://localhost:3000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
}
```

**Key directives:**
- `proxy_pass`: Forwards requests to your Node.js server
- `proxy_set_header`: Preserves original host and IP

This configuration ensures that both `/vt` and `/` map to Veiltrace’s backend.


#### Step 4: Start Nginx

Open Command Prompt as Administrator:

```bash
cd C:\nginx
start nginx
```

To stop Nginx:

```bash
nginx -s stop
```

To reload config without restarting:

```bash
nginx -s reload
```


#### Step 5: Test the Proxy

1. Start your Node.js server on port 3000.
2. Open a browser and visit:
   - `http://localhost/`
   - `http://localhost/vt`

You should see Veiltrace responding through Nginx.


#### Step 6: Add Logging for Observability

In `nginx.conf`, add access and error logs:

```nginx
access_log logs/access.log;
error_log logs/error.log;
```

This helps you trace incoming requests and diagnose issues.


#### Step 7: Add Limits and Timeouts

To prevent overload:

```nginx
proxy_read_timeout 60s;
client_max_body_size 10M;
```

Place these inside the `location` blocks. This ensures large uploads don’t hang silently.


#### Step 8: Optional HTTPS Setup

If you want to serve Veiltrace over HTTPS:

1. Obtain an SSL certificate (e.g., from Let’s Encrypt or a commercial CA).
2. Add a new `server` block:

```nginx
server {
  listen 443 ssl;
  server_name localhost;

  ssl_certificate     path/to/cert.pem;
  ssl_certificate_key path/to/key.pem;

  location / {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

Restart Nginx to apply changes.


#### Step 9: Clean Up and Maintain

- Use `nginx -t` to test config syntax.
- Rotate logs periodically.
- Monitor `logs/error.log` for proxy failures.


#### Step 10: Troubleshooting Tips

- **Blank page or timeout?** Check if Node.js server is running.
- **403 Forbidden?** Ensure permissions on folders and files.
- **Port conflict?** Make sure no other service is using port 80.


#### Bonus: Multiple Backends

You can proxy `/api` to one server and `/dashboard` to another:

```nginx
location /api/ {
  proxy_pass http://localhost:4000/;
}

location /dashboard/ {
  proxy_pass http://localhost:5000/;
}
```


#### Summary of Key Files

| File | Purpose |
|------|---------|
| `nginx.conf` | Main configuration |
| `access.log` | Request logs |
| `error.log` | Error diagnostics |
| `nginx.exe` | Executable |


### Final Thoughts

With Nginx in place, Veiltrace becomes accessible through standard URLs, shielding its internal engine while honoring the ritual of clarity. You now have a resilient, observable, and production-ready gateway.

If you’d like help adding caching, gzip compression, or load balancing, I can guide you further.

Sources: [virendra.dev](https://virendra.dev/blog/setting-up-nginx-as-a-reverse-proxy-on-windows), [YouTube tutorial](https://www.youtube.com/watch?v=PoZSvt0HIdo), [LightNode guide](https://go.lightnode.com/tech/how-to-configure-nginx-reverse-proxy)


### EOF (2025/10/10)
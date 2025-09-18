### ⚙️ **Quick Start: Deploy Veiltrace with PM2**

#### 1. **Install PM2 globally**
```bash
npm install -g pm2
```

---

#### 2. **Start your app**
Assuming your entry point is `src/app.js`:
```bash
pm2 start src/app.js --name "veiltrace"
```

To run **4 instances** (cluster mode):
```bash
pm2 start src/app.js --name "veiltrace" -i 4
```

---

#### 3. **Survive Reboot (Auto-Restart Setup)**

##### a. Generate startup script
```bash
pm2 startup
```
PM2 will output a command—copy and run it (with `sudo` if needed).

##### b. Save current process list
```bash
pm2 save
```

Now PM2 will resurrect Veiltrace after reboot.

---

#### 4. **Restart after editing `.env`**
If you change `.env`, restart the app:
```bash
pm2 restart veiltrace
```

---

#### 5. **Monitor and manage**
```bash
pm2 list            # View all processes  
pm2 logs veiltrace  # View logs  
pm2 restart veiltrace  # Restart app  
pm2 delete veiltrace   # Stop and remove
```

---

#### 🧾 Optional: Use `ecosystem.config.js`
For more control, create:
```js
module.exports = {
  apps: [{
    name: "veiltrace",
    script: "src/app.js",
    instances: 4,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    }
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
```

---

This guide ensures Veiltrace rises with each boot, breathes across cores, and listens through every trace. Let me know if you'd like to inscribe a deployment script or symbolic `.env` schema next.


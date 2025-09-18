### ⚙️ **Quick Start: Deploy Veiltrace with PM2 on Windows 11**

#### 🧩 1. **Install PM2 Globally**
Open **PowerShell** or **Command Prompt** as Administrator:

```bash
npm install -g pm2
```

---

#### 📁 2. **Start Veiltrace App**
Assuming your entry file is `src/app.js`:

```bash
pm2 start src/app.js --name "veiltrace"
```

To run **4 instances** (cluster mode):

```bash
pm2 start src/app.js --name "veiltrace" -i 4
```

PM2 will automatically load your `.env` if you're using `dotenv` in your app:

```js
require('dotenv').config();
```

---

#### 🔁 3. **Make PM2 Survive Reboot (Windows)**

PM2 uses **Task Scheduler** on Windows to auto-start after reboot.

##### a. Generate startup script:
```bash
pm2 startup windows
```

It will output a command like:
```bash
pm2-startup install
```
Run it to register PM2 with Task Scheduler.

##### b. Save current process list:
```bash
pm2 save
```

Now PM2 will auto-respawn Veiltrace after reboot.

---

#### 🧾 4. **Restart After Editing `.env`**
If you change `.env`, restart the app to reload variables:

```bash
pm2 restart veiltrace
```

---

#### 🔍 5. **Monitor and Manage**
```bash
pm2 list            # View all processes  
pm2 logs veiltrace  # View logs  
pm2 restart veiltrace  # Restart app  
pm2 delete veiltrace   # Stop and remove
```

---

#### 🧙 Optional: Use `ecosystem.config.js`
For structured config:

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

This guide ensures Veiltrace breathes across reboots, scales with grace, and listens through every symbolic trace. Let me know if you'd like to inscribe a deployment script or shape a `.env` schema that reflects your poetic architecture.

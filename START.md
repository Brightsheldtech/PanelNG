# How to Start PanelNG

## Step 1 — Open TWO terminal windows

---

### Terminal 1 (Backend / API server)
```bash
cd /Users/mac/panelng/backend
npm run dev
```
You should see:
```
🚀 PanelNG API running on http://localhost:3001
```

---

### Terminal 2 (Frontend / Website)
```bash
cd /Users/mac/panelng/frontend
npm run dev
```
You should see:
```
VITE ready in 300ms
➜ Local: http://localhost:5173/
```

---

## Step 2 — Open in your browser

Go to: **http://localhost:5173**

You should see the PanelNG landing page.

---

## Step 3 — Open on your phone

1. Find your Mac's local IP address:
   - Open System Settings → Wi-Fi → click the network → copy "IP Address"
   - Or run in terminal: `ipconfig getifaddr en0`

2. Make sure your phone is on the SAME Wi-Fi as your Mac

3. On your phone's browser, go to:
   **http://YOUR_MAC_IP:5173**
   
   Example: `http://192.168.1.5:5173`

4. You also need to expose the backend. In the backend terminal, stop and restart with:
   ```bash
   PORT=5000 npm run dev
   ```
   Then in `frontend/vite.config.js`, the proxy already points to localhost:3001 —
   so the frontend handles the backend connection automatically.

---

## One-command start (both servers together)

From the `/Users/mac/panelng/` root folder:
```bash
npm run dev
```
This starts both backend and frontend at the same time.

---

## Common Problems

| Problem | Fix |
|---------|-----|
| Blank screen | Make sure BOTH terminals are running |
| "Cannot connect" | Check you're in the right folder (`/backend` or `/frontend`) |
| Port in use error | Kill old processes: `pkill -f node` then try again |
| API errors | Backend `.env` file needs your real Supabase/Paystack keys |

---

## Still seeing a blank screen?

Open your browser DevTools (F12 → Console tab) and paste what errors you see.
The most common cause is the backend isn't running.

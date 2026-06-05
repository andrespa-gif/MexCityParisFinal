# Deploying *The Plan and the Price* to Vercel

This site is **static HTML/CSS/JS** (no build step). Vercel serves the project root as-is.

**GitHub repo:** https://github.com/andrespa-gif/MexCityParisFinal

---

## Option A — GitHub + Vercel dashboard (recommended)

Use this if you want every `git push` to auto-deploy.

### 1. Push your latest code to GitHub

In Terminal:

```bash
cd ~/Desktop/MexCity\ Timeline

git status
git add -A
git commit -m "Update site for deployment"
git push origin main
```

If `git push` asks for login, use GitHub CLI (`gh auth login`) or a [Personal Access Token](https://github.com/settings/tokens) as the password.

### 2. Connect the repo on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub account is easiest).
2. Click **Add New… → Project**.
3. Import **`andrespa-gif/MexCityParisFinal`**.
4. Framework Preset: **Other** (no framework).
5. Root Directory: **`.`** (leave default).
6. Build Command: **leave empty**.
7. Output Directory: **leave empty** (static files at repo root).
8. Click **Deploy**.

### 3. Your live URL

After ~1 minute you get a URL like:

`https://mex-city-paris-vxnn.vercel.app`

(or similar — Vercel assigns a name from the repo). **Current production URL:** https://mex-city-paris-vxnn.vercel.app

### 4. Updates later

Whenever you change the site locally:

```bash
cd ~/Desktop/MexCity\ Timeline
git add -A
git commit -m "Describe your change"
git push origin main
```

Vercel rebuilds automatically. Hard-refresh the browser if images or JS look cached (`Cmd+Shift+R`).

---

## Option B — Vercel CLI (deploy without opening the dashboard)

### One-time setup

```bash
npm install -g vercel
cd ~/Desktop/MexCity\ Timeline
vercel login
```

### Deploy

```bash
cd ~/Desktop/MexCity\ Timeline
vercel          # first time: follow prompts, link to existing project or create new
vercel --prod   # production URL
```

CLI reads `vercel.json` in this folder (`cleanUrls: true`).

---

## Project settings (already correct)

| Setting | Value |
|--------|--------|
| `vercel.json` | `cleanUrls: true` — `/methodology` works without `.html` |
| Preview locally | `./preview.sh` → http://127.0.0.1:8765/ |
| Entry page | `index.html` |

No `npm install`, no build command, no environment variables required.

---

## Custom domain (optional)

1. Vercel project → **Settings → Domains**.
2. Add your domain and follow DNS instructions (CNAME to `cname.vercel-dns.com`).

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Blank maps / no data | Site must be served over **HTTPS**, not `file://`. Vercel is fine. |
| Old images after deploy | Hard-refresh or bump `?v=` on script tags in `index.html`. |
| 404 on `/next-steps` | Ensure `next-steps.html` is committed and pushed. |
| Push rejected | `git pull origin main` first, then push again. |

---

## Quick checklist before you post

- [ ] `git push origin main` succeeded
- [ ] Vercel deployment shows **Ready**
- [ ] Open production URL: home, maps, timelines, `/methodology`, `/next-steps`
- [ ] Test on phone or share the Vercel link

---

*ECON 30 · Stanford · Spring 2026*

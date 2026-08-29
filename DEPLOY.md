# Deploying empyr.studio on GitHub Pages

This repo is the **Empyr Studios** site. After cutover it deploys to [empyr.studio](https://empyr.studio) via GitHub Actions.

## Cutover (not done in this PR)

Prep only. This PR updates the repo’s public host, CNAME, sitemap, mailto, and help-worker CORS. It does **not** change live GitHub Pages settings or registrar DNS.

Later, Ops / Chief of Staff (not this PR):

1. Point GitHub Pages custom domain at `empyr.studio` and enable HTTPS after DNS lands.
2. At the registrar, attach the Pages A records below to the **empyr.studio** apex (and optional www CNAME).
3. The old apex **empyr-portfolio.com** must **301** to `https://empyr.studio`. Do not invent a redirect service in this repo; that is a DNS / Pages step after this PR merges.
4. `business@empyr-portfolio.com` still forwards until Google Workspace is cut over. The public site already shows `business@empyr.studio`.

## 1. Create GitHub repositories

Create a public `empyr-portfolio` repository under your GitHub account, then push this project:

```bash
# Portfolio (from this folder)
git init
git add .
git commit -m "Initial Empyr Portfolio site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/empyr-portfolio.git
git push -u origin main

```

## 2. Enable GitHub Pages

1. Open **empyr-portfolio** on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically

## 3. Custom domain (later step — Ops / CoS)

Do not change GitHub Pages or registrar DNS as part of this PR.

1. In **Settings → Pages → Custom domain**, enter `empyr.studio`
2. Enable **Enforce HTTPS** once DNS propagates
3. The `public/CNAME` file in this repo keeps the domain on redeploys

### DNS records (at your domain registrar) — later step

For the **apex** domain `empyr.studio`:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Optional **www** redirect:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `YOUR_USERNAME.github.io` |

DNS can take up to 24 hours to propagate.

## 4. Local build

```bash
npm install
npm run dev
```

## 5. Live URLs after cutover

| Page | URL |
|------|-----|
| Portfolio (NL) | https://empyr.studio/nl |
| Portfolio (EN) | https://empyr.studio/en |
| Template demos | https://empyr.studio/nl/barberhouse |

## Troubleshooting

- **Domain not verified**: Wait for DNS, then re-save the custom domain in GitHub Pages settings.
- **Build fails on Node**: GitHub Actions uses Node 22; match locally with `node -v`.

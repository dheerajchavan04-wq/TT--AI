# Deployment Guide (Hostinger KVM 2 + Coolify + Git Upstream/Fork)

This guide is for deploying the current `G0DM0D3` stack to a Hostinger KVM 2 VPS with Coolify, then maintaining both:

- the original project (`upstream`)
- your updated version (`origin`/fork)

It is written as a copy-paste runbook.

## What You Are Deploying

This repository is a 3-service stack:

- `api` (Express) on container port `7860`
- `web` (Next.js) on container port `3000`
- `proxy` (nginx) on container port `80` routing:
  - `/v1/*` -> `api:7860`
  - `/` -> `web:3000`

Important: The frontend auto-detects API at same-origin `/v1/health`, so your production traffic should go through the `proxy` service domain.

## Official Docs Used (Latest References)

- [Coolify Installation](https://coolify.io/docs/get-started/installation)
- [Coolify Docker Compose Deployments](https://coolify.io/docs/knowledge-base/docker/compose)
- [Hostinger Coolify VPS Template](https://www.hostinger.com/support/9615197-how-to-use-the-coolify-vps-template-at-hostinger/)

---

## 10-Minute Quick Path (Recommended)

1. Use Hostinger VPS image/template that already includes Coolify (or install Coolify manually).
2. Open Coolify UI and create admin user.
3. Connect your GitHub fork/repo.
4. Add a **Docker Compose** resource and point to `docker-compose.yml`.
5. Set these env vars in Coolify:
   - `OPENROUTER_API_KEY` (required)
   - `CORS_ORIGIN` (recommended: your domain, or `*` if needed)
   - `PROXY_PORT=8080` (avoid host port 80 collision on Coolify server)
   - `WEB_PORT=3000` (or another free port)
6. Assign your domain to service `proxy` (container port `80`).
7. Deploy.
8. Validate:
   - `https://your-domain/v1/health`
   - open app in browser and send one test prompt.

If this succeeds, continue to the Git section to keep upstream and your fork cleanly synced.

---

## Detailed Step-by-Step

### 1) Prepare Hostinger KVM 2 VPS

Minimum practical baseline:

- 2 vCPU
- 4+ GB RAM
- 40+ GB disk free
- Ubuntu LTS recommended

If your VPS already has the Hostinger Coolify image:

- access `http://your-vps-ip:3000`
- create admin account
- choose `localhost` during onboarding (deploy to same VPS)

If Coolify is not preinstalled, install per official docs:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

After install, open the URL printed by installer (commonly `:8000`) and create admin immediately.

### 2) DNS and Basic Network

Create DNS `A` record:

- `chat.yourdomain.com` -> `YOUR_VPS_PUBLIC_IP`

On firewall/security group, allow at minimum:

- `22/tcp` (SSH)
- `80/tcp` (HTTP for cert challenge/redirect)
- `443/tcp` (HTTPS)

### 3) Git Setup: Keep Original + Your Updated Version

Goal:

- `upstream` = original repo
- `origin` = your fork/repo where you push your updated code

If not already configured:

```bash
git remote -v
git remote add upstream https://github.com/AiGptCode/G0DM0D3.git
git remote set-url origin https://github.com/YOUR_USERNAME/G0DM0D3.git
git fetch upstream
```

Create/update branch and push to your repo:

```bash
git checkout -b feat/coolify-hostinger-deploy-guide
git add .
git commit -m "docs: add Hostinger Coolify deployment runbook"
git push -u origin feat/coolify-hostinger-deploy-guide
```

When you want latest original changes:

```bash
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main
```

For PR to original repo:

- open PR from your fork branch -> `AiGptCode/G0DM0D3:main`
- do not push directly to upstream unless you are a maintainer.

### 4) Add App in Coolify (Docker Compose Mode)

In Coolify UI:

1. Create Project (for example: `g0dm0d3-prod`)
2. Add Resource -> **Application** -> **Docker Compose**
3. Connect your GitHub repo/fork
4. Branch: choose your deploy branch (example `main`)
5. Compose path: `docker-compose.yml`

Why Compose mode here:

- this repo already defines `api`, `web`, `proxy` together
- nginx in `proxy` enforces correct `/` and `/v1/*` routing
- easiest path to preserve current behavior

Runtime hardening included in current Docker files:

- both `api` and `web` images install `curl` (healthchecks) and `tini` (graceful signal handling)
- `api` and `web` include container healthchecks (`curl -fsS ...`) with retries
- Compose uses `depends_on: condition: service_healthy` to avoid proxy starting before app services are ready
- all services use `stop_grace_period: 30s` to reduce abrupt shutdown issues during redeploys

### 5) Environment Variables in Coolify

Set these first:

- Required:
  - `OPENROUTER_API_KEY=sk-or-v1-...`
- Strongly recommended:
  - `CORS_ORIGIN=https://chat.yourdomain.com`
- Common optional:
  - `GODMODE_API_KEY` or `GODMODE_API_KEYS`
  - `GODMODE_TIER_KEYS`
  - `HF_TOKEN`
  - `HF_DATASET_REPO`
  - `HF_DATASET_BRANCH`
  - `RATE_LIMIT_TOTAL`
  - `RATE_LIMIT_PER_MINUTE`
  - `RATE_LIMIT_PER_DAY`

For host port collisions on Coolify servers:

- set `PROXY_PORT=8080`
- set `WEB_PORT=3000` (or another free port)

Notes:

- Compose is source of truth in Coolify Compose deployments.
- Environment variables referenced in compose are surfaced in Coolify UI.

### 6) Domains and SSL

In the Compose resource services list:

- assign your domain to service `proxy`
- target container port `80`
- enable HTTPS / Let's Encrypt

Do not route user traffic to `web` directly if you want same-origin `/v1/*` behavior out of the box.

### 7) Deploy and Verify

Deploy from Coolify and wait until all services are healthy.

Health model expected on startup:

- `api` becomes healthy first (`/v1/health`)
- `web` becomes healthy second (port `3000` responds)
- `proxy` starts after both healthy and serves external traffic

Run checks from your machine:

```bash
curl -i https://chat.yourdomain.com/v1/health
```

Expected:

- HTTP `200`
- JSON body with health status (for example `{"status":"ok"}`)

Then open:

- `https://chat.yourdomain.com`

Validate:

- app UI loads
- sending prompt works
- ULTRAPLINIAN/CONSORTIUM endpoints work if enabled in your flow

### 8) Post-Deploy Operational Checklist

- In Coolify, verify auto-deploy from your chosen branch is enabled/disabled as desired.
- Back up env vars/secrets in your password manager.
- Monitor CPU/RAM while building (KVM 2 can be tight during image builds).
- Keep one rollback strategy:
  - previous image redeploy in Coolify, or
  - revert commit on branch and redeploy.

---

## Troubleshooting

### App loads but API calls fail

Symptoms:

- UI opens, requests fail with API/network errors

Checks:

- confirm domain points to `proxy` service (not `web`)
- verify `https://your-domain/v1/health` works
- verify `OPENROUTER_API_KEY` exists in Coolify env

### CORS errors

Set:

- `CORS_ORIGIN=https://chat.yourdomain.com`

For quick testing only, use:

- `CORS_ORIGIN=*`

### Deploy fails due to port already in use

Likely host port conflict from compose mappings.

Set in Coolify env:

- `PROXY_PORT=8080`
- `WEB_PORT=3000` (or any free host port)

Then redeploy.

### API service unhealthy because healthcheck fails

The current `Dockerfile` now installs `curl` for healthchecks. If healthchecks still fail, this is usually app startup/config related.

Check:

- `OPENROUTER_API_KEY` is set in Coolify env
- API container logs show successful server start on port `7860`
- `/v1/health` is reachable inside the stack

Then rebuild/redeploy.

### Rate limiting too strict in production

Tune:

- `RATE_LIMIT_TOTAL`
- `RATE_LIMIT_PER_MINUTE`
- `RATE_LIMIT_PER_DAY`

Defaults are conservative and can look like failures under normal team usage.

### Can't push updates cleanly

Re-check remotes:

```bash
git remote -v
```

You should see:

- `origin` -> your fork/repo
- `upstream` -> original `AiGptCode/G0DM0D3`

---

## Recommended Release Workflow (Simple)

1. Develop on `feat/...` branch.
2. Push branch to `origin`.
3. Open PR to original repo when ready.
4. Keep your `main` synced from upstream regularly.
5. Deploy from stable branch/tag in Coolify.

This keeps the original project and your updated version cleanly separated while still allowing contribution upstream.

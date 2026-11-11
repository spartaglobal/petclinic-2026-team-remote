# Environment, deployment and release

Owner: Deployment and release role.
Goal: every laptop and the CI pipeline run the **same versions** against the **same seeded data**, and anyone can get back to a clean state with one command.

## Quick start (new team member)

1. Install and start **Docker Desktop**. Nothing else is required.
2. From the repository root:

   ```bash
   bash scripts/env-up.sh
   ```

   This checks prerequisites, builds the images, starts the API and front end, waits until both are healthy and checks the seed data.
3. Open http://localhost:8080.

| What | Where |
|---|---|
| Front end | http://localhost:8080 |
| API base | http://localhost:9966/petclinic/api |
| Swagger UI | http://localhost:9966/petclinic/swagger-ui.html |
| OpenAPI spec | http://localhost:9966/petclinic/v3/api-docs |
| Health | http://localhost:9966/petclinic/actuator/health |

## Everyday commands

| Task | Command |
|---|---|
| Check this laptop is ready | `bash scripts/check-prereqs.sh` |
| Start / rebuild the service | `bash scripts/env-up.sh` |
| **Reset data to the seed** | `bash scripts/reset.sh` |
| Check the data is the seed | `bash scripts/check-seed.sh` |
| UI + accessibility tests | `docker compose run --rm playwright` |
| API tests (Newman) | `docker compose run --rm newman` |
| ZAP baseline scan | `docker compose run --rm zap` |
| Turn API security on | set `PETCLINIC_SECURITY_ENABLE=true` in `.env`, then `bash scripts/reset.sh` |
| Logs | `docker compose logs -f api` |
| Stop everything | `docker compose down` |

## Reset: when and how

The API uses an in-memory H2 database. Each new API container loads `schema.sql` and `data.sql`, so recreating the container returns all data to the seed. `scripts/reset.sh` does that and then runs `scripts/check-seed.sh` to prove it.

Reset:
- before every full test run (the one-command pipeline should call `scripts/reset.sh` first);
- before the demo, and at 14:25 for the final clean run;
- whenever `check-seed.sh` fails or someone has been adding data by hand.

Tests must not rely on data created by an earlier test run. Tests that create records should create their own and not assume ids beyond the seed.

## Seeded test data (same on every laptop)

Source: `spring-petclinic-rest/src/main/resources/db/h2/data.sql`. `check-seed.sh` checks these counts.

| Resource | Seeded count |
|---|---|
| owners | 10 |
| pets | 13 |
| visits | 4 |
| vets | 6 |
| pet types | 6 |
| specialties | 3 |
| users (for security on) | 1, with roles in the `roles` table (3 rows) |

All seeded records are fictional. Any record a test creates on purpose with invalid data must be labelled as such (ground rule: no real personal data).

## Pinned versions

All container versions live in **`.env`** at the repo root. Change them there only, and add a line to the change log below.

| Tool | Version | Where it is pinned |
|---|---|---|
| Java (Eclipse Temurin) | 21.0.13_9 | `.env` → `deploy/api.Dockerfile`; CI uses Java 21 |
| Maven | 3.10.0 | `spring-petclinic-rest/.mvn/wrapper/maven-wrapper.properties` |
| Node | 24.22.2 | `.env` → front end, Playwright and Newman images; `.nvmrc` says `24` |
| nginx | 1.31.8 | `.env` → `deploy/frontend.Dockerfile` |
| Playwright | 1.64.1 | `spring-petclinic-angular/package-lock.json` |
| @axe-core/playwright, Angular, Vitest | per lock file | `spring-petclinic-angular/package-lock.json` (always use `npm ci`, not `npm install`) |
| Newman / htmlextra | 6.2.3 / 1.23.1 | `.env` → `deploy/newman.Dockerfile` |
| OWASP ZAP | 2.17.0 | `.env` → `compose.yaml` |

Stronger pinning (optional): after the first successful build, record image digests with
`docker image inspect --format '{{index .RepoDigests 0}}' <image>` and pin `image@sha256:...`.

### Running outside Docker

Allowed for quick local work, but the containers are the reference. If something passes locally and fails in a container, the container result counts.
- Java 21 or newer. `mvnw` is not executable in the repo; use `sh ./mvnw ...`.
- Node 24.x (`nvm use` reads `.nvmrc`; or `brew install node@24`). Node 22.14 is rejected by the Angular CLI.

## Container images

| Image | Built from | Purpose |
|---|---|---|
| `petclinic-api:local` | `deploy/api.Dockerfile` | REST API on :9966, health check on `/actuator/health` |
| `petclinic-frontend:local` | `deploy/frontend.Dockerfile` + `deploy/nginx.conf` | Built Angular app on :8080 |
| `petclinic-playwright:local` | `deploy/playwright.Dockerfile` | Playwright + axe runner; starts its own dev server |
| `petclinic-newman:local` | `deploy/newman.Dockerfile` | Postman collection runner |
| `zaproxy/zap-stable:2.17.0` | upstream | Passive baseline scan only |

The test runners share the API container's network, so `localhost:9966` inside them is the API. Existing configs (Postman env, Playwright config, Angular environment) work without changes.

## Environment issues found during set-up

Log these through the defect workflow, classified as **environment or data problem** unless the team decides otherwise.

1. `spring-petclinic-angular/Dockerfile` copies `dist/` to the nginx web root, but the Angular builder writes the app to `dist/browser/`, so the image serves no page at `/`. It also pins nginx 1.17.6 (2019) and has no fallback for Angular routes, so deep links like `/owners` would 404. Our `deploy/frontend.Dockerfile` avoids all three.
2. The brief says the front end is on :8080 and "starts with one command"; the repo as given had no container set-up and `npm start` serves on :4200.
3. `mvnw` is committed without execute permission (`permission denied: ./mvnw`).
4. `.nvmrc` says only `24`; Node 22.14 fails with the Angular CLI. Exact versions are now pinned in `.env`.
5. `spring-petclinic-rest/.gitignore` lists `./src/test/postman/reports/`; git ignores patterns that start with `./`, so Newman reports may get committed.
6. With security on, the front end sends no credentials, so UI calls will fail with 401. Expected, but say so in the strategy.

## Change log

| Date | Change | By | Reviewed by |
|---|---|---|---|
| 2026-11-11 | Initial container set-up, scripts and this document (drafted by AI agent, see agent log) | | |

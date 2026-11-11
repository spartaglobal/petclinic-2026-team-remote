# Playwright + axe-core test runner. Build context: spring-petclinic-angular/
#
# Built on the same Node as .nvmrc (the Angular CLI refuses older Node), then installs
# the Chromium build that matches the Playwright version in package-lock.json.
# playwright.config.ts starts its own dev server (npm start) inside this container.
ARG NODE_VERSION=24.22.2
FROM docker.io/library/node:${NODE_VERSION}-bookworm

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund \
 && npx playwright install --with-deps chromium

COPY . .
CMD ["npx", "playwright", "test"]

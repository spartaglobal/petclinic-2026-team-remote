# Petclinic Angular front end served by nginx on :8080.
# Build context: spring-petclinic-angular/   Extra context "deploy": ./deploy
#
# Used instead of spring-petclinic-angular/Dockerfile, which pins nginx 1.17.6 (2019)
# and copies dist/ to the web root, but this Angular builder writes the app to
# dist/browser/, so that image serves no page at "/".
ARG NODE_VERSION=24.22.2
ARG NGINX_VERSION=1.31.8

FROM docker.io/library/node:${NODE_VERSION}-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build -- --configuration production

FROM docker.io/library/nginx:${NGINX_VERSION}-alpine
COPY --from=deploy nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/browser/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --retries=12 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

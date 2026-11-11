# Newman (Postman CLI) API test runner with pinned versions.
# The collection and environment are mounted at /etc/newman by compose.yaml.
ARG NODE_VERSION=24.22.2
FROM docker.io/library/node:${NODE_VERSION}-alpine

ARG NEWMAN_VERSION=6.2.3
ARG NEWMAN_HTMLEXTRA_VERSION=1.23.1
RUN npm install -g --no-audit --no-fund \
      newman@${NEWMAN_VERSION} \
      newman-reporter-htmlextra@${NEWMAN_HTMLEXTRA_VERSION}

WORKDIR /etc/newman
ENTRYPOINT ["newman"]

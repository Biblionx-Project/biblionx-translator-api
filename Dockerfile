FROM node:20-alpine AS build

RUN apk --no-cache add python3 make g++

COPY . /src
WORKDIR /src

RUN npm ci \
  && npm run build \
  && npm prune --production

FROM node:20-alpine

LABEL maintainer="Biblionx Team" \
      org.opencontainers.image.title="Biblionx Translator API" \
      org.opencontainers.image.description="Biblionx Translation Service API" \
      org.opencontainers.image.vendor="Biblionx"

WORKDIR /app

COPY --from=build /src/node_modules node_modules
COPY --from=build /src/dist dist

ENV DEBUG biblionx-translator-*:*,vlibras-translator-*:*
ENV NODE_ENV production

CMD ["node", "./dist/index.js"]

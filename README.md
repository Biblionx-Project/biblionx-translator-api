# Biblionx Translator API

*REST API for translating written Spanish (Dominican Republic) into Dominican Sign Language (LSRD, Lengua de Señas Dominicana).*

![Version](https://img.shields.io/badge/version-v2.4.0-blue.svg)
![License](https://img.shields.io/badge/license-LGPLv3-blue.svg)

Biblionx Translator API is part of [Biblionx](https://github.com/Biblionx-Project), a UNICDA thesis project (Trabajo de Grado). It is the HTTP entry point of the Biblionx translation architecture: it receives translation, review and video requests, dispatches them over RabbitMQ to the worker services, caches results in Redis and stores requests, reviews and usage statistics in MongoDB.

The project's active, functional component is [`biblionx-lsrd-translator`](https://github.com/Biblionx-Project/biblionx-lsrd-translator). This repository is kept as an architecture reference component of the Biblionx ecosystem.

## Table of Contents

- **[Architecture](#architecture)**
- **[API Endpoints](#api-endpoints)**
- **[Getting Started](#getting-started)**
  - [Prerequisites](#prerequisites)
  - [Installing](#installing)
  - [Running](#running)
  - [Running with Docker Compose](#running-with-docker-compose)
- **[Configuration](#configuration)**
- **[Deployment (Kubernetes)](#deployment-kubernetes)**
- **[Documentation](#documentation)**
- **[Contributors](#contributors)**
- **[Origins](#origins)**

## Architecture

```
client ──HTTP──> Biblionx Translator API ──AMQP──> translate.to_text  ──> Biblionx Translator Text Core
                      │      │                └──> translate.to_video ──> video rendering worker
                      │      └── Redis (translation cache)
                      └── MongoDB (translations, reviews, videos, hit statistics)
```

- **Text translation** requests are published to the `TRANSLATOR_QUEUE` (`translate.to_text` by default), which is consumed by [`biblionx-translator-text-core`](https://github.com/Biblionx-Project/biblionx-translator-text-core). Replies come back through RabbitMQ direct reply-to (`API_CONSUMER_QUEUE`).
- **Video generation** requests are published to the `VIDEOMAKER_QUEUE` (`translate.to_video` by default) and require a video rendering worker consuming that queue.
- If no consumer is attached to the target queue, the API responds with HTTP 500 (service unavailable).

## API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/translate` | Translates a text into an LSRD gloss (`text`, max 5000 characters) |
| `POST` | `/review` | Submits a review of a translation (`rating`: `good` / `bad`) |
| `POST` | `/video` | Queues the generation of a sign video from a gloss |
| `GET` | `/video/status/:requestUID` | Returns the status of a video generation request (UUID v4) |
| `GET` | `/video/download/:requestUID` | Downloads a generated video |
| `GET` | `/metrics` | Usage metrics |
| `GET` | `/healthcheck` | Liveness check (returns `200`) |
| `GET` | `/docs` | Interactive OpenAPI (Swagger UI) documentation |

Example:

```sh
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola, ¿cómo estás?"}'
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (the Docker image uses Node.js 20)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [RabbitMQ](https://www.rabbitmq.com/)
- A running [Biblionx Translator Text Core](https://github.com/Biblionx-Project/biblionx-translator-text-core) worker for `/translate`

On Debian/Ubuntu, Redis and RabbitMQ are available from the distribution repositories:

```sh
sudo apt update
sudo apt install -y redis-server rabbitmq-server
```

For MongoDB, follow the [official installation guide](https://www.mongodb.com/docs/manual/administration/install-on-linux/) for your distribution, then start it:

```sh
sudo systemctl start mongod
```

Alternatively, skip the local installs and use [Docker Compose](#running-with-docker-compose).

### Installing

```sh
npm install
```

### Running

Development mode builds the sources with Babel into `dist/` and starts the server with debug logging enabled. It reads its configuration from `src/config/environments/.env.dev` (copied to `dist/` on build), which points to MongoDB, Redis and RabbitMQ on `localhost`:

```sh
npm run dev
```

Production mode runs the previously built `dist/` and reads configuration from the process environment only:

```sh
npm run build
npm start
```

The server listens on port `3000` by default.

### Running with Docker Compose

`docker-compose.yml` builds the API image (`biblionx/translator-api:2.4.0`) and starts it together with MongoDB, Redis and RabbitMQ:

```sh
docker compose up --build
```

The API is then available at `http://localhost:3000`. The RabbitMQ credentials can be overridden with `AMQP_USER` / `AMQP_PASS` (and `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` for the broker) in your shell or a `.env` file next to `docker-compose.yml`.

## Configuration

Configuration is resolved in `src/config/environments/environment.js`. Every variable can be set either with a `BIBLIONX_` prefix or with its standard name; the prefixed name takes precedence. In development mode (`NODE_ENV=dev`) values from `.env.dev` take precedence over the shell environment. `.env.example` lists every variable with Docker-oriented values.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BIBLIONX_PORT` / `PORT` | HTTP server port | `3000` |
| `BIBLIONX_LOGGER_FORMAT` / `LOGGER_FORMAT` | [morgan](https://github.com/expressjs/morgan) request log format | `combined` |
| `BIBLIONX_DB_HOST` / `DB_HOST` | MongoDB host | `localhost` |
| `BIBLIONX_DB_PORT` / `DB_PORT` | MongoDB port | `27017` |
| `BIBLIONX_DB_NAME` / `DB_NAME` | MongoDB database name | `biblionx-db` |
| `BIBLIONX_DB_USER` / `DB_USER` | MongoDB user (only if authentication is enabled) | — |
| `BIBLIONX_DB_PASS` / `DB_PASS` | MongoDB password (only if authentication is enabled) | — |
| `BIBLIONX_CACHE_HOST` / `CACHE_HOST` | Redis host | `localhost` |
| `BIBLIONX_CACHE_PORT` / `CACHE_PORT` | Redis port | `6379` |
| `BIBLIONX_CACHE_NAME` / `CACHE_NAME` | Redis client connection name | `biblionx-cache` |
| `BIBLIONX_CACHE_PASS` / `CACHE_PASS` | Redis password (only if authentication is enabled) | — |
| `BIBLIONX_CACHE_SIZE` / `CACHE_SIZE` | Redis `maxmemory`, in bytes | `104857600` (100 MB) |
| `BIBLIONX_CACHE_EXP` / `CACHE_EXP` | Cache entry expiration, in seconds | `604800` (one week) |
| `BIBLIONX_AMQP_PROTOCOL` / `AMQP_PROTOCOL` | `amqp` or `amqps` | `amqp` |
| `BIBLIONX_AMQP_HOST` / `AMQP_HOST` | RabbitMQ host | `localhost` |
| `BIBLIONX_AMQP_PORT` / `AMQP_PORT` | RabbitMQ port | `5672` |
| `BIBLIONX_AMQP_USER` / `AMQP_USER` | RabbitMQ user | `guest` |
| `BIBLIONX_AMQP_PASS` / `AMQP_PASS` | RabbitMQ password | `guest` |
| `BIBLIONX_TRANSLATOR_QUEUE` / `TRANSLATOR_QUEUE` | Text translation queue | `translate.to_text` |
| `BIBLIONX_VIDEOMAKER_QUEUE` / `VIDEOMAKER_QUEUE` | Video generation queue | `translate.to_video` |
| `BIBLIONX_API_CONSUMER_QUEUE` / `API_CONSUMER_QUEUE` | Reply queue (changing it may break message consumption) | `amq.rabbitmq.reply-to` |

## Deployment (Kubernetes)

Manifests are in the `kubernetes/` directory. Deploy Biblionx Translator Text Core (and a video rendering worker, if `/video` is needed) beforehand. If MongoDB and RabbitMQ already run in your cluster, skip to the API server step.

Start MongoDB and RabbitMQ. The MongoDB manifest uses an `emptyDir` volume and the RabbitMQ manifest has no volume, so data is not persisted; configure persistent volumes for production use.

```sh
kubectl apply -f kubernetes/mongo.yaml
kubectl expose rc mongo-controller --type=ClusterIP

kubectl apply -f kubernetes/rabbitmq.yaml
kubectl expose deployment rabbitmq --type=ClusterIP
```

Edit `kubernetes/translator-api-server-template.yaml` and set the environment variables to match your cluster:

```yaml
- name: AMQP_HOST
  value: "RABBITMQ-IP"
- name: AMQP_PORT
  value: "RABBITMQ-PORT"
- name: PORT
  value: "API-PORT"
- name: DB_HOST
  value: "MONGODB-IP"
- name: DB_PORT
  value: "MONGODB-PORT"
```

Then start and expose the API server:

```sh
kubectl apply -f kubernetes/translator-api-server-template.yaml
kubectl expose deployment translatorapi --port=80 --type=LoadBalancer
```

## Documentation

With the server running, the interactive API documentation is available at [http://localhost:3000/docs](http://localhost:3000/docs). The OpenAPI specification is in `src/app/doc/openapi.json`.

## Contributors

Biblionx team (UNICDA): [@MiraP7](https://github.com/MiraP7), [@Jose-hub-design](https://github.com/Jose-hub-design), [@wilkinvasquez](https://github.com/wilkinvasquez).

## Origins

This project was initially forked from the open-source VLibras project. It has since evolved enough to stand as an independent project of its own. Licensed under LGPLv3 — see [LICENSE](LICENSE).

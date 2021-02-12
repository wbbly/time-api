# Wobbly API

## Pre-requisites

- [Docker](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Usage

- Clone this repo on a machine where you'd like to deploy api application
- Copy `docker/nginx/nginx.conf.dist` to `docker/nginx/nginx.conf`
- Copy `docker-compose.override.yml.dist` to `docker-compose.override.yml`
- Copy `docker-compose.yml.dist` to `docker-compose.yml`
- Edit `docker/nginx/nginx.conf` and change '127.0.0.1' with Wobbly API domain
- Edit `docker-compose.override.yml` and change `MAILER_USER`, `MAILER_PASSWORD`, `MAILER_SMTP`, `MAILER_SENDER_NAME`, `MAILER_SENDER_EMAIL`, `MAILER_MANAGER_EMAIL` values
- Edit `docker-compose.override.yml` and change 'GRAPHQL_URL' value with Wobbly GraphQL Engine domain name [eg. `http://127.0.0.1:8080/v1/graphql`]
- Edit `docker-compose.override.yml` and change `GRAPHQL_ACCESS_KEY` to `HASURA_GRAPHQL_ADMIN_SECRET` value [look at the Wobbly GraphQL Engine instance]
- Edit `docker-compose.override.yml` and change 'APP_URL' value with Wobbly Frontend domain name [eg. `http://127.0.0.1`]
- Edit `docker-compose.override.yml` and change `JWT_SECRET_KEY` to something secure
- Edit `docker-compose.override.yml` and change `ENCRYPTION_CRYPTO_KEY` and `ENCRYPTION_CRYPTO_IV` [follow the instructions here https://github.com/nodejs/node/issues/16746#issuecomment-348027003]
- Edit `docker-compose.override.yml` and change `BILLWERK_CLIENT_ID`, `BILLWERK_CLIENT_SECRET`, `BILLWERK_HOST` values
- `docker-compose up -d --build`
- `docker exec -ti <nodejs-docker-container> bash -c 'npm install'`
- `docker exec -ti <nodejs-docker-container> bash -c 'npm run start:prod'`

## Important endpoints

- Frontend application will be `http://127.0.0.1:8081`

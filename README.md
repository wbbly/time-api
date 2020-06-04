# Wobbly Time API

## CLONE REPO

```
git clone git@github.com:wbbly/time-api.git
cd lazy-time-api
```

## CREATE APP CONFIG FILES

```
cp docker/nginx/nginx.conf.dist docker/nginx/nginx.conf
cp docker-compose.override.yml.dist docker-compose.override.yml
cp docker-compose.yml.dist docker-compose.yml
```

## BUILD APPLICATION

- in dev mode

```
docker-compose up -d --build
docker exec -ti <nodejs-docker-container> bash -c 'npm install'
docker exec -ti <nodejs-docker-container> bash -c 'npm start'
```

- in prod mode

```
docker-compose up -d --build
docker exec -ti <nodejs-docker-container> bash -c 'npm install'
docker exec -ti <nodejs-docker-container> bash -c 'npm run start:prod'
```

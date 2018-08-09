FROM node:8 as build

LABEL maintainer "Florent FAUCHILLE <florentfauchille@gmail.com>"

COPY . /app
WORKDIR /app

ENV MONGO_URI mongodb://localhost:27017
ENV MONGO_DB_NAME nlutrainer
ENV RASA_ENDPOINT http://localhost:5000
ENV HTTP_ALLOW_HEADERS "GET, OPTIONS, POST, DELETE"
ENV HTTP_ALLOW_ORIGINS "*"
ENV HTTP_EXPOSED_HEADERS "GET, OPTIONS, POST, DELETE"

RUN npm install && npm run build:dist

FROM node:8

RUN mkdir -p /app/data

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/built /app/built

CMD [ "node", "built/server.js" ]
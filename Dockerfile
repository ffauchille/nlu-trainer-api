FROM node:8

LABEL maintainer "Florent FAUCHILLE <florentfauchille@gmail.com>"

COPY . /app
WORKDIR /app

RUN npm install

CMD [ "npm", "start" ]
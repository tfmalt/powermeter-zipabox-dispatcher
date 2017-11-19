FROM node:carbon-alpine
MAINTAINER thomas@malt.no

RUN mkdir -p /usr/lib/power
WORKDIR /usr/lib/power

COPY . /usr/lib/power
RUN npm install

ENV NODE_ENV=docker
ENV DEBUG=power-meter:*

CMD npm start

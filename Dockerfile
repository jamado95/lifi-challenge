FROM node:hydrogen-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY ./src ./src
COPY tsconfig.json ./

RUN npm run build

ARG debug
ARG port=8080
ARG mongodb_url

ENV DEBUG $debug
ENV MONGODB_URL $mongodb_url
ENV PORT $port

ENV BLOCKCHAIN=POLYGON
ENV POLYGON_PROVIDER_URL=https://polygon-rpc.com
ENV POLYGON_FEE_COLLECTOR_CONTRACT=0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9

EXPOSE $PORT

CMD ["npm", "start"]
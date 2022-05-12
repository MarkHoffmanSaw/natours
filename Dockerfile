FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "NODE_ENV=production","node", "server.js" ]
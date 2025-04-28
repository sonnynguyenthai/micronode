# use the official nodejs 18 image with alpine linux as base image
FROM node:18-alpine

WORKDIR /use/src/app

COPY package*.json ./

#   dont need to instal dev dependencies
RUN npm ci --only=production

COPY . .

EXPOSE 3000 

CMD ["node", "src/server.js"]
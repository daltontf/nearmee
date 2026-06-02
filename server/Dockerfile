FROM node:18
WORKDIR /app
COPY server/package.json ./
COPY server/tsconfig.json ./
COPY server/src ./src
WORKDIR /app/server
RUN npm install
RUN npm run build

# Build client
RUN mkdir client
WORKDIR /app/client
COPY client/package.json ./
COPY client/tsconfig.json ./
COPY client/*.js ./
COPY client/*.ts ./
COPY client/*.html ./
COPY client/src ./src
RUN npm install
RUN npm run build

WORKDIR /app
RUN cp -r client/dist ./client-dist

EXPOSE 3001
CMD ["node", "src/index.js"]
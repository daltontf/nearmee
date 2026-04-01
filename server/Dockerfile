FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm run build
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
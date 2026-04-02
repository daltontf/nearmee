FROM node:18
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY src/ ./
RUN npm install
RUN npm run build
EXPOSE 3001
CMD ["node", "src/index.js"]
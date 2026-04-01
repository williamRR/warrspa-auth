FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --noUnusedLocals false
EXPOSE 3002
CMD ["node", "dist/server.js"]

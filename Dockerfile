FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY dashboard.html .
COPY server.js .
COPY variables_n8n.json .
EXPOSE 3000
CMD ["node", "server.js"]

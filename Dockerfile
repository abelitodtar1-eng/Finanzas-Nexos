FROM node:18-alpine
WORKDIR /app
COPY dashboard.html .
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]

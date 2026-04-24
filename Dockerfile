FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app
COPY . .
RUN npm install

# Expose port 3000
EXPOSE 3000

CMD ["node", "index.js"]

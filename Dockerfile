FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS api
ENV NODE_ENV=production
COPY prisma.config.js ./
COPY api ./api
RUN npm run prisma:generate
EXPOSE 3001
CMD ["sh", "-c", "npm run prisma:deploy && npm run prisma:seed && npm run start:api"]

FROM dependencies AS web-build
COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY web ./web
RUN npx tsc --noEmit && npx vite build

FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

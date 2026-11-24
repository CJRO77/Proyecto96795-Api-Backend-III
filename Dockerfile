# ==========================================
# ETAPA 1: Dependencias de producción
# ==========================================

FROM node:24-alpine AS production-deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# ==========================================
# ETAPA 2: Imagen final de ShipNow
# ==========================================

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules

COPY package*.json ./

COPY --chown=node:node src ./src

RUN mkdir -p uploads logs \
    && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]

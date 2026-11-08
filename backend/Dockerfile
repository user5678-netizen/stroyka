FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS development
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN chown -R node:node /usr/src/app
USER node
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM node:20-bookworm-slim AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /usr/src/app/dist ./dist
RUN chown -R node:node /usr/src/app
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

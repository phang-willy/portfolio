FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build

WORKDIR /app

ARG APP_TITLE=Portfolio
ARG NEXT_PUBLIC_CONTACT_API_ORIGIN=
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG PROJECTS_JSON_URL=
ARG SITE_URL=http://localhost:3000
ARG CARTO_API_KEY=

ENV APP_TITLE=$APP_TITLE
ENV NEXT_PUBLIC_CONTACT_API_ORIGIN=$NEXT_PUBLIC_CONTACT_API_ORIGIN
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV PROJECTS_JSON_URL=$PROJECTS_JSON_URL
ENV SITE_URL=$SITE_URL
ENV CARTO_API_KEY=$CARTO_API_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV SERVER_PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts

EXPOSE 3000

CMD ["npm", "run", "start"]

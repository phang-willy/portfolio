FROM node:22.23.4-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
RUN apk add --no-cache git

FROM node:22.23.4-alpine AS build

WORKDIR /app

ARG APP_TITLE=Portfolio
ARG NEXT_PUBLIC_CONTACT_API_ORIGIN=
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG SITE_URL=http://localhost:3000
ARG CARTO_API_KEY=
ARG SITE_NOINDEX=false
ARG SITEMAP_COMMIT_DATE=

ENV APP_TITLE=$APP_TITLE
ENV NEXT_PUBLIC_CONTACT_API_ORIGIN=$NEXT_PUBLIC_CONTACT_API_ORIGIN
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV SITE_URL=$SITE_URL
ENV CARTO_API_KEY=$CARTO_API_KEY
ENV SITE_NOINDEX=$SITE_NOINDEX
ENV SITEMAP_COMMIT_DATE=$SITEMAP_COMMIT_DATE

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22.23.4-alpine AS runtime

WORKDIR /app

ARG SITEMAP_COMMIT_DATE=

ENV NODE_ENV=production
ENV PORT=3000
ENV SERVER_PORT=3000
ENV SITE_NOINDEX=false
ENV SITEMAP_COMMIT_DATE=$SITEMAP_COMMIT_DATE

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts

EXPOSE 3000

CMD ["npm", "run", "start"]

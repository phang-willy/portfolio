# 🚀 Portfolio

Un espace vivant pour raconter mon parcours, partager mes projets et montrer
ma façon de concevoir le web.

## 🧭 Présentation du projet

Ce portfolio est mon terrain d'expression : un mélange de design, de code et
d'intention. Je l'ai construit avec Next.js et TypeScript pour présenter qui je
suis, ce que je crée, et comment j'accompagne des projets de A à Z.

Il met en avant :

- une section de présentation avec animations progressives
- mes services en développement Full Stack, FrontEnd, BackEnd et E-commerce
- mon parcours professionnel avec une timeline d'expériences
- une galerie de projets avec interactions au survol
- un message personnel et des points de contact rapides

Mon objectif : proposer une vitrine personnelle, claire et soignée, qui reflète
autant ma sensibilité produit que ma rigueur technique.

## 📦 Stack technique

- ⚡ Next
- ⚛️ React
- 🟦 TypeScript
- 🎨 Tailwind CSS
- 🎯 ESLint + Prettier
- 🔒 Git hooks (signature obligatoire des commits)
- 😊 Icons via React Icons

---

## 🎯 Objectif

Ce starter a pour but de :

- accélérer la création de nouveaux projets
- garantir une base de code cohérente
- imposer des standards de qualité
- faciliter la maintenabilité et l’évolution

---

## 📁 Structure du projet

```
.
├─ public/                 # assets statiques (images projets dans public/project/, etc.)
├─ scripts/
│  ├─ next-with-server-port.mjs
│  ├─ github-token-expiry-reminder.mjs   # rappel e-mail (Brevo) avant expiration du PAT GitHub
│  └─ generate-sitemap-xml.ts            # génère public/sitemap.xml (via npm run generate:sitemap)
├─ src/
│  ├─ app/
│  │  └─ api/contact/     # Route Handlers minces → ré-exportent lib/server/*-route-handlers
│  ├─ components/
│  ├─ data/
│  ├─ features/
│  ├─ lib/
│  │  ├─ server/           # logique HTTP contact (TS)
│  │  └─ …                 # schémas, Brevo, rate-limit, github-stats…
│  └─ …
├─ package.json
└─ next.config.ts
```

---

## ⚙️ Installation

```bash
git clone <repo-url>
cd <project-name>/front
npm install
```

---

## 🚀 Lancement

```bash
npm run dev
```

---

## 🧪 Scripts disponibles

```bash
npm run dev            # dev Turbopack (port via scripts/next-with-server-port.mjs)
npm run build          # pré-génère le sitemap puis next build (voir ci-dessous)
npm run start          # serveur Next après build (hors export pur FTP)
npm run lint           # ESLint
npm run type-check     # tsc --noEmit
npm run format:check   # Prettier en lecture seule
npm run format:write   # Prettier en écriture
npm run generate:sitemap              # écrit public/sitemap.xml (tsx)
npm run remind:github-token           # rappel : l'envoi est fait par le backend
```

---

## ⏰ Sitemap

`npm run generate:sitemap` régénère `public/sitemap.xml`. Le bouton du dashboard admin fait la même chose via `POST /api/sitemap` (jeton `SITEMAP_GENERATE_TOKEN`). Le rappel d’expiration du token GitHub est planifié par Spring (`app.github-token-reminder.cron`), pas par un script Next.

Prérequis : `.env` à la racine avec `NEXT_PUBLIC_SITE_URL` ou `SITE_URL`, et `BACKEND_API_URL` pour inclure les projets.

```bash
cd /chemin/vers/portfolio/front
npm run generate:sitemap
```

```cron
0 2 * * * cd /chemin/vers/portfolio/front && /usr/bin/npm run generate:sitemap >> /var/log/portfolio-sitemap.log 2>&1
```

---

## 🔐 Signature des commits (obligatoire)

Tous les commits doivent être signés.

Un hook Git bloque automatiquement les `push` si un commit n’est pas signé.

### Configuration rapide

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

---

## 🪝 Git Hooks

Les hooks sont automatiquement installés via :

```bash
npm install
```

Sinon :

```bash
bash ../.github/scripts/setup-hooks.sh
```

---

## 🌿 Workflow Git

Branches principales :

- `dev`
- `pre-prod`
- `main`

Branches de travail :

- `feat/...`
- `fix/...`
- `chore/...`

---

## 📝 Convention de commits

Format obligatoire :

```
feat: description
fix: description
chore: description
```

Exemples :

```
feat: add authentication page
fix: resolve navbar overflow
```

---

## 🔄 CI/CD

Le projet inclut des workflows GitHub Actions :

- vérification qualité (lint, type-check, build)
- validation des conventions
- gestion des releases (versioning automatique)

---

## 🌱 Variables d’environnement

Le fichier **`.env`** (non versionné) reste à la racine du dépôt et reprend les variables nécessaires au build et au dev. Un modèle est fourni dans **`../.env.exemple`**.

Pour le **formulaire de contact** : **`npm run dev`** utilise les routes **`/api/contact`** du même serveur Next (**`NEXT_PUBLIC_CONTACT_API_ORIGIN` est ignoré en développement** pour éviter d’appeler la prod par erreur). La logique métier est dans **`src/lib/server/*`**, exposée via **`src/app/api/contact/`**. En **production**, si la route Next `/api/contact` n’est pas sur le même hôte que le site, définir **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** au **build**.

---

## Données publiques

Les projets, les expériences et les stacks liés aux projets viennent de PostgreSQL, via Spring Boot (`BACKEND_API_URL`). Le front n’a plus de JSON local ou distant pour ces données.

Les liens sociaux et les services de l’accueil restent dans `src/data/link.json` et `src/data/service.json`.

---

## Build et déploiement

`npm run build` exécute `next build`. `npm run dev` lance Turbopack. Le site est un serveur Node (`next start`), y compris dans Docker. Il n’y a pas d’export statique `out/`.

Le formulaire contact appelle `/api/contact` sur Next. Cette route enregistre le message dans Spring (`BACKEND_API_URL`). En développement, `NEXT_PUBLIC_CONTACT_API_ORIGIN` est ignoré. En production, le définir seulement si cette route Next n’est pas sur le même hôte que le site.

Les stats GitHub de l’accueil sont lues sur `GET /api/github-stats`. Le backend tient ce cache à jour.

---

## 🧠 Bonnes pratiques

- privilégier TypeScript strict
- composants réutilisables
- séparation par features
- éviter la duplication de code
- respecter les conventions définies

---

## 👤 Auteur

[GitHub – phang-willy](https://github.com/phang-willy)

---

## 📄 Licence

Aucune

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
├─ .github/
│  ├─ scripts/
│  └─ workflows/
├─ .githooks/
├─ public/                 # assets statiques (images projets dans public/project/, etc.)
├─ scripts/
│  └─ next-with-server-port.mjs
├─ src/
│  ├─ app/
│  │  └─ api/contact/     # Route Handlers minces → ré-exportent lib/server/*-route-handlers
│  ├─ components/
│  ├─ data/
│  ├─ features/
│  ├─ lib/
│  │  ├─ server/           # logique HTTP contact/captcha (TS)
│  │  └─ …                 # schémas, Brevo, captcha, rate-limit, github-stats…
│  └─ …
├─ .editorconfig
├─ .env.exemple
├─ .gitignore
├─ .nvmrc
├─ package.json
└─ next.config.ts
```

---

## ⚙️ Installation

```bash
git clone <repo-url>
cd <project-name>
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
npm run dev            # dev (port via scripts/next-with-server-port.mjs)
npm run build          # next build → export statique dans out/ (voir ci-dessous)
npm run start          # serveur Next après build (hors export pur FTP)
npm run lint           # ESLint
npm run type-check     # tsc --noEmit
npm run format:check   # Prettier en lecture seule
npm run format:write   # Prettier en écriture
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
bash .github/scripts/setup-hooks.sh
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

Le fichier **`.env`** (non versionné) reprend les variables nécessaires au build et au dev. Un modèle est fourni dans **`.env.exemple`**.

Pour le **formulaire de contact** : **`npm run dev`** utilise les routes **`/api/contact`** du même serveur Next (**`NEXT_PUBLIC_CONTACT_API_ORIGIN` est ignoré en développement** pour éviter d’appeler la prod par erreur). La logique métier est dans **`src/lib/server/*`**, exposée via **`src/app/api/contact/`**. En **production**, si l’API n’est pas sur le même hôte que le front, définir **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** au **build** (voir section suivante).

---

## 🔧 Particularités du build et du déploiement

### Export statique (`output: "export"`)

Le site est généré en **HTML/CSS/JS statiques** dans **`out/`**, adaptés à un hébergement **Apache** (FTP) sans runtime Node.

### Build : `npm run build` = `next build`

**`package.json`** utilise **`"build": "next build"`**. Les endpoints contact sont les **`app/api/contact/*`** qui ré-exportent **`src/lib/server/contact-route-handlers.ts`** et **`contact-captcha-route-handlers.ts`**. Si tu actives un jour **`output: "export"`** dans **`next.config`**, ces routes ne seront pas dans **`out/`** : il faudra alors une API externe et **`NEXT_PUBLIC_CONTACT_API_ORIGIN`**.

### Contact : site statique + API TypeScript

| Contexte                     | Backend                                                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Export statique (`out/`)** | Le navigateur appelle **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** + `/api/contact` et `/api/contact/captcha` (`src/lib/contact-api-url.ts`). L’origine doit exécuter la **même** logique que **`src/lib/server/*-route-handlers.ts`** (même contrat JSON). |
| **Développement local**      | **`NEXT_PUBLIC_CONTACT_API_ORIGIN` ignoré** : **`fetch`** vers **`/api/contact`** sur la même origine que **`next dev`** (localhost ou IP du réseau, selon comment tu ouvres le site).                                                              |

### Apache : fichier `.htaccess`

Sur un hébergement **Apache**, un **`.htaccess`** à la **racine** du site déployé (à côté de `index.html`) peut gérer notamment :

- les **payloads RSC** (fichiers `.txt` dont l’URL utilise des **points** alors que les fichiers sont dans des **sous-dossiers**, ex. noms **`$d$id.txt`**) ;
- la résolution **`/contact` → `contact.html`**, etc.

Sans ces règles, la navigation client (prefetch, transitions) peut renvoyer des **404** sur des URLs du type `__next.*.txt`.

### Stats GitHub (`src/lib/github-stats.ts`)

La page d’accueil affiche des stats GitHub via l’API GraphQL. Comportement :

- en **développement** : données **rafraîchies** (`unstable_noStore`, `fetch` en `no-store`) ;
- en **build production / export statique** : valeurs **figées au moment du build** (`force-cache`, pas de `noStore`), pour permettre le prérendu statique.

---

## 📬 Contact en production (export statique + API Next en TypeScript)

Le dossier **`out/`** ne contient **pas** d’API HTTP. Le formulaire du site statique doit appeler une **URL** qui exécute la logique des **`src/lib/server/*-route-handlers.ts`** (Brevo, captcha signé, rate limiting côté serveur).

**Étapes typiques**

1. **Déployer l’API** : ce dépôt inclut déjà **`app/api/contact/route.ts`** et **`captcha/route.ts`** (ré-export des handlers **`src/lib/server/…`**). Variables Brevo / contact : **`.env.exemple`**. **`CONTACT_ALLOWED_ORIGINS`** : URL exacte du site statique (CORS sur POST).
2. **Build statique** : définir **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** (sans slash final), puis **`npm run build`** → dossier **`out/`**.
3. **Héberger `out/`** : FTP, S3, GitHub Pages, etc.

**Vérifications** : `GET {origine}/api/contact` → JSON avec `canSubmit` ; `GET {origine}/api/contact/captcha` → `code` et `captchaToken`.

**Références** : **`src/lib/contact-api-url.ts`**, **`src/app/api/contact/route.ts`**, **`src/app/api/contact/captcha/route.ts`**, **`src/lib/server/*-route-handlers.ts`**.

### Déployer le site statique (FTP / Apache)

1. Définir **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** dans l’environnement du **`npm run build`**.
2. Lancer **`npm run build`** puis uploader le contenu de **`out/`**.
3. Si tu utilises Apache, configurer un **`.htaccess`** à la racine (réécritures RSC, **`/contact` → `contact.html`**, etc.) et vérifier que les fichiers dont le nom contient **`$`** ne sont pas altérés par le client FTP.

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

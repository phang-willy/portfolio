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
│  ├─ build-static-export.mjs   # voir « Particularités du build »
│  └─ next-with-server-port.mjs
├─ src/
│  ├─ app/
│  │  └─ api/contact/      # routes Next (contact + captcha) — absentes du build statique
│  ├─ components/
│  ├─ data/
│  ├─ features/
│  ├─ lib/                 # schémas contact, Brevo, captcha, rate-limit, github-stats…
│  └─ …
├─ .editorconfig
├─ .env.exemple
├─ .htaccess               # réécritures Apache pour l’export statique (RSC, etc.)
├─ php/
│  └─ contact-api/         # API contact (PHP) : bootstrap, dotenv.php, public/api/…
├─ .gitignore
├─ .nvmrc
├─ package.json
└─ next.config.ts          # output: "export" (site statique)
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
npm run build          # export statique → dossier out/ (voir ci-dessous)
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

Pour le **formulaire de contact** en production avec l’API PHP, il faut au minimum définir **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** (voir section suivante). En local, tu peux aussi t’appuyer sur les **routes Next** si les variables Brevo sont dans `.env`.

---

## 🔧 Particularités du build et du déploiement

### Export statique (`output: "export"`)

Le site est généré en **HTML/CSS/JS statiques** dans **`out/`**, adaptés à un hébergement **Apache** (FTP) sans runtime Node.

### Routes API Next.js et script `build-static-export.mjs`

Next.js **ne peut pas** inclure de **Route Handlers** (`app/api/...`) dans le même `next build` qu’un export statique. Pour **garder le code** des endpoints contact en TypeScript dans le dépôt tout en produisant **`out/`** :

- la commande **`npm run build`** exécute **`scripts/build-static-export.mjs`** ;
- ce script **déplace temporairement** `src/app/api` vers **`.tmp/stashed-app-api`** pendant le build, puis **restaure** le dossier à la fin (y compris si le build échoue) ;
- le dossier **`.tmp/`** est ignoré par Git.

En **`npm run dev`**, **`src/app/api`** est présent : **`GET/POST /api/contact`** et **`GET /api/contact/captcha`** fonctionnent comme une API Next classique (Brevo, captcha, rate limiting — voir `src/lib/`).

### Double backend contact

| Contexte | Backend |
|----------|---------|
| **Production (FTP / Apache)** | API **PHP** (`php/contact-api/`), appelée via **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** (`src/lib/contact-api-url.ts`) |
| **Développement local** | Routes **`src/app/api/contact`** (TypeScript) si `.env` est renseigné |
| **Futur** | Possibilité de déployer le site en mode Node et d’utiliser les routes TS sans PHP |

### Apache : fichier `.htaccess`

À la **racine** du site déployé (à côté de `index.html`), le **`.htaccess`** du dépôt gère notamment :

- les **payloads RSC** (fichiers `.txt` dont l’URL utilise des **points** alors que les fichiers sont dans des **sous-dossiers**, ex. noms **`$d$id.txt`**) ;
- la résolution **`/contact` → `contact.html`**, etc. ;
- les routes **PHP** sous **`/api/contact`** si elles sont sur le même vhost.

Sans ces règles, la navigation client (prefetch, transitions) peut renvoyer des **404** sur des URLs du type `__next.*.txt`.

### Stats GitHub (`src/lib/github-stats.ts`)

La page d’accueil affiche des stats GitHub via l’API GraphQL. Comportement :

- en **développement** : données **rafraîchies** (`unstable_noStore`, `fetch` en `no-store`) ;
- en **build production / export statique** : valeurs **figées au moment du build** (`force-cache`, pas de `noStore`), pour permettre le prérendu statique.

---

## 🐘 PHP : API contact en production

Le site est exporté en **fichiers statiques** (`npm run build` avec `output: "export"`). Le dossier généré **`out/`** ne contient **pas** les routes Next `/api/contact` : sur un hébergement FTP classique, le backend contact est fourni en **PHP** sous **`php/contact-api/`**, à déployer sur un hébergement avec **PHP** et **cURL**.

**Tu n’es pas obligé d’utiliser un sous-domaine.** L’important est que les URLs finales soient :

`{origine}/api/contact` et `{origine}/api/contact/captcha`

- **Même domaine, sous-route** (ex. `phangwilly.com`) : tu peux déposer l’API sous **`/api/`** à la racine du site, par ex. `https://phangwilly.com/api/contact`. Définis alors **`NEXT_PUBLIC_CONTACT_API_ORIGIN=https://phangwilly.com`** (sans slash final). Les fichiers statiques du portfolio (`out/`) restent à la racine (`index.html`, `_next/`, etc.) ; le dossier **`api/`** (PHP) cohabite sur le même vhost.
- **Sous-domaine** (ex. `api.phangwilly.com`) : pratique si tu sépares les stacks ou les certificats ; dans ce cas **`NEXT_PUBLIC_CONTACT_API_ORIGIN=https://api.phangwilly.com`**.

### Architecture

| Composant | Rôle |
|-----------|------|
| Site (Next) | Fichiers générés dans `out/` — upload vers la racine web du domaine du portfolio |
| API PHP | Même contrat JSON que l’ancienne API Next (Brevo, captcha HMAC, quotas), servie sous **`/api/contact`** et **`/api/contact/captcha`** (origine = `NEXT_PUBLIC_CONTACT_API_ORIGIN`) |

Le front appelle : `{NEXT_PUBLIC_CONTACT_API_ORIGIN}/api/contact` (GET/POST) et `{NEXT_PUBLIC_CONTACT_API_ORIGIN}/api/contact/captcha` (GET).

### Ce que tu mets dans `/api` (et ce que tu ne mets pas)

Le nom **`contact-api`** est seulement le dossier du **dépôt** (`php/contact-api/`). **En production, tu ne crées pas un dossier `contact-api` dans `/api`.**

Tu copies **le contenu** de **`php/contact-api/public/`** vers la **racine web** du site. Ça donne notamment le sous-dossier **`api/`** avec **`contact/`** dedans — pas `api/contact-api/...`.

```
Racine web (ex. public_html/)
├── … (fichiers Next : index.html, _next/, etc.)
├── api/
│   └── contact/
│       ├── index.php          ← GET/POST /api/contact
│       └── captcha/
│           └── index.php      ← GET /api/contact/captcha
└── data/                      ← vient aussi de public/data/ (écriture PHP, pas public en HTTP)
```

Les fichiers **`bootstrap.php`**, **`contact_handlers.php`**, **`config.php`** ne vont **pas** dans `/api` : ils restent **au-dessus** de la racine web (dossier parent de `public_html`), comme dans le dépôt au même niveau que `public/`.

### Déployer l’API PHP

1. **Sur le serveur**, conserve la structure des **`require`** du dépôt : le dossier **`public/`** du contact-api correspond à la racine **web** qui expose les chemins `/api/...`, et **`bootstrap.php`**, **`contact_handlers.php`**, **`config.php`** sont **au même niveau que ce dossier `public/`** (pas dedans), comme dans le dépôt.
   - **Option A — sous-domaine dédié** : le vhost pointe uniquement vers **`php/contact-api/public/`** (ex. `api.phangwilly.com` → ce dossier).
   - **Option B — même domaine que le site** : tu uploades le contenu de **`out/`** dans la racine du site (ex. `public_html/`), puis tu copies le contenu de **`php/contact-api/public/`** **dans** cette racine : en pratique tu obtiens `public_html/api/contact/...` et `public_html/data/...` (si tu exposes `data` au même niveau que `api`). Les fichiers **`bootstrap.php`**, **`contact_handlers.php`**, **`config.php`** se placent **dans le dossier parent de `public_html`** (souvent accessible en FTP au-dessus de `www` / `public_html`), pour que les chemins relatifs `../../../bootstrap.php` depuis `public_html/api/contact/index.php` restent valides. Si ton hébergeur ne permet pas un dossier au-dessus de la racine web, adapte les `require` ou la doc de ton hébergeur pour garder `bootstrap.php` hors d’URL publique.

2. **Créer `config.php`** à partir de **`php/contact-api/config.example.php`**. Y reporter les secrets Brevo, l’expéditeur, `CONTACT_TO_EMAIL`, les IDs de templates, etc. (équivalent des variables documentées dans `.env.exemple` pour la partie contact). Ce fichier est ignoré par Git (voir `.gitignore`) ; il doit vivre **au même endroit que `bootstrap.php`**.

   **Fichier `.env` (recommandé)** : l’API charge automatiquement un **`.env`** si présent — dans l’ordre : variable serveur **`CONTACT_DOTENV_PATH`** (chemin absolu vers le fichier), puis **`.env` à la racine du dépôt** (même niveau que le dossier `php/`, comme le `.env` Next), puis **`public_html/.env`** à la racine du site. Les clés (ex. `BREVO_API_KEY`, `CONTACT_TO_EMAIL`, …) **remplacent** les valeurs de `config.php`. Ne pas exposer `.env` en téléchargement HTTP (idéalement le placer hors de la racine web, ou protéger par règles serveur).

3. **Droits d’écriture** : le dossier **`data/`** à côté de **`api/`** (ex. `public_html/data/` en option B) doit être **writable** par PHP (rate limiting et alerte quota). Un **`.htaccess`** interdit l’accès HTTP direct à `data/`.

4. **CORS** : dans `config.php`, renseigne **`CONTACT_ALLOWED_ORIGINS`** avec les origines exactes du site (séparées par des virgules), par ex. `https://phangwilly.com,https://www.phangwilly.com`. Même domaine + même origine : tu peux quand même lister ton `https://` pour être explicite. Sans origine autorisée quand le navigateur envoie un `Origin`, l’API peut refuser ou ne pas renvoyer les en-têtes CORS attendus.

5. **Tester** : par ex. `GET https://phangwilly.com/api/contact` ou `GET https://api.phangwilly.com/api/contact` selon ton déploiement — la réponse doit être du JSON (`canSubmit`, etc.) ; `GET .../api/contact/captcha` doit renvoyer `code` et `captchaToken`.

### Déployer le site Next (FTP / statique)

1. Définir **`NEXT_PUBLIC_CONTACT_API_ORIGIN`** (sans slash final), par ex. **`https://phangwilly.com`** (API sous `/api/` sur le même domaine) ou **`https://api.phangwilly.com`** (sous-domaine), dans l’environnement utilisé pour **`npm run build`**.
2. Lancer **`npm run build`**. Le script **`build-static-export.mjs`** produit **`out/`** (sans compiler les routes `app/api` dans l’export).
3. Uploader le **contenu** de **`out/`** à la racine du domaine du portfolio (`index.html`, `_next/`, dossiers de pages, etc.).
4. Déposer le **`.htaccess`** du dépôt à la **racine** du site (même niveau que `index.html`) pour les réécritures RSC et les pages `.html`.
5. Vérifier que l’upload conserve les fichiers dont le nom contient **`$`** (ex. **`$d$id.txt`** dans les sous-dossiers Next) : certains clients FTP les altèrent ; sans eux, des **404** peuvent apparaître sur les payloads `.txt` côté navigateur.


### Références

- Configuration PHP détaillée : **`php/contact-api/config.example.php`**
- Chargement `.env` : **`php/contact-api/dotenv.php`**
- Points d’entrée HTTP : **`php/contact-api/public/api/contact/index.php`** et **`.../captcha/index.php`**
- Front : origine de l’API (**`NEXT_PUBLIC_CONTACT_API_ORIGIN`**) via **`src/lib/contact-api-url.ts`**
- API Next (dev / futur Node) : **`src/app/api/contact/route.ts`**, **`src/app/api/contact/captcha/route.ts`**, **`scripts/build-static-export.mjs`**

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

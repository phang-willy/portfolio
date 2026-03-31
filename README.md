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
├─ public/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ hooks/
│  ├─ services/
│  ├─ utils/
│  └─ types/
├─ .editorconfig
├─ .env.example
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
npm run dev          # lancement en dev
npm run build        # build production
npm run preview      # preview du build
npm run lint         # lint du projet
npm run type-check   # vérification TypeScript
npm run format       # formatage avec Prettier
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

.env

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

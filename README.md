# 🚀 Starter Vite + React + TypeScript

Template prêt à l’emploi pour démarrer rapidement un projet frontend moderne avec une base propre, maintenable et scalable.

---

## ❓ Utilisation du starter

Ce repository est conçu pour être utilisé comme template GitHub.

🥇 Méthode recommandée (GitHub Template)

1. Aller sur le repository du starter
2. Cliquer sur **“Use this template”** (en haut à droite)
3. Sélectionner :
   - le nom du nouveau projet
   - la visibilité (private / public)
4. Cliquer sur **“Create repository”**

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

## 📦 Utilisation comme template

Ce repository est conçu pour être utilisé comme base :

- via GitHub Template
- via clone manuel

---

## 👤 Auteur

[GitHub – phang-willy](https://github.com/phang-willy)

---

## 📄 Licence

Aucune

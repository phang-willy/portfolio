# Portfolio Admin

Panel admin Angular 21 pour le portfolio.

## Commandes

```bash
npm install
npm run dev
npm run build
npm test
```

Le serveur de developpement local ecoute sur `http://localhost:3001`.

## Docker

Le service `admin` est declare dans le `compose.yml` racine.

```bash
docker compose up --build admin
docker compose -f compose.yml -f compose.dev.yml up --build admin
```

## Spartan UI

Configuration :

- Angular `21`
- [Spartan UI](https://www.spartan.ng/) (`@spartan-ng/brain` + composants Helm dans `src/app/shared/ui/`)
- thème `slate` via `@spartan-ng/brain/hlm-tailwind-preset.css`
- icônes Lucide via `@ng-icons/lucide`

Sources utiles :

- [Spartan documentation](https://www.spartan.ng/documentation)
- [Spartan theming](https://www.spartan.ng/documentation/theming)
- [Angular compatibility](https://angular.dev/reference/versions)

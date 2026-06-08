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

## PrimeNG

Configuration :

- Angular `21`
- PrimeNG `21`
- preset `Aura`
- primary `blue`
- surface `slate`
- ripple `off`
- RTL `off` via `dir="ltr"` dans `src/index.html`

Sources utiles :

- [Angular compatibility](https://angular.dev/reference/versions)
- [PrimeNG npm](https://www.npmjs.com/package/primeng)

# Portfolio

Monorepo du portfolio avec un front Next.js, un backend Java/Spring Boot et une base PostgreSQL orchestrés par Docker Compose.

## Structure

```text
.
├─ front/          # Application Next.js existante
├─ admin/          # Panel admin Angular
├─ back/           # API Java 21 / Spring Boot
├─ compose.yml     # Docker Compose avec profiles dev/prod
├─ .env            # Valeurs locales, non versionnees
└─ .env.exemple    # Exemple de configuration
```

## Ports

| Service | Port |
| --- | ---: |
| Front Next.js | 3000 |
| Admin Angular | 3001 |
| Backend Java | 8000 |
| PostgreSQL | 5432 |
| Adminer | 8080 |
| MailDev UI | 1080 |
| MailDev SMTP | 1025 |

Par defaut, tous les services exposes par Docker sont lies a `127.0.0.1`, l'adresse loopback de `localhost`, pour rester accessibles uniquement depuis la machine locale.

## Docker production-like

Dans `.env`, utilise le profile `prod` :

```env
COMPOSE_PROFILES=prod
```

Puis lance Docker Compose :

```bash
docker compose up -d --build
```

URLs locales :

- Front : http://localhost:3000
- Admin : http://localhost:3001
- API : http://localhost:8000/api/health
- Actuator : http://localhost:8000/actuator/health
- Adminer : http://localhost:8080

## Docker developpement

Le projet utilise un seul fichier `compose.yml` avec des profiles Docker Compose.
Le profile `dev` demarre les variantes hot reload des services, plus MailDev.

Dans `.env`, utilise le profile `dev` :

```env
COMPOSE_PROFILES=dev
```

Puis lance Docker Compose :

```bash
docker compose up -d --build
```

Ensuite, garde les conteneurs ouverts :

- les changements dans `front/` sont repris par `next dev --turbo` ;
- les changements dans `admin/` sont repris par `ng serve` sur le port 3001 avec polling Docker (`--poll 1000`) ;
- les changements Java dans `back/` sont recompiles dans le conteneur, puis relancent Spring Boot via DevTools ;
- au demarrage, `front-dev` et `admin-dev` synchronisent les dependances npm dans leurs volumes `node_modules` ;
- MailDev est disponible sur http://localhost:1080 et son SMTP sur `localhost:1025` ;
- `down` n'est utile que si tu veux supprimer/recreer les conteneurs ou repartir d'un etat propre.

Ne lance pas `dev` et `prod` en meme temps : les deux profiles exposent les memes ports publics (`3000`, `3001`, `8000`).
Avant de changer de mode, arrete l'autre profile :

```bash
docker compose down
```

Si tu ajoutes ou retires une dependance Maven dans `back/pom.xml`, relance le service `back` pour repartir avec un classpath propre.
Si tu ajoutes ou retires une dependance npm dans `front/package.json` ou `admin/package.json`, relance le service concerne : la commande dev relancera `npm install` dans le volume `node_modules`.

Pour relancer seulement un service :

```bash
docker compose --profile dev restart front-dev
docker compose --profile dev restart admin-dev
docker compose --profile dev restart back-dev
```

Pour les logs dev :

```bash
docker compose logs -f
```

## Developpement local

Front :

```bash
cd front
npm install
npm run dev
```

Admin :

```bash
cd admin
npm install
npm run dev
```

Backend :

```bash
cd back
mvn spring-boot:run
```

Pour lancer uniquement PostgreSQL et Adminer pendant le dev :

```bash
docker compose up postgres adminer
```

## Configuration

Le fichier `.env` reste a la racine et n'est pas versionne. Les valeurs attendues sont documentees dans `.env.exemple`.

Pour un VPS, garde de preference les variables `*_BIND_ADDRESS` sur `127.0.0.1`, puis expose le front et/ou l'API via Nginx, Caddy ou Traefik avec HTTPS.

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

## Docker developpement

Le projet utilise un seul fichier `compose.yml` avec des profiles Docker Compose.
Le profile `dev` demarre les variantes hot reload des services, plus MailDev et Adminer.
Les profiles `prod` et un deploiement pre-prod ne lancent ni MailDev ni Adminer.

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
- Adminer est disponible sur http://localhost:8080 ;
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

## Validation

Ces commandes ont ete executees. `mvn` n'est pas dans le PATH de cette machine : les tests backend passent par l'image `maven:3.9.16-eclipse-temurin-21-noble`. Avec Maven installe, les memes goals marchent depuis `back/`.

Front :

```bash
cd front
npm test
npm run lint
npm run type-check
npm run build
```

Admin :

```bash
cd admin
npm test
npm run build
```

Backend, sans PostgreSQL. `ContactIntegrationTest` reste ignore :

```bash
docker run --rm -v "$(pwd)/back:/workspace" -w /workspace maven:3.9.16-eclipse-temurin-21-noble mvn -B test
```

PostgreSQL isole, sans toucher au volume du projet `portfolio` :

```bash
docker compose -p portfolio-d5 up -d postgres
```

Si le port 5432 est deja pris, prefixe avec `POSTGRES_PORT=5433`. Le test cree une base jetable, applique les migrations Flyway dans `public`, puis supprime cette base. Le role PostgreSQL doit pouvoir faire `CREATE DATABASE`.

```bash
docker run --rm --network portfolio-d5_portfolio \
  -e CONTACT_INTEGRATION_TEST=true \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/portfolio \
  -e SPRING_DATASOURCE_USERNAME=portfolio \
  -e SPRING_DATASOURCE_PASSWORD=portfolio \
  -v "$(pwd)/back:/workspace" -w /workspace \
  maven:3.9.16-eclipse-temurin-21-noble \
  mvn -B -Dtest=ContactIntegrationTest test
```

Arret de cet environnement de test, sans `-v` :

```bash
docker compose -p portfolio-d5 down
```

Ne lance jamais `docker compose down -v` sur le projet qui contient les donnees reelles.

## Pre-production

Aucun deploiement distant n'a ete fait. Variables indispensables, sans valeurs secretes :

| Variable | Attendu |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod`. Ce profil refuse les secrets JWT placeholder. |
| `APP_AUTH_JWT_SECRET` | Secret unique, 32 caracteres minimum, different du placeholder de dev. |
| `APP_AUTH_TOKEN_HASH_SECRET` | Autre secret unique, 32 caracteres minimum. |
| `APP_AUTH_COOKIE_SECURE` | `true`. Compose prod le force. |
| `APP_AUTH_COOKIE_SAME_SITE` | `Lax`. L'admin nginx proxifie `/api` sur le meme hote. |
| `APP_CORS_ALLOWED_ORIGINS` | Origines HTTPS exactes du front et de l'admin. Pas de wildcard. |
| `SITE_NOINDEX` | `true` en pre-prod. `robots.txt` et `X-Robots-Tag` ne remplacent pas un controle d'acces. |
| `SITE_URL` | URL HTTPS publique du front. |
| SMTP / Brevo | Hote, port, identifiants et expediteur reels. MailDev n'est pas lance en prod. |
| PostgreSQL | Base persistante, mot de passe propre, volume conserve. |

Le demarrage prod a ete verifie sur une base vide : les 20 migrations s'appliquent, un second demarrage ne les rejoue pas, et le placeholder JWT empeche le demarrage.

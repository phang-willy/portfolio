# Portfolio

Monorepo du portfolio avec un front Next.js, un backend Java/Spring Boot et une base PostgreSQL orchestrés par Docker Compose.

## Structure

```text
.
├─ front/          # Application Next.js existante
├─ admin/          # Panel admin Angular
├─ back/           # API Java 21 / Spring Boot
├─ compose.yml     # Mode production-like
├─ compose.dev.yml # Override de developpement avec hot reload
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

Par defaut, tous les services exposes par Docker sont lies a `127.0.0.1`, l'adresse loopback de `localhost`, pour rester accessibles uniquement depuis la machine locale.

## Docker production-like

```bash
docker compose up --build
```

URLs locales :

- Front : http://localhost:3000
- Admin : http://localhost:3001
- API : http://localhost:8000/api/health
- Actuator : http://localhost:8000/actuator/health
- Adminer : http://localhost:8080

## Docker developpement

Utilise l'override dev pour eviter de reconstruire les images a chaque changement de code :

```bash
docker compose -f compose.yml -f compose.dev.yml up --build
```

Ensuite, garde les conteneurs ouverts :

- les changements dans `front/` sont repris par `next dev --turbo` ;
- les changements dans `admin/` sont repris par `ng serve` sur le port 3001 ;
- les changements Java dans `back/` sont recompiles dans le conteneur, puis relancent Spring Boot via DevTools ;
- `down` n'est utile que si tu veux supprimer/recreer les conteneurs ou repartir d'un etat propre.

Si tu ajoutes ou retires une dependance Maven dans `back/pom.xml`, relance le service `back` pour repartir avec un classpath propre.

Pour relancer seulement un service :

```bash
docker compose -f compose.yml -f compose.dev.yml restart front
docker compose -f compose.yml -f compose.dev.yml restart admin
docker compose -f compose.yml -f compose.dev.yml restart back
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

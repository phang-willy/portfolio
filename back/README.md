# Portfolio API

Backend Java 21 / Spring Boot 4 pour le portfolio.

## Architecture

```text
src/main/java/com/phangwilly/portfolio
├─ config/       # Configuration Spring MVC, CORS, rate limiting, time
├─ controller/   # Endpoints REST
├─ dto/          # Requests/responses API
├─ exception/    # Exceptions applicatives et handler global
├─ model/        # Modeles JPA et metier simples
├─ repository/   # Acces aux donnees
├─ security/     # Integration Spring Security
└─ service/      # Logique applicative
```

L'API suit une structure MVC classique. Les controllers exposent les routes, les services portent la logique applicative, les repositories gerent l'acces aux donnees et les DTO stabilisent les contrats HTTP.

## Base de donnees

Les nouvelles entites JPA heritent de `AuditableEntity` :

- `id` : UUID v7 genere par Hibernate.
- `created_at` : timestamp de creation.
- `updated_at` : timestamp de derniere mise a jour.
- `deleted_at` : timestamp nullable pour la suppression logique.

Tables metier disponibles : `project`, `stack`, `project_stacks`.
Tables auth disponibles : `user`, `password`, `session`, `email_verification_token`, `two_factor_auth`, `forgot_password`, `email_queue`.

## Commandes

```bash
mvn test
mvn spring-boot:run
```

En Docker dev, `compose.dev.yml` lance `mvn spring-boot:run`, recompile les sources Java modifiees dans le conteneur, puis Spring Boot DevTools redemarre l'API.

Si `pom.xml` change pour ajouter ou retirer une dependance, relance le service `back` afin de recharger le classpath Maven.

Endpoint de base :

```text
GET /api/health
GET /api/project?page=0&size=50
POST /api/auth/register
GET /api/auth/verify-email?token=...
POST /api/auth/login
POST /api/auth/verify-2fa
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/account/change-password
```

Les projets retournes par l'endpoint public excluent les lignes avec `deleted_at` ou `deactivated_at`.

## Authentification

Le workflow auth est stateless cote API :

- les mots de passe sont stockes avec BCrypt dans `password.password_hash` ;
- les tokens, JWT et codes 2FA sont stockes uniquement sous forme de hash HMAC ;
- le contenu `email_queue.body` est chiffre pour ne pas stocker les tokens/codes en clair ;
- `REGISTER_ENABLE=false` bloque l'inscription par defaut ;
- le login cree un code 2FA mais pas de session ;
- la verification 2FA cree une session et retourne le JWT ;
- chaque requete protegee verifie le JWT, son hash en table `session`, l'expiration et l'etat utilisateur.

Variables utiles :

```text
REGISTER_ENABLE=false
APP_PUBLIC_BASE_URL=http://localhost:8000
APP_ADMIN_BASE_URL=http://localhost:3001/admin
APP_AUTH_JWT_SECRET=change-this-dev-jwt-secret-with-at-least-32-characters
APP_AUTH_TOKEN_HASH_SECRET=change-this-dev-token-hash-secret-with-at-least-32-characters
```

`email_queue` est traitee par un scheduler et envoyee via SMTP. En developpement Docker, Maildev est disponible avec `SMTP_HOST=maildev`, `SMTP_PORT=1025`, et son interface web sur `http://localhost:1080`.

## Rate limiting

Bucket4j applique un rate limiting sur `/api/**`.

- `ADMIN` : 100 requetes par seconde.
- Autres utilisateurs et anonymes : 50 requetes par seconde.
- Depassement : `429 Too Many Requests`.

Reponse d'erreur :

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

Configuration :

```yaml
app:
  rate-limit:
    enabled: true
    admin-requests-per-second: 100
    standard-requests-per-second: 50
```

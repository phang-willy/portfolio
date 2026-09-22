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

Les emails d'inscription ne doivent pas pointer directement vers l'API. Le lien public envoye a l'utilisateur doit pointer vers l'admin Angular, par exemple `http://localhost:3001/verify?token=...`, puis Angular appelle `GET /api/auth/verify-email?token=...`.

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
APP_ADMIN_BASE_URL=http://localhost:3001
APP_AUTH_JWT_SECRET=change-this-dev-jwt-secret-with-at-least-32-characters
APP_AUTH_TOKEN_HASH_SECRET=change-this-dev-token-hash-secret-with-at-least-32-characters
```

`email_queue` est traitee par un scheduler et envoyee via SMTP. En developpement Docker, Maildev est disponible avec `SMTP_HOST=maildev`, `SMTP_PORT=1025`, et son interface web sur `http://localhost:1080`.

## Contacts dans l'admin

La migration Flyway `V12` ajoute `contact` et `contact_history`. `V13` permet aux emails de la file de conserver leur format HTML et un objet complet. Ces migrations sont appliquees au demarrage de l'API.

Les routes suivantes exigent une session administrateur :

```text
GET  /api/admin/contact?page=0&size=25&search=&status=RECEIVED
GET  /api/admin/contact/{id}
PUT  /api/admin/contact/{id}/read
POST /api/admin/contact/{id}/reply
GET  /api/admin/contact/unread-count
GET  /api/admin/contact/stream
```

`search` et `status` sont facultatifs. Le statut vaut `RECEIVED`, `READ` ou `REPLIED`. Le detail en lecture seule ne change pas le statut ; l'ouverture de la fiche par l'admin appelle explicitement `PUT .../read` avec `{}` pour enregistrer chaque consultation et son auteur. La premiere consultation conserve sa date dans `first_read_at`. Une consultation ulterieure ne remet pas une demande repondue au statut lu.

Une reponse accepte `{"message":"Votre reponse", "website":""}`. Le champ `website` est le honeypot ; il doit rester vide. Le serveur fixe le destinataire a l'adresse du contact et l'objet a `APP_TITLE - SUITE : objet de la demande`. Le message saisi est traite comme du texte et insere dans un email HTML contenant le recapitulatif de la demande. `APP_EMAIL_TIME_ZONE` regle le fuseau de la date affichee, avec `Europe/Paris` par defaut.

La reponse, son auteur, son objet et son lien vers `email_queue` sont enregistres dans la meme transaction. L'envoi demarre apres validation de cette transaction ; un echec SMTP conserve la reponse et programme une nouvelle tentative. `REPLIED` signifie qu'une reponse a ete enregistree : son etat de livraison `PENDING`, `SENT` ou `FAILED` figure separement dans l'historique. Le verrouillage de la ligne d'email empeche le scheduler et le traitement immediat de l'envoyer simultanement.

Le flux SSE `contact` actualise le compteur de demandes non lues et les fiches lors des consultations, reponses et changements d'etat de livraison. La reconnexion du navigateur recharge les donnees.

Le front public n'est pas relie a ces tables et aucune route publique de reception n'est ajoutee. Le service interne de reception est pret pour une integration ulterieure. Les contacts peuvent etre prepares en base dans l'environnement de developpement pour tester l'admin.

### SMTP

En developpement, les emails restent dans MailDev. Pour utiliser un fournisseur SMTP en production, renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USERNAME`, `SMTP_PASSWORD` et activer `SMTP_AUTH`, `SMTP_STARTTLS_ENABLE` et `SMTP_STARTTLS_REQUIRED` suivant sa configuration. Les delais de connexion, lecture et ecriture sont bornes par les variables `SMTP_*_TIMEOUT_MS` documentees dans `.env.exemple`.

Les emails HTML utilisent [MimeMessageHelper](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/mail/javamail/MimeMessageHelper.html), et le declenchement de livraison utilise les [evenements lies aux transactions Spring](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html).

## Rate limiting

Bucket4j applique un rate limiting sur `/api/**`.

- `ADMIN` : 100 requetes par seconde.
- Autres utilisateurs et anonymes : 50 requetes par seconde.
- Depassement : `429 Too Many Requests`.

Format de reponse API (succes et erreur) :

```json
{
  "success": false,
  "code": 429,
  "message": "Too Many Requests",
  "data": null
}
```

Les reponses reussies utilisent le meme envelope avec `success: true`, `code` egal au statut HTTP (souvent `200`) et le payload metier dans `data`.

Quand aucun message metier n'est fourni, `message` reprend la reason phrase HTTP standard (ex. `200` → `OK`, `400` → `Bad Request`, `401` → `Unauthorized`). Voir [HTTP Status Codes](https://restfulapi.net/http-status-codes/).

Route inexistante (ex. `GET /api/auth/`) :

```json
{
  "success": false,
  "code": 404,
  "message": "Not Found",
  "data": null
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

# Portfolio API

Backend Java 21 / Spring Boot 4 pour le portfolio.

## Architecture

```text
src/main/java/com/phangwilly/portfolio
├─ domain/          # Regles et modeles metier purs
├─ application/     # Cas d'utilisation et ports
└─ infrastructure/  # Web, configuration, persistence, frameworks
```

Les dependances vont vers l'interieur : `infrastructure` depend de `application`, `application` depend de `domain`, et `domain` ne depend pas de Spring.

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
```

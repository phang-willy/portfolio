---
name: api-route-naming
description: Enforces singular nouns in REST API path segments (stack, project, user). Use when adding or renaming backend controllers, Spring @RequestMapping paths, API clients, proxies, or any /api/... route in this repo.
paths: back/**, admin/**, front/**
---

# API route naming

## Rule

api route name : only in singular never in plural :
eg: stack, project, post, user
and not stacks, projects, posts, users

## Apply to

- Spring `@RequestMapping` / `@GetMapping` path segments
- Admin and front HTTP client URLs (`project.service.ts`, `stack.service.ts`, etc.)
- Security matchers (`PublicSecurityPaths`, `SecurityConfig`)
- Docs, OpenAPI paths, and proxy config

Use **singular resource nouns** in the path. Collection vs item is expressed by HTTP method and optional `{id}`, not by pluralizing the segment.

## Correct patterns

| Purpose | Path |
|---------|------|
| Public list | `GET /api/project` |
| Public item | `GET /api/project/{id}` |
| Admin list | `GET /api/admin/project` |
| Admin item | `GET /api/admin/project/{id}` |
| Admin action | `PUT /api/admin/project/deactivate/{id}` |
| Nested resource (upload) | `POST /api/admin/project/image` |
| Nested resource (public) | `GET /api/project/image/{filename}` |

## Avoid

| Wrong | Prefer |
|-------|--------|
| `/api/projects` | `/api/project` |
| `/api/admin/stacks` | `/api/admin/stack` |
| `/api/users/{id}` | `/api/user/{id}` |

## Checklist

- [ ] Every new `/api/...` segment uses a singular noun
- [ ] Backend controller and frontend service use the same path
- [ ] Security `requestMatchers` updated if the path changed
- [ ] No new plural aliases unless explicitly requested for backward compatibility

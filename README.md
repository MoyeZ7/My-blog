# My Blog Master

`My Blog Master` is a new full-stack rebuild that takes visual and feature inspiration from `../My-Blog-Test` without copying the original one-to-one.

The reference project is a Spring Boot monolith. This rebuild starts with a lighter monorepo so the work can be committed in small, normal development steps:

1. `chore`: initialize repository and milestone plan.
2. `feat(api)`: add a minimal blog API with seeded content.
3. `feat(web)`: add a blog-facing web app that consumes the API.
4. `feat(admin)`: add a lightweight admin area for content operations.
5. `feat(data)`: move from seeded data to persistent storage.

## Structure

```text
My-blog-master
├── apps
│   ├── api
│   └── web
├── docs
└── packages
    └── content
```

## Current direction

- Keep the editorial blog feel from the template.
- Use a fresh implementation and cleaner boundaries.
- Prefer zero-dependency building blocks first so each stage remains runnable in this environment.

## Reference mapping

The target feature set will loosely map to the template:

- public homepage and article detail pages
- category and tag navigation
- comments and friend links later
- admin dashboard later

## Commands

The first runnable commands will be added as the API and web apps land in separate commits.

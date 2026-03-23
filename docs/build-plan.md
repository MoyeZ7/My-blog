# Build Plan

## Goal

Rebuild `my blog` from scratch in `My-blog-master`, using `My-Blog-Test` as a feature and design reference instead of a direct clone.

## Why this differs from the template

The template is a single Spring Boot application with server-rendered pages. For a stepwise workflow, this rebuild starts as a monorepo with clearly separated apps:

- `apps/api`: backend API
- `apps/web`: public-facing site
- `packages/content`: shared seed content and later shared schemas

This gives us smaller commits, clearer review boundaries, and room to evolve the stack.

## Planned milestones

### Milestone 1

- initialize git repository
- add monorepo skeleton
- document delivery plan

### Milestone 2

- add minimal API
- expose health, post list, post detail, and categories
- seed content from shared package

### Milestone 3

- add public web app
- build homepage and post detail page
- connect frontend to API

### Milestone 4

- add admin login and dashboard shell
- add create and edit flows for posts

### Milestone 5

- replace in-memory content with persistent storage
- add comments, links, and moderation flows

## Commit strategy

Use small conventional commits so each stage is independently understandable and reversible.

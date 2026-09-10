<div align="center">

# DevFlow

**One command center for your entire development workflow.**

Manage projects, deployments, APIs, GitHub activity and team workflows from one powerful workspace.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)](https://www.prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

> **Status: in active development.** Built in phases — this README grows as
> features land. See [Roadmap](#roadmap) for what is done and what is next.

## Tech stack

| Layer          | Choice                                       |
| -------------- | -------------------------------------------- |
| Framework      | Next.js (App Router, Server Components)      |
| Language       | TypeScript, strict mode                      |
| Styling        | Tailwind CSS v4, shadcn/ui, Radix primitives |
| Motion         | Framer Motion                                |
| Icons          | Lucide React                                 |
| Database       | PostgreSQL via Prisma ORM                    |
| Authentication | Auth.js — credentials + GitHub OAuth         |
| Integrations   | GitHub REST API                              |
| Charts         | Recharts                                     |
| Validation     | Zod                                          |
| Testing        | Vitest (unit/API), Playwright (E2E)          |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start a local PostgreSQL server (no credentials needed)
npx prisma dev -n devflow -d

# 3. Configure environment
cp .env.example .env
#    Set DATABASE_URL to the string prisma dev printed, with the
#    database name changed to "devflow". Generate AUTH_SECRET with:
#    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Create the schema and load development data
npm run db:migrate
npm run db:seed

# 5. Run the development server
npm run dev
```

Sign in with **demo@devflow.app** / **devflow123**.

> Already have PostgreSQL installed? Skip step 2 and point `DATABASE_URL` at
> your own server instead — the schema is standard PostgreSQL.

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable               | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string used by Prisma              |
| `AUTH_SECRET`          | Session signing secret — generate with `npx auth secret` |
| `GITHUB_CLIENT_ID`     | GitHub OAuth app client ID                               |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret                           |

See [`.env.example`](.env.example). Real credentials are never committed.

## Commands

| Command                | What it does                 |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start the development server |
| `npm run build`        | Production build             |
| `npm run start`        | Serve the production build   |
| `npm run lint`         | ESLint                       |
| `npm run typecheck`    | TypeScript, no emit          |
| `npm run format`       | Prettier write               |
| `npm run format:check` | Prettier check               |

## Design system

DevFlow is dark-first. The token layer lives in
[`src/app/globals.css`](src/app/globals.css) and is the single source of truth —
shadcn's semantic variables are mapped onto DevFlow tokens so every generated
component inherits the theme.

| Token          | Value     | Role                                   |
| -------------- | --------- | -------------------------------------- |
| `surface-0`    | `#0B0D0F` | Page background                        |
| `surface-1`    | `#101316` | Cards and panels                       |
| `surface-2`    | `#15191C` | Raised surfaces, hover states          |
| `surface-3`    | `#1B2124` | Inputs, active states                  |
| `brand-500`    | `#FF6319` | Electric orange accent — used sparsely |
| `text-primary` | `#F4F6F7` | Primary copy                           |

The accent is reserved for primary CTAs, active navigation, focus rings and
metrics that genuinely demand attention.

## Roadmap

- [x] **Phase 1** — Project initialisation, tooling, design tokens
- [x] **Phase 2** — Design system primitives, app shell, landing page
- [x] **Phase 3** — Database schema, migrations, seed data
- [ ] **Phase 4** — Authentication (credentials + GitHub OAuth)
- [ ] **Phase 5** — Project CRUD
- [ ] **Phase 6** — Dashboard
- [ ] **Phase 7** — GitHub integration
- [ ] **Phase 8** — Deployments
- [ ] **Phase 9** — Analytics
- [ ] **Phase 10** — API playground
- [ ] **Phase 11** — API keys and documentation
- [ ] **Phase 12** — Team management
- [ ] **Phase 13** — Public project pages
- [ ] **Phase 14** — Testing, security, performance
- [ ] **Phase 15** — Animation and responsive polish
- [ ] **Phase 16** — Deployment and release

## License

MIT

# BIMA SHELTERS MANAGEMENT SOFTWARE

## Architecture

src/
├── actions (Store all server actions in here)
│   └── auth (should be grouped by module / function)
│       ├── login.ts
│       └── register.ts
├── app
│   ├── api (Can optionally use api routes)
│   │   └── auth (Do not touch)
│   ├── (auth) (Auth folder / Do not touch)
│   ├── (dashboard) (folder where all pages will be created)
│   │   ├── layout.tsx
│   │   └── page.tsx
├── components (each modules components should be grouped by folder)
│   ├── layouts (layout components stored here)
│   │   ├── app-sidebar.tsx
│   │   ├── nav-main.tsx
│   │   ├── nav-projects.tsx
│   │   ├── nav-user.tsx
│   │   └── team-switcher.tsx
│   └── ui (re-usuable ui components stored here)
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── collapsible.tsx
├── db
│   ├── index.ts
│   └── schema (all db schemas go in here)
│       ├── auth.ts
│       └── index.ts (Created schemas should be exported in this file)
└── lib (shared libs)
    ├── auth-client.ts
    ├── auth.ts
    └── utils.ts

- A `utils` folder can be used for shared utilities
- A `types` folder can be used for types

## Requirements

- disable prettier and es-lint extensions (if any)
- install biome extention for faster code formatting and linting
- copy env file from `.env.example` to `.env.local` or `.env`

## Commands

- pnpm run check: format all documents with biome.js

## Setup Database

1. ensure docker is open
2. ensure postgres image is present
3. start db

```bash
pnpm run db:start
```

4. push db schema

```bash
pnpm run db:push
```

5. view db in browser

```bash
pnpm run db:studio
```

### extra database commands to know

- stopping db service

```bash
pnpm run db:stop
```

- generating db migration file

```bash
pnpm run db:generate
```

### steps to update database

- create a file or make a change in db/schema/ folder
- export the file in dbb/schema/index.ts file
- run

```bash
pnpm run db:push
```

to push changes to db

## Need to know

1. **get user session object - server side**

```javascript
const session = await auth.api.getSession( {headers: await headers()} )
```

2. **get user session object - client side**

```javascript
const session = await authClient.useSession()
```

# E-Commerce AI Analytics Assistant: Coding Challenge

A starting point for a two-hour take-home. It sets up a small e-commerce data
model and a SQLite database seeded with sample data. The challenge itself,
building an assistant that answers questions about this data, is described in
[CHALLENGE.md](./CHALLENGE.md).

This repository does not include a solution. That part is up to you.

## Requirements

Node.js 20 or newer and npm.

## Setup

```bash
npm install
npm run db:create
```

`npm run db:create` builds `database/ecommerce.sqlite` from the JSON files in
`data/seed/`. Run `npm run db:reset` to rebuild it from scratch. The database file
is git-ignored; the seed data is the source of truth.

You can point the database somewhere else with the `DATABASE_PATH` environment
variable (see `.env.example`).

There's no test runner, linter, or type-checking configured. Add whatever you like.

## AI coding assistants

You're welcome to use AI coding assistants, and we expect you will. You're still
responsible for understanding and explaining what you submit. More in
[CHALLENGE.md](./CHALLENGE.md).

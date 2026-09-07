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
cp .env.example .env
```

`npm run db:create` builds `database/ecommerce.sqlite` from the JSON files in
`data/seed/`. Run `npm run db:reset` to rebuild it from scratch. The database file
is git-ignored; the seed data is the source of truth.

You can point the database somewhere else with the `DATABASE_PATH` environment
variable (see `.env.example`).

To enable the OpenAI-powered intent parsing layer, set `OPENAI_API_KEY` and
(optionally) `OPENAI_MODEL` in `.env`. If no key is present, the project falls
back to a deterministic, rule-based parser that works for the supported example
questions.

## Run it

```bash
npm run ask -- "Who ordered the most in the last seven days?"
npm run ask -- "Which products were ordered in the greatest quantities?"
```

## How it works

The command-line assistant does the following:

1. Parses the user question into a structured intent.
2. Uses a deterministic fallback parser when no AI API key is configured.
3. Runs a safe SQLite read query over the seeded e-commerce database.
4. Returns the answer in a simple table format.

The implementation is intentionally small and focused on an MVP: it supports a
subset of natural-language analytical questions and refuses unsupported ones
rather than guessing.

There's no test runner, linter, or type-checking configured. Add whatever you like.

## AI coding assistants

You're welcome to use AI coding assistants, and we expect you will. You're still
responsible for understanding and explaining what you submit. More in
[CHALLENGE.md](./CHALLENGE.md).

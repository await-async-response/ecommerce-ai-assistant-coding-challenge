# E-Commerce AI Analytics Assistant: Coding Challenge

This repository contains a small MVP analytics assistant for the seeded SQLite
store dataset. The CLI accepts a natural-language question, determines the
intent, runs a read-only SQL query against the database, and prints a readable
result table.

The challenge description and requirements are in [CHALLENGE.md](./CHALLENGE.md).

## Requirements

- Node.js 20 or newer
- npm
- Optional: OpenAI API key for the AI intent parser

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
npm run ask -- "What was the total order value yesterday?"
npm run ask -- "Which products were ordered in the greatest quantities?"
npm run ask -- "What is the average order value?"
```

## How it works

The command-line assistant does the following:

1. Accepts a plain-English question from the CLI.
2. Parses the question into a supported analytics intent.
3. Uses a deterministic fallback parser when no API key is configured.
4. Runs a safe read-only SQLite query against the e-commerce data.
5. Returns the answer as a table.

This is intentionally a narrow MVP focused on a subset of common analytics
questions rather than a broad agent framework.

## Assumptions and constraints

- Money is stored and handled in integer cents.
- Historical order totals use `order_items.unit_price_cents`, not the current
  product price.
- The app only supports a limited set of natural-language question patterns.
- Unsupported or ambiguous questions are rejected instead of guessed.
- This is a CLI MVP; it does not include UI, authentication, or deployment.

## Known gaps in this MVP

- The intent parser is intentionally narrow and rule-based by default.
- Not every possible natural-language variation is covered.
- SQL generation is template-driven rather than fully dynamic.
- There are no automated tests yet.
- Error handling is basic and could be more user-friendly.
- The OpenAI integration is optional and not required for the fallback flow.

## What would be improved for production

- Add proper automated tests for supported question types and edge cases.
- Introduce a more robust LLM-to-SQL validation layer before executing queries.
- Add schema-aware validation to reject unsafe or unsupported SQL patterns.
- Improve question parsing to cover a wider range of natural-language phrasing.
- Add retries, timeouts, and clearer error messages for provider failures.
- Add observability and logging around intent parsing and query execution.
- Add a safer API layer with authentication, rate limiting, and request validation.
- Consider a richer frontend or API interface for non-CLI use cases.
- Add more analytics templates and a consistent result schema for reporting.

## AI coding assistants

You're welcome to use AI coding assistants, and we expect you will. You're still
responsible for understanding and explaining what you submit. More in
[CHALLENGE.md](./CHALLENGE.md).

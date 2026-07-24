# Coding Challenge: E-Commerce AI Analytics Assistant

## Context

You're building a small assistant for an e-commerce platform. It takes questions
written in plain English, such as "Who ordered the most in the last seven days?",
and answers them using the data in the seeded SQLite database.

The data covers users, products and their prices, orders, and the line items that
connect orders to products. The tables, and a few things worth knowing about the
data, are described under [Data reference](#data-reference) below. The exact schema
is in [`src/database/schema.sql`](./src/database/schema.sql).

This repository gives you the data model and a database already seeded with sample
data. Everything else is up to you.

## Timebox

Please spend no more than two hours on this. You're not expected to finish
everything. We'd rather see one question answered well, all the way from the
question to the result, with a note on the choices and shortcuts you made, than a
broad attempt that doesn't run.

## Use of AI coding tools

AI coding assistants are allowed, and we expect you'll use them. You're still
responsible for what you submit: you should understand it, be able to explain why
it's built the way it is, and be confident it's correct. We may ask you to talk
through parts of it.

## The task

Take an analytical question written in plain English and answer it from the
database. It should handle a range of questions the data can support, not just
canned responses to the specific examples below.

In practice that means reading a question, working out what's being asked (which
records, what to measure, how to group and order the results), running the right
query without changing the data, and returning an answer that's easy to read and
shows the numbers behind it. When a question is unclear or can't be answered from
the data, it should say so rather than guess.

## Example questions

These are here to give you a feel for the range, not as a checklist:

```text
Who ordered the most in the last seven days? Return the top five users and their total order values.
Which products were ordered in the greatest quantities?
What was the total order value yesterday?
Which users ordered a specific product?
How many orders did each user place?
What is the average order value?
Which products generated the most order value?
Show the orders placed by a specific user.
```

## Interface

A command-line tool or a small HTTP API are both fine. You don't need a graphical
interface. Just tell us how to run it and how to ask it a question.

## AI implementation

Use whatever LLM provider or model you prefer. What matters is that a model is
actually doing the work of interpreting the question. How you set that up, and how
you keep it reliable, is your call.

## Deliverables

When you're done, send back:

- the repository with your solution
- how to install and run it, including setup for whatever AI provider you used
- a short description of how it works and why you built it that way
- the assumptions you made, and anything you know is missing or rough
- what you'd do next if you had more time

## Scope

We're looking for a reasonable MVP, and part of the exercise is deciding what that
is. You don't need to build everything a real product would have. You can skip
user accounts and login, any kind of UI, and deployment. If you're unsure whether
something belongs in scope, make a call and mention it in your notes.

## A note on submissions

Don't spend time on things that aren't part of the problem. Something small, clear,
and working beats something large and unfinished.

## Data reference

The exact schema is in [`src/database/schema.sql`](./src/database/schema.sql). The
sample data comes from the JSON files in [`data/seed/`](./data/seed), which are the
source of truth for what ends up in the database. Create the database with
`npm run db:create`.

A user places orders. Each order has one or more line items, and each line item
points at a product.

| Table         | Columns                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `users`       | `id`, `name`, `email` (unique), `created_at`                                                                 |
| `products`    | `id`, `name`, `sku` (unique), `current_price_cents` (>= 0), `created_at`                                     |
| `orders`      | `id`, `user_id` (references `users.id`), `ordered_at`                                                        |
| `order_items` | `id`, `order_id` (references `orders.id`), `product_id` (references `products.id`), `quantity` (> 0), `unit_price_cents` (>= 0) |

A few things worth knowing about the data:

- Money is stored as whole cents, never as a decimal. So $45.99 is `4599`. Keep
  amounts as integers when you calculate with them.
- There are two prices. `products.current_price_cents` is what the product costs
  now. `order_items.unit_price_cents` is what was actually charged per unit when
  that order was placed, which can be different. For anything about past orders,
  use the price on the order line, not the current price.
- Timestamps are ISO 8601 strings in UTC, like `2026-07-20T12:00:00.000Z`. They
  sort in time order as plain text, so you can compare them as strings.

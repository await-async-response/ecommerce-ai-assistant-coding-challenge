#!/usr/bin/env node

import { openDatabase } from './database/connection.ts';
import { answerQuestion } from './analytics/question-engine.ts';
import { parseQuestionIntent } from './ai/intent-parser.ts';

function printTable(rows: Array<Record<string, string | number>>, title: string): void {
  if (rows.length === 0) {
    console.log(`${title}\nNo matching orders were found for that period.`);
    return;
  }

  const headers = Object.keys(rows[0]);
  const widths = headers.map((header) => {
    const values = rows.map((row) => String(row[header] ?? ''));
    return Math.max(header.length, ...values.map((value) => value.length));
  });

  const formatRow = (values: Array<string | number>) =>
    `| ${values.map((value, index) => String(value).padEnd(widths[index], ' ')).join(' | ')} |`;

  console.log(title);
  console.log(formatRow(headers));
  console.log(`| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`);
  for (const row of rows) {
    console.log(formatRow(headers.map((header) => row[header] ?? '')));
  }
}

async function main(): Promise<void> {
  const rawQuestion = process.argv.slice(2).join(' ');

  if (!rawQuestion.trim()) {
    console.log('Usage: npm run ask -- "Which products were ordered in the greatest quantities?"');
    process.exit(1);
  }

  const db = openDatabase();
  try {
    const intent = await parseQuestionIntent(rawQuestion);
    const answer = answerQuestion(rawQuestion, db, intent);
    printTable(answer.rows, answer.title);
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error('Failed to process the question:', error instanceof Error ? error.message : error);
  process.exit(1);
});

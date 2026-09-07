import 'dotenv/config';

export type QuestionIntent =
  | { kind: 'top_users'; days?: number; limit?: number }
  | { kind: 'total_value'; period: 'yesterday' | 'last_n_days'; days?: number }
  | { kind: 'products_by_quantity'; limit?: number }
  | { kind: 'orders_per_user'; limit?: number }
  | { kind: 'average_order_value' }
  | { kind: 'products_by_order_value'; limit?: number }
  | { kind: 'users_for_product'; product: string }
  | { kind: 'orders_for_user'; user: string }
  | { kind: 'unsupported'; reason: string };

function fallbackIntent(question: string): QuestionIntent {
  const normalizedQuestion = question.trim().replace(/\s+/g, ' ');
  const lowerQuestion = normalizedQuestion.toLowerCase();

  if (/who.*ordered.*most|top.*users.*(last|recent)|ordered.*most.*last/i.test(normalizedQuestion)) {
    const match = normalizedQuestion.match(/last\s+(\d+)\s+day\s*/i);
    const days = match ? Number.parseInt(match[1], 10) : 7;
    return { kind: 'top_users', days, limit: 5 };
  }

  if (/what.*total.*order.*value.*yesterday|total.*order.*value.*yesterday|yesterday.*order.*value/i.test(lowerQuestion)) {
    return { kind: 'total_value', period: 'yesterday' };
  }

  if (/which products were ordered in the greatest quantities|products.*greatest quantities|ordered.*greatest quantities/i.test(lowerQuestion)) {
    return { kind: 'products_by_quantity', limit: 10 };
  }

  if (/how many orders did each user place|orders did each user place|orders per user|each user.*orders/i.test(lowerQuestion)) {
    return { kind: 'orders_per_user' };
  }

  if (/average order value|what is the average order value/i.test(lowerQuestion)) {
    return { kind: 'average_order_value' };
  }

  if (/products.*generated.*most.*order value|which products generated the most order value|most order value/i.test(lowerQuestion)) {
    return { kind: 'products_by_order_value', limit: 10 };
  }

  const productMatch = normalizedQuestion.match(/(?:specific\s+)?product(?:\s+(?:named|called|is|was))?\s+(.+?)(?:\?|$)/i)
    ?? normalizedQuestion.match(/product\s+(?:named|called)\s+(.+?)(?:\?|$)/i);
  if (productMatch && /which users.*ordered|users.*ordered.*product|ordered.*specific product|ordered.*product/i.test(lowerQuestion)) {
    return { kind: 'users_for_product', product: productMatch[1].trim() };
  }

  const userMatch = normalizedQuestion.match(/(?:show|list|give|display).*orders.*(?:for|by|of)\s+(.+?)(?:\?|$)/i)
    ?? normalizedQuestion.match(/orders.*placed\s+by\s+(.+?)(?:\?|$)/i)
    ?? normalizedQuestion.match(/user\s+(?:named|called)\s+(.+?)(?:\?|$)/i);
  if (userMatch && /show.*orders|orders.*specific user|orders.*placed.*by|orders.*for/i.test(lowerQuestion)) {
    return { kind: 'orders_for_user', user: userMatch[1].trim() };
  }

  return { kind: 'unsupported', reason: 'Question does not match a supported analytics pattern.' };
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

function isQuestionIntent(value: unknown): value is QuestionIntent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.kind !== 'string') return false;
  return true;
}

export async function parseQuestionIntent(question: string): Promise<QuestionIntent> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is not set; falling back to deterministic parser.');
    return fallbackIntent(question);
  }

  try {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You map ecommerce analytics questions to a JSON object. Supported kinds: top_users, total_value, products_by_quantity, orders_per_user, average_order_value, products_by_order_value, users_for_product, orders_for_user, unsupported. Keep only the fields relevant to the request. Output only valid JSON.',
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nReturn JSON only with a "kind" field and relevant options, e.g. {"kind":"top_users","days":7,"limit":5}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = json.choices?.[0]?.message?.content ?? '{}';
    const parsed = extractJsonObject(rawContent);

    if (parsed && isQuestionIntent(parsed)) {
      return parsed as QuestionIntent;
    }
  } catch (error) {
    console.warn('OpenAI intent parsing failed; falling back to deterministic parser.', error instanceof Error ? error.message : error);
  }

  return fallbackIntent(question);
}

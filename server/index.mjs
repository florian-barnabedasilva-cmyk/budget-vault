import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.API_PORT || 8787);
const MAX_BODY = 15 * 1024 * 1024;
const MAX_DATA_URL = 14 * 1024 * 1024;

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');

  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');

    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();

    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const API_KEY = process.env.GEMINI_API_KEY;

const ai = API_KEY
  ? new GoogleGenAI({
      apiKey: API_KEY,
    })
  : null;

const schema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['income', 'expense', 'savings'],
    },

    amount: {
      type: 'number',
      minimum: 0,
    },

    label: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },

    category: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
    },

    date: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    },

    confidence: {
      type: 'object',
      properties: {
        type: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },

        amount: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },

        label: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },

        category: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },

        date: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },
      },
      required: [
        'type',
        'amount',
        'label',
        'category',
        'date',
      ],
    },

    needsReview: {
      type: 'boolean',
    },
  },

  required: [
    'type',
    'amount',
    'label',
    'category',
    'date',
    'confidence',
    'needsReview',
  ],
};

const instructions = `
Tu es le moteur d'analyse de justificatifs de Budget Vault.

Ta mission est UNIQUEMENT de transformer un ticket, reçu, facture,
capture de paiement ou justificatif en une transaction Budget Vault.

Le modèle de transaction contient exactement :

- type : income | expense | savings
- amount : nombre positif
- label : libellé court
- category : catégorie fournie
- date : YYYY-MM-DD

N'extrais PAS et ne retournes PAS :

- nom du commerçant
- adresse
- téléphone
- email
- TVA
- numéro de facture
- numéro fiscal
- moyen de paiement
- coordonnées bancaires
- autre information inutile

RÈGLES :

1. Un achat, ticket, facture ou paiement effectué correspond à "expense".

2. Un salaire, versement entrant ou paiement reçu clairement identifié
   correspond à "income".

3. Une opération explicitement destinée à l'épargne correspond à "savings".

4. amount doit correspondre au montant final réellement payé ou reçu.

5. Si plusieurs montants sont présents, privilégie le montant TOTAL
   réellement payé ou reçu.

6. Ne choisis pas arbitrairement un montant lorsqu'il est impossible
   de déterminer lequel est le montant final.

7. date doit correspondre à la date de transaction.

8. N'utilise pas une date d'échéance ou une autre date secondaire.

9. label doit être court, naturel et décrire la nature de la transaction.

Exemples :

- Courses alimentaires
- Achat de carburant
- Paiement Internet
- Facture d'électricité
- Loyer
- Restaurant
- Transport
- Salaire
- Achat vêtements

10. category doit être choisie UNIQUEMENT parmi les catégories fournies.

11. N'invente jamais de catégorie.

12. Si aucune catégorie ne correspond clairement,
    utilise la catégorie de repli fournie.

13. Les montants FCFA/XOF doivent être retournés comme des nombres,
    sans symbole monétaire ni séparateur.

Exemple :

25500

et non :

25 500 FCFA

14. La date doit toujours être au format :

YYYY-MM-DD

15. Si une information est ambiguë, diminue son score de confiance
    et mets needsReview à true.

16. Si le document ne permet pas d'identifier raisonnablement
    une transaction, mets needsReview à true.

17. Retourne uniquement le JSON demandé.
`;

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  });

  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;

      if (size > MAX_BODY) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', reject);
  });
}

function normalizeResult(result, categories) {
  const allowed = categories
    .map((category) => category.name)
    .filter(Boolean);

  const fallback =
    allowed.find(
      (name) => name.toLowerCase() === 'autres'
    ) || allowed[allowed.length - 1];

  const amount = Number(result.amount);

  const validDate =
    typeof result.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(result.date);

  const validCategory =
    typeof result.category === 'string' &&
    allowed.includes(result.category);

  const validType = [
    'income',
    'expense',
    'savings',
  ].includes(result.type);

  const normalizedConfidence = {
    type: Number(result.confidence?.type ?? 0),
    amount: Number(result.confidence?.amount ?? 0),
    label: Number(result.confidence?.label ?? 0),
    category: Number(result.confidence?.category ?? 0),
    date: Number(result.confidence?.date ?? 0),
  };

  const confidenceNeedsReview =
    Object.values(normalizedConfidence).some(
      (value) => !Number.isFinite(value) || value < 0.7
    );

  return {
    type: validType ? result.type : 'expense',

    amount:
      Number.isFinite(amount) && amount >= 0
        ? amount
        : 0,

    label: String(
      result.label || 'Transaction'
    )
      .trim()
      .slice(0, 100),

    category: validCategory
      ? result.category
      : fallback,

    date: validDate
      ? result.date
      : new Date().toISOString().slice(0, 10),

    confidence: normalizedConfidence,

    needsReview:
      Boolean(result.needsReview) ||
      !validType ||
      !validCategory ||
      !validDate ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      confidenceNeedsReview,
  };
}

function parseDataUrl(dataUrl, mimeType) {
  const prefix = `data:${mimeType};base64,`;

  if (
    typeof dataUrl !== 'string' ||
    !dataUrl.startsWith(prefix)
  ) {
    throw new Error('INVALID_FILE');
  }

  return dataUrl.slice(prefix.length);
}

async function analyzeReceipt({
  dataUrl,
  mimeType,
  categories,
}) {
  if (!API_KEY || !ai) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  if (
    !Array.isArray(categories) ||
    categories.length === 0
  ) {
    throw new Error('CATEGORIES_REQUIRED');
  }

  if (
    typeof dataUrl !== 'string' ||
    dataUrl.length > MAX_DATA_URL
  ) {
    throw new Error('INVALID_FILE');
  }

  const supportedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (!supportedMimeTypes.includes(mimeType)) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  const base64Data = parseDataUrl(
    dataUrl,
    mimeType
  );

  const names = categories
    .map((category) => category.name)
    .filter(Boolean);

  const fallback =
    names.find(
      (name) => name.toLowerCase() === 'autres'
    ) || names[names.length - 1];

  const categoryList = names
    .map((name) => `- ${name}`)
    .join('\n');

  const prompt = `
${instructions}

CATÉGORIES AUTORISÉES :

${categoryList}

CATÉGORIE DE REPLI :

${fallback}

Analyse maintenant le justificatif fourni.
`;

  const input =
    mimeType === 'application/pdf'
      ? [
          {
            type: 'document',
            data: base64Data,
            mime_type: mimeType,
          },
          {
            type: 'text',
            text: prompt,
          },
        ]
      : [
          {
            type: 'image',
            data: base64Data,
            mime_type: mimeType,
          },
          {
            type: 'text',
            text: prompt,
          },
        ];

  const interaction =
    await ai.interactions.create({
      model: MODEL,
      input,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema,
      },
    });

  const outputText =
    interaction?.output_text;

  if (!outputText) {
    throw new Error('INVALID_AI_OUTPUT');
  }

  let parsed;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    console.error(
      'Gemini returned invalid JSON:',
      outputText
    );

    throw new Error('INVALID_AI_OUTPUT');
  }

  return normalizeResult(
    parsed,
    categories
  );
}

const server = http.createServer(
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      return sendJson(res, 204, {});
    }

    if (
      req.method === 'GET' &&
      req.url === '/api/health'
    ) {
      return sendJson(res, 200, {
        ok: true,
        aiConfigured: Boolean(API_KEY),
        provider: 'gemini',
        model: MODEL,
      });
    }

    if (
      req.method === 'POST' &&
      req.url === '/api/ai/analyze-receipt'
    ) {
      try {
        const body = await readJson(req);

        const result =
          await analyzeReceipt(body);

        return sendJson(res, 200, {
          ok: true,
          result,
        });
      } catch (error) {
        console.error(
          'Gemini analysis error:',
          error
        );

        const message =
          error?.message ||
          'ANALYSIS_FAILED';

        let status = 500;

        if (
          [
            'PAYLOAD_TOO_LARGE',
            'INVALID_FILE',
            'INVALID_JSON',
            'CATEGORIES_REQUIRED',
            'UNSUPPORTED_FILE_TYPE',
          ].includes(message)
        ) {
          status = 400;
        }

        if (
          message ===
          'GEMINI_API_KEY_MISSING'
        ) {
          status = 503;
        }

        return sendJson(res, status, {
          ok: false,
          error: message,
        });
      }
    }

    if (req.method === 'GET') {
      const dist = path.resolve(
        ROOT,
        'dist'
      );

      const requested = decodeURIComponent(
        (req.url || '/').split('?')[0]
      );

      const relative =
        requested === '/'
          ? 'index.html'
          : requested.replace(/^\/+/, '');

      const candidate = path.resolve(
        dist,
        relative
      );

      const filePath =
        candidate.startsWith(dist) &&
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile()
          ? candidate
          : path.join(
              dist,
              'index.html'
            );

      if (fs.existsSync(filePath)) {
        const ext =
          path.extname(filePath);

        const types = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
        };

        res.writeHead(200, {
          'Content-Type':
            types[ext] ||
            'application/octet-stream',
        });

        return fs
          .createReadStream(filePath)
          .pipe(res);
      }
    }

    return sendJson(res, 404, {
      ok: false,
      error: 'NOT_FOUND',
    });
  }
);

server.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Budget Vault API listening on http://localhost:${PORT}`
    );
  }
);
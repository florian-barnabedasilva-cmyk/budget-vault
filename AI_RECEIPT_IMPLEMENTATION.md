# Budget Vault — Scanner IA de justificatifs

## Fonctionnement

`Photo/PDF -> API sécurisée -> OpenAI Responses API -> JSON structuré -> TransactionModal existant -> validation utilisateur -> addTransaction()`

La fonctionnalité n'ajoute aucun champ au modèle `Transaction`. Elle remplit uniquement : `type`, `amount`, `label`, `category`, `date`.

## Fichiers ajoutés

- `server/index.mjs` : API Node native, clé OpenAI côté serveur, validation et appel multimodal.
- `src/services/receipt-analyzer.ts` : upload côté frontend et appel de l'API.
- `src/types/ai.ts` : types du résultat IA.
- `.env.example` : variables d'environnement.

## Fichier modifié

- `src/components/TransactionModal.tsx` : ajout de l'import/photo, état d'analyse, préremplissage et avertissement de vérification.
- `vite.config.ts` : proxy `/api` vers le serveur local.
- `package.json` : scripts `dev:api`, `dev:full`, `start`.

## Installation

1. Copier `.env.example` vers `.env`.
2. Mettre la clé dans `OPENAI_API_KEY`.
3. Vérifier Node.js 20+ recommandé.
4. Installer les dépendances existantes avec `npm install` si `node_modules` n'existe pas.
5. Lancer `npm run dev:full`.

## Production

- `npm run build`
- `npm start`

Le serveur Node sert `dist` et l'API `/api/ai/analyze-receipt`.

## Sécurité

La clé OpenAI n'est jamais incluse dans le bundle Vite. Le navigateur envoie uniquement le fichier encodé et la liste des catégories. Le serveur valide le type/taille du fichier, les catégories et normalise le résultat avant de le retourner.

## Limites

- Fichier maximum côté frontend : 10 Mo.
- Formats : JPEG, PNG, WebP et PDF.
- L'IA ne crée jamais directement une transaction.
- Une information ambiguë déclenche `needsReview=true` et l'utilisateur doit vérifier le formulaire.

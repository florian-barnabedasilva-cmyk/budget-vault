import type { Category } from "@/hooks/use-budget";
import type {
  AIReceiptResponse,
  AITransactionResult,
} from "@/types/ai";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function fileToDataUrl(
  file: File
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(
          String(reader.result)
        );

      reader.onerror = () =>
        reject(
          new Error(
            "Impossible de lire le fichier."
          )
        );

      reader.readAsDataURL(file);
    }
  );
}

export async function analyzeReceipt(
  file: File,
  categories: Category[]
): Promise<AITransactionResult> {
  if (
    !ALLOWED_TYPES.has(file.type)
  ) {
    throw new Error(
      "Format non pris en charge. Utilisez une image JPEG, PNG, WebP ou un PDF."
    );
  }

  if (
    file.size > MAX_FILE_BYTES
  ) {
    throw new Error(
      "Le fichier est trop volumineux. Limite : 10 Mo."
    );
  }

  if (!categories.length) {
    throw new Error(
      "Aucune catégorie disponible."
    );
  }

  const dataUrl =
    await fileToDataUrl(file);

  const response = await fetch(
    "/api/ai/analyze-receipt",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        dataUrl,
        mimeType: file.type,

        categories:
          categories.map(
            ({ id, name }) => ({
              id,
              name,
            })
          ),
      }),
    }
  );

  let payload:
    | AIReceiptResponse
    | null = null;

  try {
    payload =
      (await response.json()) as AIReceiptResponse;
  } catch {
    throw new Error(
      "Le serveur IA a retourné une réponse invalide."
    );
  }

  if (
    !response.ok ||
    !payload.ok ||
    !payload.result
  ) {
    const message =
      payload.error ===
      "GEMINI_API_KEY_MISSING"
        ? "L'IA Gemini n'est pas configurée sur le serveur."
        : payload.error ===
          "UNSUPPORTED_FILE_TYPE"
        ? "Ce format de fichier n'est pas pris en charge par Gemini."
        : payload.error ||
          "L'analyse du justificatif a échoué.";

    throw new Error(message);
  }

  return payload.result;
}
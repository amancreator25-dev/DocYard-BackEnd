import "dotenv/config";

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/*
|--------------------------------------------------------------------------
| MODELS
|--------------------------------------------------------------------------
*/

const PRIMARY_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.7-flash";

const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ||
  "gemini-3.6-flash";

const SECONDARY_MODEL =
  process.env.GEMINI_SECONDARY_MODEL ||
  "gemini-3.5-flash-lite";

const MODELS = [
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  SECONDARY_MODEL,
].filter(
  (model, index, array) =>
    array.indexOf(model) === index
);

/*
|--------------------------------------------------------------------------
| MIME TYPE
|--------------------------------------------------------------------------
*/

const getMimeType = (fileType) => {
  switch (fileType?.toLowerCase()) {
    case "pdf":
      return "application/pdf";

    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    case "txt":
      return "text/plain";

    default:
      throw new Error(
        `Unsupported document file type: ${fileType}`
      );
  }
};

/*
|--------------------------------------------------------------------------
| SLEEP
|--------------------------------------------------------------------------
*/

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

/*
|--------------------------------------------------------------------------
| CHECK WHETHER ERROR IS RETRYABLE
|--------------------------------------------------------------------------
*/

const isRetryableError = (error) => {
  const status =
    error?.status ||
    error?.code ||
    error?.error?.code;

  const message =
    error?.message ||
    "";

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("temporarily")
  );
};

/*
|--------------------------------------------------------------------------
| DOWNLOAD DOCUMENT FROM CLOUDINARY
|--------------------------------------------------------------------------
*/

const downloadDocument = async (
  document
) => {
  if (!document?.fileUrl) {
    throw new Error(
      "Document file URL is missing"
    );
  }

  const fileUrl =
    document.fileUrl;

  console.log(
    "Downloading document from:",
    fileUrl
  );

  const response =
    await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download document from Cloudinary. Status: ${response.status}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error(
      "Downloaded document is empty"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TEMP DIRECTORY
  |--------------------------------------------------------------------------
  */

  const tempDirectory =
    path.join(
      os.tmpdir(),
      "docyard-ai"
    );

  await fs.promises.mkdir(
    tempDirectory,
    {
      recursive: true,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | TEMP FILE
  |--------------------------------------------------------------------------
  */

  const extension =
    document.fileType
      ? `.${document.fileType.toLowerCase()}`
      : "";

  const fileName =
    `${crypto.randomUUID()}${extension}`;

  const filePath =
    path.join(
      tempDirectory,
      fileName
    );

  await fs.promises.writeFile(
    filePath,
    buffer
  );

  console.log(
    "Document downloaded temporarily to:",
    filePath
  );

  return filePath;
};

/*
|--------------------------------------------------------------------------
| UPLOAD DOCUMENT TO GEMINI
|--------------------------------------------------------------------------
*/

const uploadDocumentToGemini = async (
  document
) => {
  let filePath;

  try {
    /*
    |--------------------------------------------------------------------------
    | Download Cloudinary document
    |--------------------------------------------------------------------------
    */

    filePath =
      await downloadDocument(
        document
      );

    const mimeType =
      getMimeType(
        document.fileType
      );

    console.log(
      "Uploading document to Gemini..."
    );

    /*
    |--------------------------------------------------------------------------
    | Upload to Gemini
    |--------------------------------------------------------------------------
    */

    const uploadedFile =
      await ai.files.upload({
        file: filePath,
        config: {
          mimeType,
        },
      });

    if (!uploadedFile?.uri) {
      throw new Error(
        "Document could not be uploaded to Gemini"
      );
    }

    console.log(
      "Document uploaded to Gemini:",
      uploadedFile.uri
    );

    return uploadedFile;
  } finally {
    /*
    |--------------------------------------------------------------------------
    | DELETE TEMPORARY FILE
    |--------------------------------------------------------------------------
    */

    if (filePath) {
      try {
        await fs.promises.unlink(
          filePath
        );

        console.log(
          "Temporary document deleted"
        );
      } catch (cleanupError) {
        console.error(
          "Temporary file cleanup error:",
          cleanupError
        );
      }
    }
  }
};

/*
|--------------------------------------------------------------------------
| GENERATE CONTENT WITH MODEL FALLBACK
|--------------------------------------------------------------------------
*/

const generateContentWithFallback = async (
  uploadedFile,
  prompt
) => {
  let lastError = null;

  /*
  |--------------------------------------------------------------------------
  | Try every configured model
  |--------------------------------------------------------------------------
  */

  for (
    let modelIndex = 0;
    modelIndex < MODELS.length;
    modelIndex++
  ) {
    const model =
      MODELS[modelIndex];

    console.log(
      `Trying Gemini model: ${model}`
    );

    /*
    |--------------------------------------------------------------------------
    | Retry current model up to 3 times
    |--------------------------------------------------------------------------
    */

    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {
      try {
        console.log(
          `Model ${model} - attempt ${attempt}/3`
        );

        const response =
          await ai.models.generateContent({
            model,
            contents: [
              createUserContent([
                createPartFromUri(
                  uploadedFile.uri,
                  uploadedFile.mimeType
                ),
                prompt,
              ]),
            ],
          });

        console.log(
          `Gemini generation succeeded using ${model}`
        );

        return response;
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini error using ${model}, attempt ${attempt}:`,
          error?.message ||
            error
        );

        /*
        |--------------------------------------------------------------------------
        | Non-retryable error
        |--------------------------------------------------------------------------
        */

        if (
          !isRetryableError(error)
        ) {
          throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | If there are more attempts,
        | use exponential backoff.
        |--------------------------------------------------------------------------
        */

        if (attempt < 3) {
          const baseDelay =
            2000 *
            Math.pow(
              2,
              attempt - 1
            );

          const jitter =
            Math.floor(
              Math.random() * 1000
            );

          const delay =
            baseDelay +
            jitter;

          console.log(
            `Waiting ${delay}ms before retry...`
          );

          await sleep(delay);
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Current model failed all attempts
    |--------------------------------------------------------------------------
    */

    if (
      modelIndex <
      MODELS.length - 1
    ) {
      console.log(
        `${model} unavailable. Switching to next model...`
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | All models failed
  |--------------------------------------------------------------------------
    */

  throw lastError ||
    new Error(
      "All configured Gemini models are currently unavailable."
    );
};

/*
|--------------------------------------------------------------------------
| GENERATE SUMMARY
|--------------------------------------------------------------------------
*/

const generateSummary = async (
  document
) => {
  try {
    console.log(
      "Starting document summarization..."
    );

    /*
    |--------------------------------------------------------------------------
    | Upload document
    |--------------------------------------------------------------------------
    */

    const uploadedFile =
      await uploadDocumentToGemini(
        document
      );

    /*
    |--------------------------------------------------------------------------
    | Summary prompt
    |--------------------------------------------------------------------------
    */

    const prompt = `
You are an expert document summarization assistant
for DocYard.

Analyze the uploaded document carefully.

Create a clear and useful summary that includes:

1. A short overview
2. Main topics or ideas
3. Important points
4. Important facts, findings, or conclusions
5. A concise final takeaway

Rules:

- Do not invent information.
- Only use information present in the document.
- Preserve important names, dates, numbers, and facts.
- Use simple and clear language.
- Use headings and bullet points where appropriate.
- Do not mention that you are an AI.
- Do not include unnecessary filler.
- Do not add information that is not present in the document.

Document title:
${document.title || "Untitled Document"}

Document author:
${
  typeof document.author ===
  "string"
    ? document.author
    : "Unknown"
}

Return only the summary.
`;

    /*
    |--------------------------------------------------------------------------
    | Generate using fallback system
    |--------------------------------------------------------------------------
    */

    console.log(
      "Generating summary with Gemini..."
    );

    const response =
      await generateContentWithFallback(
        uploadedFile,
        prompt
      );

    const summary =
      response.text?.trim();

    if (!summary) {
      throw new Error(
        "Gemini returned an empty summary"
      );
    }

    console.log(
      "Document summary generated successfully"
    );

    return summary;
  } catch (error) {
    console.error(
      "Generate Summary Error:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to generate document summary"
    );
  }
};

/*
|--------------------------------------------------------------------------
| TRANSLATE DOCUMENT
|--------------------------------------------------------------------------
*/

const translateDocument = async (
  document,
  targetLanguage
) => {
  try {
    if (
      !targetLanguage?.trim()
    ) {
      throw new Error(
        "Target language is required"
      );
    }

    console.log(
      `Starting document translation to: ${targetLanguage}`
    );

    /*
    |--------------------------------------------------------------------------
    | Upload document
    |--------------------------------------------------------------------------
    */

    const uploadedFile =
      await uploadDocumentToGemini(
        document
      );

    const language =
      targetLanguage.trim();

    /*
    |--------------------------------------------------------------------------
    | Translation prompt
    |--------------------------------------------------------------------------
    */

    const prompt = `
You are a professional document translation
assistant for DocYard.

Translate the complete content of the uploaded
document into:

${language}

Rules:

- Translate the complete document.
- Preserve the original meaning.
- Do not summarize.
- Do not add information.
- Do not remove important information.
- Preserve names, numbers, dates, references,
  citations, and important terminology.
- Maintain the structure of the original document
  as much as possible.
- Use natural and grammatically correct ${language}.
- If a technical term should remain in its original
  form, keep it where appropriate.
- Preserve headings and sections where possible.
- Return only the translated content.
- Do not include explanations about the translation.
- Do not say that you are an AI.

Document title:
${document.title || "Untitled Document"}

Return only the translated document content.
`;

    /*
    |--------------------------------------------------------------------------
    | Generate translation
    |--------------------------------------------------------------------------
    */

    console.log(
      "Generating translation with Gemini..."
    );

    const response =
      await generateContentWithFallback(
        uploadedFile,
        prompt
      );

    const translation =
      response.text?.trim();

    if (!translation) {
      throw new Error(
        "Gemini returned an empty translation"
      );
    }

    console.log(
      "Document translated successfully"
    );

    return translation;
  } catch (error) {
    console.error(
      "Translate Document Error:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to generate document translation"
    );
  }
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

export {
  generateSummary,
  translateDocument,
};
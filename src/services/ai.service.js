import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

import fs from "fs";
import path from "path";

// ======================================
// GEMINI CLIENT
// ======================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.7-flash";


// ======================================
// GET FILE PATH
// ======================================

const getDocumentFilePath = (document) => {
  if (!document?.fileUrl) {
    throw new Error("Document file URL is missing");
  }

  /*
   * fileUrl example:
   *
   * /uploads/documents/1755789123456-file.pdf
   *
   * Convert it to:
   *
   * <project-root>/uploads/documents/file.pdf
   */

  const relativePath = document.fileUrl.replace(
    /^[/\\]+/,
    ""
  );

  const filePath = path.resolve(
    process.cwd(),
    relativePath
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      "Document file could not be found on the server"
    );
  }

  return filePath;
};


// ======================================
// GET MIME TYPE
// ======================================

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
        "Unsupported document file type"
      );
  }
};


// ======================================
// UPLOAD DOCUMENT TO GEMINI
// ======================================

const uploadDocumentToGemini = async (document) => {
  const filePath = getDocumentFilePath(document);

  const mimeType = getMimeType(
    document.fileType
  );

  const uploadedFile = await ai.files.upload({
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

  return uploadedFile;
};


// ======================================
// SUMMARIZE DOCUMENT
// ======================================

const generateSummary = async (document) => {
  try {
    const uploadedFile =
      await uploadDocumentToGemini(document);

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

Document title:
${document.title}

Document author:
${document.author}

Return only the summary.
`;

    const response =
      await ai.models.generateContent({
        model: MODEL,

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

    const summary = response.text?.trim();

    if (!summary) {
      throw new Error(
        "Gemini returned an empty summary"
      );
    }

    return summary;
  } catch (error) {
    console.error(
      "Generate Summary Error:",
      error
    );

    throw new Error(
      "Failed to generate document summary"
    );
  }
};


// ======================================
// TRANSLATE DOCUMENT
// ======================================

const translateDocument = async (
  document,
  targetLanguage
) => {
  try {
    if (!targetLanguage?.trim()) {
      throw new Error(
        "Target language is required"
      );
    }

    const uploadedFile =
      await uploadDocumentToGemini(document);

    const prompt = `
You are a professional document translation
assistant for DocYard.

Translate the content of the uploaded document into:

${targetLanguage}

Rules:

- Preserve the original meaning.
- Do not summarize.
- Do not add information.
- Preserve names, numbers, dates, references, and important terminology.
- Maintain the structure of the original document as much as possible.
- Use natural and grammatically correct ${targetLanguage}.
- If a technical term should remain in its original form, keep it where appropriate.
- Return only the translated content.

Document title:
${document.title}
`;

    const response =
      await ai.models.generateContent({
        model: MODEL,

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

    const translation = response.text?.trim();

    if (!translation) {
      throw new Error(
        "Gemini returned an empty translation"
      );
    }

    return translation;
  } catch (error) {
    console.error(
      "Translate Document Error:",
      error
    );

    throw new Error(
      "Failed to translate document"
    );
  }
};


// ======================================
// EXPORT
// ======================================

export {
  generateSummary,
  translateDocument,
};
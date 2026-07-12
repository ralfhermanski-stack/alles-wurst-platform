import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  saveSubmissionDraft,
  submitSubmission,
} from "@/lib/challenges/challenge-submission-service";

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const formData = await request.formData();
  const challengeId = String(formData.get("challengeId") ?? "");
  const mode = String(formData.get("mode") ?? "draft");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const recipeContent = String(formData.get("recipeContent") ?? "");
  const publicConsent = formData.get("publicConsent") === "true";
  const mediaRightsConsent = formData.get("mediaRightsConsent") === "true";
  const files = formData
    .getAll("files")
    .filter((entry) => entry instanceof File) as File[];

  const newImages = await Promise.all(
    files.map(async (file) => ({
      fileName: file.name,
      mimeType: file.type || "image/jpeg",
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );

  const draftResult = await saveSubmissionDraft(challengeId, userId, {
    title,
    description,
    recipeContent: recipeContent || null,
    publicConsent,
    mediaRightsConsent,
    newImages,
  });

  if (!draftResult.success) {
    return jsonFromAuthResult(draftResult);
  }

  if (mode === "final") {
    const submitResult = await submitSubmission(challengeId, userId);
    return jsonFromAuthResult(submitResult);
  }

  return jsonFromAuthResult(draftResult);
}

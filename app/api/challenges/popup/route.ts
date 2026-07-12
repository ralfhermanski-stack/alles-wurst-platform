import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  recordPopupAction,
  shouldShowChallengePopup,
} from "@/lib/challenges/challenge-popup-service";
import { getActiveHomepageChallenge } from "@/lib/challenges/challenge-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({ success: true, data: null });
  }

  const challenge = await getActiveHomepageChallenge();

  if (!challenge) {
    return jsonFromAuthResult({ success: true, data: null });
  }

  const show = await shouldShowChallengePopup(userId, challenge.id);

  if (!show) {
    return jsonFromAuthResult({ success: true, data: null });
  }

  return jsonFromAuthResult({
    success: true,
    data: {
      challengeId: challenge.id,
      slug: challenge.slug,
      title: challenge.title,
      excerpt: challenge.excerpt,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const body = (await request.json()) as {
    challengeId?: string;
    action?: "SEEN" | "REMIND_LATER" | "DISMISSED";
  };

  if (!body.challengeId || !body.action) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Ungültige Anfrage." },
    });
  }

  await recordPopupAction(userId, body.challengeId, body.action);

  return jsonFromAuthResult({ success: true, data: true });
}

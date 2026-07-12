/**
 * @file social-media-instagram-test.ts
 * @purpose Serverseitiger Instagram Graph API Verbindungstest.
 */

import { prisma } from "@/lib/db/prisma";

import {
  fetchInstagramAccountInfo,
  fetchInstagramMedia,
} from "./providers/instagram-provider";
import { getSocialCredential } from "./social-media-sync-service";

export type InstagramConnectionTestResult = {
  success: boolean;
  testedAt: string;
  accountName: string | null;
  username: string | null;
  accountId: string | null;
  mediaCount: number;
  message: string;
  errorCode?: string;
  technicalDetail?: string;
};

async function resolveInstagramAccountId(
  channelId: string,
  externalChannelId: string | null,
): Promise<string | null> {
  const credentialAccountId = await getSocialCredential(channelId, "account_id");

  if (credentialAccountId?.trim()) {
    return credentialAccountId.trim();
  }

  if (externalChannelId?.trim()) {
    return externalChannelId.trim();
  }

  return null;
}

export async function testInstagramConnection(
  channelId: string,
): Promise<InstagramConnectionTestResult> {
  const testedAt = new Date().toISOString();

  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.platform !== "INSTAGRAM") {
    return {
      success: false,
      testedAt,
      accountName: null,
      username: null,
      accountId: null,
      mediaCount: 0,
      message: "Instagram-Kanal nicht gefunden.",
      errorCode: "CHANNEL_NOT_FOUND",
    };
  }

  const accountId = await resolveInstagramAccountId(
    channelId,
    channel.externalChannelId,
  );

  if (!accountId) {
    return {
      success: false,
      testedAt,
      accountName: channel.publicName ?? channel.name,
      username: channel.handle,
      accountId: null,
      mediaCount: 0,
      message:
        "Die Instagram Business Account-ID fehlt. Bitte unter „Kanäle“ als externe Kanal-ID oder unter „Schnittstellen“ als Account-ID hinterlegen.",
      errorCode: "ACCOUNT_ID_MISSING",
    };
  }

  const accessToken = await getSocialCredential(channelId, "access_token");

  if (!accessToken) {
    return {
      success: false,
      testedAt,
      accountName: channel.publicName ?? channel.name,
      username: channel.handle,
      accountId,
      mediaCount: 0,
      message: "Der Instagram Access Token wurde noch nicht eingerichtet.",
      errorCode: "ACCESS_TOKEN_MISSING",
    };
  }

  try {
    const accountInfo = await fetchInstagramAccountInfo({
      accessToken,
      accountId,
    });

    const media = await fetchInstagramMedia({ accessToken, accountId }, 3);

    await prisma.socialMediaChannel.update({
      where: { id: channelId },
      data: {
        connectionStatus: "CONNECTED",
        publicName: accountInfo.name ?? channel.publicName,
        handle: accountInfo.username ?? channel.handle,
        profileUrl:
          channel.profileUrl ??
          (accountInfo.username
            ? `https://www.instagram.com/${accountInfo.username}/`
            : null),
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    return {
      success: true,
      testedAt,
      accountName: accountInfo.name,
      username: accountInfo.username,
      accountId,
      mediaCount: media.length,
      message: "Die Instagram-Verbindung wurde erfolgreich getestet.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Die Instagram-Verbindung konnte nicht getestet werden.";

    const tokenExpired =
      message.toLowerCase().includes("expired") ||
      message.toLowerCase().includes("session has been invalidated") ||
      message.includes("190");

    await prisma.socialMediaChannel.update({
      where: { id: channelId },
      data: {
        connectionStatus: tokenExpired ? "TOKEN_EXPIRED" : "ERROR",
        lastErrorAt: new Date(),
        lastErrorMessage: message.slice(0, 500),
      },
    });

    return {
      success: false,
      testedAt,
      accountName: channel.publicName ?? channel.name,
      username: channel.handle,
      accountId,
      mediaCount: 0,
      message: tokenExpired
        ? "Der Instagram Access Token ist abgelaufen. Bitte einen neuen Token hinterlegen."
        : "Die Instagram-Verbindung konnte nicht getestet werden.",
      errorCode: tokenExpired ? "TOKEN_EXPIRED" : "INSTAGRAM_API_ERROR",
      technicalDetail: message.slice(0, 200),
    };
  }
}

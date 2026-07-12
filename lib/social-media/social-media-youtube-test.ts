/**
 * @file social-media-youtube-test.ts
 * @purpose Echter serverseitiger YouTube-Verbindungstest.
 */

import { prisma } from "@/lib/db/prisma";

import {
  fetchYouTubeChannelInfo,
  fetchYouTubePlaylistVideos,
} from "./providers/youtube-provider";
import { getSocialCredential } from "./social-media-sync-service";

export type YouTubeConnectionTestResult = {
  success: boolean;
  testedAt: string;
  channelName: string | null;
  channelId: string | null;
  uploadsPlaylistId: string | null;
  videoCount: number;
  message: string;
  errorCode?: string;
  technicalDetail?: string;
};

export async function testYouTubeConnection(
  channelId: string,
): Promise<YouTubeConnectionTestResult> {
  const testedAt = new Date().toISOString();

  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.platform !== "YOUTUBE") {
    return {
      success: false,
      testedAt,
      channelName: null,
      channelId: null,
      uploadsPlaylistId: null,
      videoCount: 0,
      message: "YouTube-Kanal nicht gefunden.",
      errorCode: "CHANNEL_NOT_FOUND",
    };
  }

  if (!channel.externalChannelId?.trim()) {
    return {
      success: false,
      testedAt,
      channelName: channel.publicName ?? channel.name,
      channelId: null,
      uploadsPlaylistId: null,
      videoCount: 0,
      message: "Die YouTube-Kanal-ID wurde noch nicht eingerichtet.",
      errorCode: "CHANNEL_ID_MISSING",
    };
  }

  const apiKey =
    (await getSocialCredential(channelId, "api_key")) ??
    process.env.YOUTUBE_API_KEY?.trim() ??
    null;

  if (!apiKey) {
    return {
      success: false,
      testedAt,
      channelName: channel.publicName ?? channel.name,
      channelId: channel.externalChannelId,
      uploadsPlaylistId: null,
      videoCount: 0,
      message: "Der YouTube-API-Schlüssel wurde noch nicht eingerichtet.",
      errorCode: "API_KEY_MISSING",
    };
  }

  try {
    const channelInfo = await fetchYouTubeChannelInfo({
      apiKey,
      channelId: channel.externalChannelId,
    });

    const playlistId =
      (await getSocialCredential(channelId, "playlist_id")) ??
      channelInfo.uploadsPlaylistId;

    let videoCount = 0;

    if (playlistId) {
      const videos = await fetchYouTubePlaylistVideos(
        {
          apiKey,
          channelId: channel.externalChannelId,
          playlistId,
        },
        3,
      );
      videoCount = videos.length;
    }

    await prisma.socialMediaChannel.update({
      where: { id: channelId },
      data: {
        connectionStatus: "CONNECTED",
        publicName: channelInfo.title ?? channel.publicName,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    return {
      success: true,
      testedAt,
      channelName: channelInfo.title,
      channelId: channel.externalChannelId,
      uploadsPlaylistId: playlistId,
      videoCount,
      message: "Die YouTube-Verbindung wurde erfolgreich getestet.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Die YouTube-Verbindung konnte nicht getestet werden.";

    await prisma.socialMediaChannel.update({
      where: { id: channelId },
      data: {
        connectionStatus: "ERROR",
        lastErrorAt: new Date(),
        lastErrorMessage: message.slice(0, 500),
      },
    });

    return {
      success: false,
      testedAt,
      channelName: channel.publicName ?? channel.name,
      channelId: channel.externalChannelId,
      uploadsPlaylistId: null,
      videoCount: 0,
      message:
        message.includes("404") || message.includes("nicht gefunden")
          ? "Die angegebene YouTube-Kanal-ID konnte nicht gefunden werden."
          : "Die YouTube-Verbindung konnte nicht getestet werden.",
      errorCode: "YOUTUBE_API_ERROR",
      technicalDetail: message.slice(0, 200),
    };
  }
}

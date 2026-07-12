import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import type { HomepageSocialCard } from "@/lib/social-media/social-media-types";

import SocialPlatformCardView from "./SocialPlatformCardView";

type SocialPlatformCardProps = {
  platform: HomepageSocialCard;
};

export default async function SocialPlatformCard({ platform }: SocialPlatformCardProps) {
  const followerLabel = await getPlatformText("homepage.social.follow", "Abonnenten");

  return <SocialPlatformCardView platform={platform} followerLabel={followerLabel} />;
}

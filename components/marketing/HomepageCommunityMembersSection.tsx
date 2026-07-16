import UserAvatar from "@/components/member/UserAvatar";
import PlatformText from "@/components/platform-text/PlatformText";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import { getHomepageCommunityReviewsSettings } from "@/lib/reviews/homepage-reviews-settings-service";
import {
  countPublicMembers,
  formatPublicMemberCount,
  listPublicMembersForHomepage,
} from "@/lib/reviews/member-count-service";

function formatGermanNumber(value: number): string {
  return value.toLocaleString("de-DE");
}

export default async function HomepageCommunityMembersSection() {
  const [members, memberCountRaw, settings] = await Promise.all([
    listPublicMembersForHomepage(),
    countPublicMembers(),
    getHomepageCommunityReviewsSettings(),
  ]);

  if (memberCountRaw === 0) {
    return null;
  }

  const memberCount = formatPublicMemberCount(
    memberCountRaw,
    settings.memberCountDisplay,
  );

  const subtitle =
    memberCount !== null
      ? await getPlatformText(
          "homepage.members.subtitle",
          `Bereits ${formatGermanNumber(memberCount)} registrierte Mitglieder sind dabei.`,
          { memberCount: formatGermanNumber(memberCount) },
        )
      : "";

  return (
    <section className="border-y border-aw-border bg-aw-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <PlatformText
            textKey="homepage.members.eyebrow"
            elementType="subheading"
            as="p"
            className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
            fallback="Unsere Community"
          />
          <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
            <PlatformText
              textKey="homepage.members.title"
              elementType="heading"
              as="span"
              fallback="Wurstfreunde auf Alles Wurst"
            />
          </h2>
          {subtitle.trim() && (
            <p className="mt-4 text-base leading-7 text-aw-muted">{subtitle}</p>
          )}
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col items-center rounded-xl border border-aw-border/70 bg-aw-surface/50 px-3 py-4 text-center"
            >
              <UserAvatar
                profile={member.profile}
                size="md"
                className="h-14 w-14 text-base"
              />
              <p className="mt-3 line-clamp-2 text-sm font-medium text-aw-cream">
                {member.displayName}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import UserAvatar from "@/components/member/UserAvatar";
import type { ForumAuthorEntry } from "@/lib/forums/forum-types";

type ForumAuthorProps = {
  author: ForumAuthorEntry;
  size?: "sm" | "md";
  /** inline = horizontal row; stack = classic forum author column */
  layout?: "inline" | "stack";
};

export default function ForumAuthor({
  author,
  size = "sm",
  layout = "inline",
}: ForumAuthorProps) {
  if (layout === "stack") {
    return (
      <div className="flex min-w-0 items-center gap-2 sm:flex-col sm:items-center sm:gap-1.5 sm:text-center">
        <UserAvatar
          size={size}
          profile={{
            publicName: author.displayName,
            firstName: author.displayName,
            avatarUrl: author.avatarUrl,
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-aw-cream sm:whitespace-normal sm:break-words">
            {author.displayName}
          </p>
          {author.roleBadge ? (
            <p className="mt-0.5 text-[11px] leading-tight text-aw-gold">
              {author.roleBadge}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <UserAvatar
        size={size}
        profile={{
          publicName: author.displayName,
          firstName: author.displayName,
          avatarUrl: author.avatarUrl,
        }}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-aw-cream">
          {author.displayName}
        </p>
        {author.roleBadge ? (
          <p className="text-xs text-aw-gold">{author.roleBadge}</p>
        ) : null}
      </div>
    </div>
  );
}

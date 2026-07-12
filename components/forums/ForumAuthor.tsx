import UserAvatar from "@/components/member/UserAvatar";
import type { ForumAuthorEntry } from "@/lib/forums/forum-types";

type ForumAuthorProps = {
  author: ForumAuthorEntry;
  size?: "sm" | "md";
};

export default function ForumAuthor({ author, size = "sm" }: ForumAuthorProps) {
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
        {author.roleBadge && (
          <p className="text-xs text-aw-gold">{author.roleBadge}</p>
        )}
      </div>
    </div>
  );
}

import { profile, latestBlog } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

export default function BlogEntry() {
  return (
    <div>
      <SectionHeader title={`${profile.name}'s Latest Blog Entry`} />
      <div className="bg-sunny-surface rounded-b-md px-4 py-3 border-x border-b border-sunny-surface-light">
        <p className="text-xs text-sunny-cream-muted mb-1">
          <span className="text-sunny-gold hover:underline cursor-pointer">
            [Subscribe to this Blog]
          </span>
        </p>
        <p className="text-sm text-sunny-cream mb-1">
          <span className="text-sunny-gold hover:underline cursor-pointer">
            {latestBlog.title}
          </span>
          {"  "}
          <span className="text-sunny-cream-muted text-xs">(view more)</span>
        </p>
        <p className="text-xs text-sunny-cream-muted mt-2">
          <span className="text-sunny-gold hover:underline cursor-pointer">
            [View All Blog Entries]
          </span>
        </p>
      </div>
    </div>
  );
}

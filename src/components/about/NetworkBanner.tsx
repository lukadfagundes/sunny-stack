import { profile } from "@/lib/data/personal";

export default function NetworkBanner() {
  return (
    <div
      className="bg-sunny-surface px-4 py-3 text-center"
      style={{ border: "1px solid #B8860B", borderRadius: 4 }}
    >
      <p className="text-sunny-gold font-bold text-sm">
        {profile.name} is in your extended network
      </p>
    </div>
  );
}

import { profile, aboutMe, whoIdLikeToMeet } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

export default function BioSections() {
  return (
    <div>
      <SectionHeader title={`${profile.name}'s Blurbs`} />
      <div className="bg-sunny-surface rounded-b-md px-4 py-4 border-x border-b border-sunny-surface-light space-y-4">
        {/* About me */}
        <div>
          <h4 className="text-sunny-gold font-bold text-sm mb-1">About me:</h4>
          {aboutMe.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-sunny-cream text-sm leading-relaxed"
              style={{
                marginBottom:
                  i < aboutMe.split("\n\n").length - 1 ? "0.75rem" : 0,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Who I'd like to meet */}
        <div>
          <h4 className="text-sunny-gold font-bold text-sm mb-1">
            Who I&apos;d like to meet:
          </h4>
          {whoIdLikeToMeet.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-sunny-cream text-sm leading-relaxed"
              style={{
                marginBottom:
                  i < whoIdLikeToMeet.split("\n\n").length - 1 ? "0.75rem" : 0,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

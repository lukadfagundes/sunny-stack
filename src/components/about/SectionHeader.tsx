interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <h3
      className="text-sunny-gold font-bold text-base px-3 py-2 bg-sunny-surface border-b border-sunny-gold-muted mb-0 rounded-t-md"
      style={{ fontFamily: "Verdana, sans-serif" }}
    >
      {title}
    </h3>
  );
}

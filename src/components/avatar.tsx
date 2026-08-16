function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

// A small set of deliberately muted tints (not saturated "avatar rainbow"
// colors) so a list of many people stays calm rather than confetti-like.
const TINTS = [
  "bg-accentSoft text-accentStrong",
  "bg-amberSoft text-amber",
  "bg-ink/[0.07] text-ink/70"
];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length]!;
}

export default function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-11 w-11 text-base" : "h-9 w-9 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${dims} ${tintFor(name)}`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

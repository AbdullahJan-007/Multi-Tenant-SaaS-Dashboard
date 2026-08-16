import { FolderKanban, ShieldCheck, UserPlus } from "lucide-react";

const FEATURES = [
  { Icon: ShieldCheck, label: "Role-based access, enforced server-side" },
  { Icon: UserPlus, label: "Invite a team in seconds" },
  { Icon: FolderKanban, label: "Every workspace fully isolated" }
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-accentStrong lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.9]"
          style={{ background: "radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.08), transparent 60%)" }}
        />

        <span className="relative font-display text-xl font-semibold tracking-tight text-white">
          Console
        </span>

        <div className="relative -mx-4 flex-1">
          <svg viewBox="0 0 480 520" className="h-full w-full" aria-hidden="true">
            <g stroke="white" strokeOpacity="0.22" strokeWidth="1.5">
              <line x1="140" y1="140" x2="90" y2="100" />
              <line x1="140" y1="140" x2="70" y2="165" />
              <line x1="140" y1="140" x2="115" y2="205" />
              <line x1="140" y1="140" x2="185" y2="190" />

              <line x1="345" y1="270" x2="300" y2="225" />
              <line x1="345" y1="270" x2="395" y2="235" />
              <line x1="345" y1="270" x2="300" y2="325" />
              <line x1="345" y1="270" x2="375" y2="340" />
              <line x1="345" y1="270" x2="400" y2="295" />

              <line x1="150" y1="425" x2="95" y2="400" />
              <line x1="150" y1="425" x2="80" y2="455" />
              <line x1="150" y1="425" x2="160" y2="475" />
              <line x1="150" y1="425" x2="210" y2="435" />
            </g>
            <line x1="185" y1="190" x2="300" y2="225" stroke="white" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="3 5" />

            <g fill="white">
              <circle cx="140" cy="140" r="7" fillOpacity="0.9" />
              <circle cx="345" cy="270" r="7" fillOpacity="0.9" />
              <circle cx="150" cy="425" r="7" fillOpacity="0.9" />

              <circle cx="90" cy="100" r="4" fillOpacity="0.55" />
              <circle cx="70" cy="165" r="4" fillOpacity="0.55" />
              <circle cx="115" cy="205" r="4" fillOpacity="0.55" />
              <circle cx="185" cy="190" r="4" fillOpacity="0.55" />

              <circle cx="300" cy="225" r="4" fillOpacity="0.55" />
              <circle cx="395" cy="235" r="4" fillOpacity="0.55" />
              <circle cx="300" cy="325" r="4" fillOpacity="0.55" />
              <circle cx="375" cy="340" r="4" fillOpacity="0.55" />
              <circle cx="400" cy="295" r="4" fillOpacity="0.55" />

              <circle cx="95" cy="400" r="4" fillOpacity="0.55" />
              <circle cx="80" cy="455" r="4" fillOpacity="0.55" />
              <circle cx="160" cy="475" r="4" fillOpacity="0.55" />
              <circle cx="210" cy="435" r="4" fillOpacity="0.55" />
            </g>
          </svg>
        </div>

        <div className="relative space-y-5">
          <p className="max-w-[26ch] font-display text-2xl font-medium leading-snug text-white">
            One account. Every workspace, kept apart.
          </p>
          <ul className="space-y-2.5">
            {FEATURES.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-white/70">
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center bg-canvas px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="font-display text-lg font-semibold tracking-tight">Console</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

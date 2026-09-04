import { type ReactElement } from "react";
import { Link } from "@/lib/nav";

// Fill these in with real profile URLs when available. Left blank rather
// than pointing at "#" — an icon with no real destination is rendered as
// non-interactive instead of a fake/dead link.
const SOCIAL_LINKS = {
  twitter: "",
  linkedin: "",
  instagram: "",
};

const SOCIAL_ICONS: Record<keyof typeof SOCIAL_LINKS, ReactElement> = {
  twitter: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.6-6.9L4.2 22H1l8.1-9.3L.9 2H8l5 6.3L18.9 2Zm-1.2 18h1.9L6.4 4H4.4l13.3 16Z" />
    </svg>
  ),
  linkedin: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.68H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  ),
  instagram: (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="size-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const FOOTER_COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Pricing", to: "/#pricing" },
      { label: "Discover Events", to: "/discover" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "About", to: "/#about" }],
  },
  {
    title: "Support",
    links: [{ label: "Contact us", to: "mailto:support@eventflow.app" }],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="size-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">EventFlow</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              The modern platform for hosting, discovering, and growing events across Africa and
              beyond.
            </p>
            <div className="flex gap-3 mt-6">
              {(Object.keys(SOCIAL_LINKS) as (keyof typeof SOCIAL_LINKS)[]).map((key) => {
                const url = SOCIAL_LINKS[key];
                const className =
                  "size-9 rounded-[8px] flex items-center justify-center transition-colors " +
                  (url
                    ? "bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white"
                    : "bg-white/5 text-white/20 cursor-not-allowed");
                if (!url) {
                  return (
                    <span
                      key={key}
                      aria-label={`${key} (coming soon)`}
                      title="Coming soon"
                      className={className}
                    >
                      {SOCIAL_ICONS[key]}
                    </span>
                  );
                }
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={key}
                    className={className}
                  >
                    {SOCIAL_ICONS[key]}
                  </a>
                );
              })}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white mb-4">{col.title}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) =>
                  l.to.startsWith("mailto:") ? (
                    <li key={l.label}>
                      <a href={l.to} className="text-sm hover:text-white transition-colors">
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link to={l.to} className="text-sm hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2026 EventFlow. All rights reserved.</p>
          <p className="text-xs text-white/40">
            Terms and privacy pages are coming soon — for now,{" "}
            <a
              href="mailto:support@eventflow.app"
              className="hover:text-white transition-colors underline"
            >
              contact us
            </a>{" "}
            with any questions.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">EventFlow</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              The modern platform for hosting, discovering, and growing events across Africa and beyond.
            </p>
            <div className="flex gap-3 mt-6">
              {["Twitter", "LinkedIn", "Instagram"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="size-9 rounded-[8px] bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-xs font-medium"
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Integrations", "Changelog"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Press"],
            },
            {
              title: "Resources",
              links: ["Documentation", "Help Centre", "Status", "Privacy"],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white mb-4">{col.title}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2025 EventFlow Technologies Ltd. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

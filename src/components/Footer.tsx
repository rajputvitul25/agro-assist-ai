import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";

const links = [
  { label: "Crop Recommendation", to: "/crop-recommendation" },
  { label: "Crop Monitoring", to: "/crop-monitoring" },
  { label: "Government Updates", to: "/government-updates" },
  { label: "Sowing Calendar", to: "/sowing-calendar" },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(22,48,22,1)_0%,rgba(34,67,31,1)_55%,rgba(49,91,39,1)_100%)] py-14 text-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(173,199,86,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />

      <div className="relative container mx-auto px-4">
        <div className="grid gap-10 rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Sprout className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold">Smart Farmer&apos;s Assistant</span>
            </div>
            <p className="max-w-xl text-background/75">
              A cleaner farming workspace for crop advice, crop health scans, sowing support, updates, and chatbot help.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-background/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-background/55">
          <p>&copy; 2025 Smart Farmer&apos;s Assistant.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Settings as AppSettings } from "@/entities/Settings"; // Added AppSettings import
import {
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Settings,
  Pill,
  Brain,
  FileText,
  Paintbrush,
  Home,
  Shield,
  ListTodo,
  Folder } from
"lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AnalogClock from "./components/shared/AnalogClock";

const navigationItems = [
{ title: "Home", url: createPageUrl("Home"), icon: Home },
{ title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
{ title: "Tasklist", url: createPageUrl("Tasklist"), icon: ListTodo },
{ title: "Ideas", url: createPageUrl("Ideas"), icon: Lightbulb },
{ title: "Commissions", url: createPageUrl("Commissions"), icon: Paintbrush },
{ title: "Brand Library", url: createPageUrl("Brand"), icon: FolderKanban },
{ title: "Veri", url: createPageUrl("Veri"), icon: Folder },
{ title: "Brain Dump", url: createPageUrl("BrainDump"), icon: Brain },
{ title: "Logs", url: createPageUrl("Logs"), icon: FileText },
{ title: "Medications", url: createPageUrl("Meds"), icon: Pill }];


const adminNav = { title: "Admin", url: createPageUrl("Admin"), icon: Shield };
const settingsNav = { title: "Settings", url: createPageUrl("Settings"), icon: Settings };

function Sidebar({ user }) {
  const location = useLocation();
  const isActive = (url) => location.pathname === url;

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/95 border-r border-slate-800/60 flex flex-col p-4 backdrop-blur-sm">
      <div className="mb-8 relative">
        <AnalogClock />
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const itemUrl = item.url;
          // The specific 'if (item.title === "Team")' logic is now removed as Team is no longer in navigationItems.

          return (
            <Link
              key={item.title}
              to={itemUrl}
              className="bg-[#0a0910] text-left mr-1 ml-1 pt-2 pr-3 pb-2 pl-10 text-sm font-stretch-expanded font-light capitalize flex items-center gap-3 rounded-br-full transition-all duration-300 from-[var(--color-magenta)] to-[var(--color-white)]"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>);

        })}
      </nav>

      {/* Decorative lantern positioned between nav and admin/settings */}
      <div className="flex items-center justify-center py-4">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68af5504d790ab585e7d473d/a88256b70_LanternBaseback.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none w-20 md:w-24 opacity-90 drop-shadow-[0_0_14px_rgba(59,130,246,0.35)]" />

      </div>

      <div className="mt-auto">
        {user?.role === 'admin' &&
        <Link
          to={adminNav.url}
          className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 mb-2 ${
          isActive(adminNav.url) ?
          "bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-magenta)] text-white" :
          "text-red-400 hover:bg-red-800/50 hover:text-red-200"}`
          }>

            <adminNav.icon className="w-5 h-5" />
            <span>{adminNav.title}</span>
          </Link>
        }
        <Link
          to={settingsNav.url}
          className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors mb-4 ${
          isActive(settingsNav.url) ?
          "bg-slate-700/50 text-slate-50" :
          "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`
          }>

          <settingsNav.icon className="w-5 h-5" />
          <span>{settingsNav.title}</span>
        </Link>
        
        {user &&
        <div className="flex items-center gap-3 p-2 border-t border-slate-800/60">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {(user.displayName || user.full_name || user.username || (user.email ? user.email.split('@')[0] : 'U')).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-slate-200">
                {user.displayName || user.full_name || user.username || (user.email ? user.email.split('@')[0] : 'User')}
              </p>
              {/* Removed raw email display */}
            </div>
          </div>
        }
      </div>
    </aside>);

}

export default function Layout({ children }) {
  const [user, setUser] = React.useState(null);
  const [isDeactivated, setIsDeactivated] = React.useState(false);
  const [domainBlocked, setDomainBlocked] = React.useState({ blocked: false, reason: '' }); // New state for domain restriction

  React.useEffect(() => {
    (async () => {// Changed to an async IIFE
      try {
        const userData = await User.me();
        // Optional domain restriction
        const settings = await AppSettings.list();
        const cfg = settings && settings.length ? settings[0] : null;

        if (userData?.active === false) {
          setIsDeactivated(true);
          setTimeout(() => {
            User.logout();
          }, 5000);
          return;
        }

        // Apply email domain restriction if configured
        if (cfg?.require_email_domain && Array.isArray(cfg.allowed_email_domains) && cfg.allowed_email_domains.length > 0) {
          const domain = (userData?.email || '').split('@')[1]?.toLowerCase();
          const allowed = cfg.allowed_email_domains.map((d) => String(d).toLowerCase().trim());
          if (!domain || !allowed.includes(domain)) {
            setDomainBlocked({
              blocked: true,
              reason: `Access restricted to: ${allowed.join(', ')}`
            });
            setTimeout(() => {
              User.logout();
            }, 5000);
            return; // Stop further processing and prevent setting user
          }
        }

        setUser(userData); // Set user only if all checks pass
      } catch {
        setUser(null);
      }
    })();
  }, []);

  return (
    <>
      <style>{`
        :root {
          --color-navy: #0a0f1f;
          --color-burgundy: #7a0e32;
          --color-gold: #f59e0b;
          --color-magenta: #be185d;
          --color-desat-blue: #3b82f6;

          /* Radii updated per request */
          --button-radius: 16px;
          --panel-radius: 24px;

          /* Palette */
          --pal-1: #c7a89c;
          --pal-2: #753243;
          --pal-3: #612529;
          --pal-4: #3c5693;
          --pal-5: #4c6f91;
          --pal-6: #476e8c;
          --pal-7: #553052;
          --pal-8: #3a4b5b;
          --pal-9: #755665;
          --pal-10: #6b2035;
          --pal-11: #c0abb2;
          --pal-12: #47698d;
        }
        .dark {
          --background: 225 36% 6%;
          --foreground: 210 40% 98%;
          --card: 220 20% 8% / 0.85;
          --card-foreground: 210 40% 98%;
          --popover: 224 71% 4% / 0.8;
          --popover-foreground: 215 20% 65%;
          --primary: 210 40% 98%;
          --primary-foreground: 222 47% 11%;
          --secondary: 220 20% 10% / 0.7;
          --secondary-foreground: 210 40% 98%;
          --muted: 215 28% 17% / 0.5;
          --muted-foreground: 215 20% 65%;
          --accent: 220 25% 10% / 0.6;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 63% 31% / 0.5;
          --destructive-foreground: 210 40% 98%;
          --border: 217 19% 24% / 0.35;
          --input: 215 28% 17% / 0.5;
          --ring: 38 92% 50%;
          --radius: 1rem;
        }

        .glass-card {
          background: radial-gradient(120% 120% at 10% 10%, rgba(10,16,31,0.85) 0%, rgba(10,16,31,0.65) 60%, rgba(10,16,31,0.55) 100%);
          backdrop-filter: blur(14px);
          border-radius: var(--panel-radius);
          border: 1px solid rgba(245, 158, 11, 0.16);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.03),
            0 10px 30px rgba(0,0,0,0.35),
            0 0 24px rgba(245,158,11,0.06);
        }

        .gold-frame {
          border: 1px solid rgba(245, 158, 11, 0.18) !important;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.02),
            0 8px 24px rgba(0,0,0,0.35),
            0 0 20px rgba(245,158,11,0.08);
          background: linear-gradient(180deg, rgba(14,18,30,0.92), rgba(10,16,31,0.78));
          border-radius: var(--panel-radius);
        }
        .gold-frame:hover {
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.03),
            0 12px 30px rgba(0,0,0,0.45),
            0 0 28px rgba(245,158,11,0.18);
          transition: box-shadow 220ms ease;
        }

        .glass-button {
          background: linear-gradient(135deg, #7a0e32 0%, #f59e0b 100%);
          color: white;
          border-radius: var(--button-radius);
          border: 1px solid rgba(245,158,11,0.25);
          box-shadow: 0 6px 16px rgba(0,0,0,0.35), 0 0 18px rgba(245,158,11,0.18);
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .glass-button:hover { transform: translateY(-1px); }
        .glass-button:active { transform: translateY(0); }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0f1f; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(#7a0e32, #f59e0b);
          border-radius: 6px; border: 2px solid #0a0f1f;
        }

        .bg-main-gradient {
          background-image: radial-gradient(120% 140% at 0% 0%, var(--color-navy) 0%, #0b1226 40%, var(--color-burgundy) 100%);
        }

        .gold-spheres::before, .gold-spheres::after {
          content: "";
          position: fixed;
          pointer-events: none;
          inset: 0;
          background:
            radial-gradient(180px 180px at 10% 8%, rgba(245,158,11,0.18), transparent 60%),
            radial-gradient(140px 140px at 85% 18%, rgba(190,24,93,0.12), transparent 60%),
            radial-gradient(220px 220px at 80% 80%, rgba(245,158,11,0.10), transparent 60%);
          z-index: -9;
        }

        input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        textarea,
        select,
        button[role="combobox"],
        .form-field {
          background: rgba(31, 41, 55, 0.85);
          color: #f8fafc;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--button-radius);
        }
        input::placeholder,
        textarea::placeholder { color: rgba(226,232,240,0.6); }
        input:focus,
        textarea:focus,
        select:focus,
        button[role="combobox"]:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(76,111,145,0.35);
          border-color: rgba(76,111,145,0.45);
        }

        /* Popup surfaces: dark glass with 75% opacity and burgundy→navy gradients */
        .popup-surface,
        .form-container,
        div[role="dialog"] {
          background:
            linear-gradient(180deg, rgba(10,15,31,0.75), rgba(10,15,31,0.72)),
            radial-gradient(120% 120% at 0% 0%, rgba(122,14,50,0.18), transparent 60%),
            radial-gradient(120% 120% at 100% 0%, rgba(10,15,31,0.25), transparent 60%);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(76,105,141,0.45);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.02),
            0 12px 36px rgba(0,0,0,0.45),
            0 0 28px rgba(117,86,101,0.22);
          border-radius: var(--panel-radius) !important;
        }
        .popup-surface .shadcn-dialog-title,
        .popup-surface h3,
        .popup-surface h4 { color: #e5e7eb; }

        /* Menus & listboxes, popovers - glassy 70-75% */
        .menu-surface,
        div[role="listbox"],
        div[role="menu"],
        .popover-content {
          background:
            linear-gradient(180deg, rgba(10,15,31,0.72), rgba(10,15,31,0.70)),
            radial-gradient(120% 120% at 0% 0%, rgba(122,14,50,0.16), transparent 60%);
          border: 1px solid rgba(76,105,141,0.5);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: #e5e7eb;
          border-radius: var(--panel-radius);
          box-shadow:
            0 12px 32px rgba(0,0,0,0.45),
            0 0 18px rgba(97,37,41,0.18);
        }

        /* Dialog overlay: 75% gray-900 with subtle blur */
        /* Fallback targeting common overlay classes */
        .fixed.inset-0[data-state="open"] { backdrop-filter: blur(6px); }
        [class*="fixed"][class*="inset-0"][class*="bg-background"] {
          background-color: rgba(17,24,39,0.75) !important; /* gray-900 @ 75% */
          backdrop-filter: blur(6px);
        }

        /* Labels in dialogs and cards: white, bold, lowercase */
        div[role="dialog"] label,
        .popup-surface label,
        .form-container label,
        .glass-card label,
        .gold-frame label,
        [class*="bg-slate-9"] label,
        [class*="bg-slate-8"] label {
          color: #ffffff !important;         /* white */
          font-weight: 700 !important;       /* bold */
          text-transform: lowercase !important;
        }

        /* Inputs in dialogs/cards: slate-500 bg, slate-50 text (defensive re-assert) */
        div[role="dialog"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        div[role="dialog"] textarea,
        div[role="dialog"] select,
        div[role="dialog"] button[role="combobox"],
        .popup-surface input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        .popup-surface textarea,
        .popup-surface select,
        .popup-surface button[role="combobox"],
        .form-container input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        .form-container textarea,
        .form-container select,
        .form-container button[role="combobox"],
        .glass-card input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        .glass-card textarea,
        .glass-card select,
        .glass-card button[role="combobox"],
        .gold-frame input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        .gold-frame textarea,
        .gold-frame select,
        .gold-frame button[role="combobox"],
        [class*="bg-slate-9"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        [class*="bg-slate-9"] textarea,
        [class*="bg-slate-9"] select,
        [class*="bg-slate-9"] button[role="combobox"],
        [class*="bg-slate-8"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        [class*="bg-slate-8"] textarea,
        [class*="bg-slate-8"] select,
        [class*="bg-slate-8"] button[role="combobox"] {
          background-color: #64748b !important; /* slate-500 */
          color: #f8fafc !important;            /* slate-50 */
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: var(--button-radius);
        }

        /* Placeholders remain readable in dark glass */
        div[role="dialog"] input::placeholder,
        div[role="dialog"] textarea::placeholder,
        .popup-surface input::placeholder,
        .popup-surface textarea::placeholder,
        .form-container input::placeholder,
        .form-container textarea::placeholder,
        .glass-card input::placeholder,
        .glass-card textarea::placeholder,
        .gold-frame input::placeholder,
        .gold-frame textarea::placeholder,
        [class*="bg-slate-9"] input::placeholder,
        [class*="bg-slate-9"] textarea::placeholder,
        [class*="bg-slate-8"] input::placeholder,
        [class*="bg-slate-8"] textarea::placeholder {
          color: rgba(248,250,252,0.85); /* slate-50 ~85% */
        }
      `}</style>

      <div
        className="dark flex h-screen text-slate-100 relative gold-spheres"
        style={{
          // Apply user-picked accents, fallback to defaults
          '--color-burgundy': user?.accent_primary || '#7a0e32',
          '--color-gold': user?.accent_secondary || '#f59e0b'
        }}>

        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: 'url(https://b.l3n.co/i/NoTZ1q.png)', zIndex: -10 }} />

        <Sidebar user={user} />
        <main className="bg-slate-950 text-slate-300 flex-1 overflow-y-auto">
          {isDeactivated ?
          <div className="p-8">
              <Alert variant="destructive" className="glass-card">
                <Shield className="h-4 w-4" />
                <AlertTitle>Account Deactivated</AlertTitle>
                <AlertDescription>
                  Your account has been deactivated by an administrator. You will be logged out shortly.
                </AlertDescription>
              </Alert>
            </div> :
          domainBlocked.blocked ? // Added new condition for domain blocked
          <div className="p-8">
              <Alert variant="destructive" className="glass-card">
                <Shield className="h-4 w-4" />
                <AlertTitle>Access Restricted</AlertTitle>
                <AlertDescription>
                  {domainBlocked.reason}. You will be logged out shortly.
                </AlertDescription>
              </Alert>
            </div> :

          <div className="bg-slate-950 p-4 md:p-8">
              {children}
            </div>
          }
        </main>
      </div>
    </>);

}

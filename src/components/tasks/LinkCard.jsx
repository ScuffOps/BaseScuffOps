import { ExternalLink, Link as LinkIcon } from "lucide-react";

function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function LinkCard({ link, size = "md" }) {
  const { url, title, thumbnail } = link || {};
  const domain = getDomain(url || "");
  const isSm = size === "sm";

  const handleOpen = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleOpen}
      className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left w-full ${isSm ? "h-20" : "h-28"}`}
      title={url}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title || domain || "Link preview"}
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/60 to-slate-900/60">
          <LinkIcon className="w-6 h-6 text-slate-300" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className={`text-xs text-slate-200 truncate ${isSm ? "" : "font-medium"}`}>
          {title || domain || "Open link"}
        </div>
        {domain && (
          <div className="flex items-center gap-1 text-[11px] text-slate-300/90">
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
              alt=""
              className="w-3.5 h-3.5"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span className="truncate">{domain}</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </div>
        )}
      </div>
    </button>
  );
}

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { InvokeLLM, UploadFile } from "@/integrations/Core"; // NEW: allow uploading exported PDF/TXT
import { HandbookSection } from "@/entities/HandbookSection";
import { Textarea } from "@/components/ui/textarea";

export default function HandbookImportDialog({ open, onOpenChange, onImported }) {
  const [url, setUrl] = React.useState("");
  const [docText, setDocText] = React.useState(""); // pasted content
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState(""); // NEW: uploaded file url
  const [uploadName, setUploadName] = React.useState(""); // NEW: UI label
  const [isUploading, setIsUploading] = React.useState(false); // NEW
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const schema = {
    type: "object",
    properties: {
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            section_type: { type: "string" }, // philosophy | rule | workflow | command | tool
            content_html: { type: "string" },
            display_order: { type: "number" },
            metadata: {
              type: "object",
              additionalProperties: true
            }
          },
          required: ["title", "section_type", "content_html", "display_order"]
        }
      }
    },
    required: ["sections"]
  };

  async function handleImport() {
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (!url && !docText.trim() && !uploadedFileUrl) {
        throw new Error("Paste content, provide a public Google Doc URL, or upload a PDF/text export.");
      }

      const basePrompt = `
You will be given a moderator handbook. Extract clear sections with:
- section_type: one of [philosophy, rule, workflow, command, tool]
- title: concise
- content_html: clean HTML (no script, inline styles minimal)
- display_order: increasing order
Return JSON matching the provided schema EXACTLY under "sections".
`;

      let res;
      if (docText.trim()) {
        // Priority 1: pasted content
        res = await InvokeLLM({
          prompt: basePrompt + "\nCONTENT:\n" + docText,
          add_context_from_internet: false,
          response_json_schema: schema
        });
      } else if (uploadedFileUrl) {
        // Priority 2: uploaded file (e.g., PDF export)
        res = await InvokeLLM({
          prompt: basePrompt + "\nUse the attached file as your sole context.",
          add_context_from_internet: false,
          response_json_schema: schema,
          file_urls: [uploadedFileUrl]
        });
      } else {
        // Priority 3: URL with web context
        const urlPrompt = `${basePrompt}
Use this public Google Doc URL as context:
${url}

Make sure the doc is publicly accessible.`;
        res = await InvokeLLM({
          prompt: urlPrompt,
          add_context_from_internet: true,
          response_json_schema: schema
        });
      }

      // Robust extraction of sections
      let sections = Array.isArray(res?.sections) ? res.sections : [];
      if (!sections.length && typeof res === "string") {
        try {
          const parsed = JSON.parse(res);
          if (Array.isArray(parsed.sections)) sections = parsed.sections;
        } catch {}
      }
      if (!sections.length && res?.output && Array.isArray(res.output.sections)) {
        sections = res.output.sections;
      }
      if (!sections.length) {
        throw new Error("No sections detected. Ensure the Doc is public or upload a PDF export.");
      }

      let created = 0;
      for (const s of sections) {
        const allowed = ["philosophy", "rule", "workflow", "command", "tool"];
        const safeType = allowed.includes(s.section_type) ? s.section_type : "rule";
        await HandbookSection.create({
          title: s.title?.slice(0, 140) || "Untitled",
          content: s.content_html || "",
          section_type: safeType,
          display_order: Number.isFinite(s.display_order) ? s.display_order : (created + 1) * 10,
          metadata: s.metadata || {}
        });
        created += 1;
      }

      setSuccessMsg(`Imported ${created} sections into the Mod Handbook.`);
      onImported?.();
    } catch (e) {
      setError(e?.message || "Import failed. Make sure the Doc is public or upload a PDF export.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError("");
    try {
      const { file_url } = await UploadFile({ file });
      setUploadedFileUrl(file_url);
      setUploadName(file.name);
    } catch (err) {
      setError(err?.message || "Upload failed. Try a smaller file or a PDF export.");
      setUploadedFileUrl("");
      setUploadName("");
    } finally {
      setIsUploading(false);
    }
  }

  function onClose(v) {
    if (!v) {
      setError("");
      setSuccessMsg("");
      setUrl("");
      setDocText("");
      setUploadedFileUrl("");
      setUploadName("");
    }
    onOpenChange?.(v);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl form-container">
        <DialogHeader>
          <DialogTitle>Import Mod Handbook</DialogTitle>
          <DialogDescription>Paste content, upload a PDF/text export, or use a public Google Doc URL.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium">Google Doc URL (optional)</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/document/d/..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Or paste the document content</label>
              <Textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste the doc's text here..."
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Or upload PDF/TXT/HTML</label>
              <Input type="file" accept=".pdf,.txt,.md,.html,.htm" onChange={handleFileSelect} />
              {uploadName && (
                <p className="text-xs text-slate-400">
                  {isUploading ? "Uploading…" : `Selected: ${uploadName}`}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Tip: For the URL method, set the Doc to “Anyone with the link can view”. If it still fails, export to PDF and upload here.
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading || (isUploading)}>
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { Download, Send } from "lucide-react";
import { AETHER_LICENSE } from "@/lib/engine/license";
import { packEngine, renderEngineHtml, slugName } from "@/lib/engine/export-xdc";
import { activeEngine, projectSignature, useStudio } from "@/lib/engine/store";
import { blobToBase64, inVector } from "@/lib/engine/webxdc";
import { Btn, StageHead } from "./ui";

export function VectorDesk() {
  const project = useStudio((s) => s.project);
  const engine = activeEngine(project);
  const setStatus = useStudio((s) => s.setStatus);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const filename = `${slugName(engine.name)}.xdc`;
  const [inside, setInside] = useState(false);
  const [who, setWho] = useState("");
  useEffect(() => {
    setInside(inVector());
    setWho(window.webxdc?.selfName ?? "");
  }, []);

  async function packed() {
    setBusy(true);
    try {
      return await packEngine(project, engine);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <StageHead
        kicker="Vector"
        title="Hand the engine over"
        lede="The file is a webxdc. Drop it in a Vector chat and the yard opens there: run it, place a body, share a beat. The foundry stays here. The toy travels."
      />
      <p className="mb-4 text-sm">
        <span className={`mr-2 inline-block size-2 rounded-full ${inside ? "bg-moss" : "bg-mute"}`} />
        {inside ? `Inside Vector${who ? ` as ${who}` : ""}.` : "In a browser. Download the file, then send it into a Vector chat."}
      </p>
      <pre className="mb-4 overflow-x-auto rounded-md border border-line bg-ink p-3 text-sm text-mute">
        {`name = "${engine.name.replace(/"/g, "'")}"\nsource_code_url = "https://github.com/AETHER-ENGINEERS/aether-foundry"`}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Btn
          tone="brass"
          disabled={busy}
          onClick={() => {
            void packed().then((file) => {
              const url = URL.createObjectURL(file.blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = file.filename;
              link.click();
              URL.revokeObjectURL(url);
              setStatus(`Packed ${file.filename}.`);
            });
          }}
        >
          <Download className="size-4" />
          Download {filename}
        </Btn>
        <Btn
          disabled={busy}
          onClick={() => {
            const api = window.webxdc;
            if (!api) {
              setStatus("Send to chat is for when this foundry is opened inside Vector. Download the file instead.");
              return;
            }
            void packed().then(async (file) => {
              const base64 = await blobToBase64(file.blob);
              await api.sendToChat({
                file: { name: file.filename, base64 },
                text: `${engine.name} — ${engine.pitch}`,
              });
              setStatus("Vector is ready to send the engine.");
            });
          }}
        >
          <Send className="size-4" />
          Send to this chat
        </Btn>
        <Btn
          onClick={() => {
            const api = window.webxdc;
            if (!api) {
              setStatus("Sharing laws waits until the foundry itself is running inside Vector.");
              return;
            }
            const slim = {
              ...project,
              assets: project.assets.map((asset) => ({ ...asset, dataUrl: "" })),
            };
            const payload = { type: "studio", project: slim };
            if (JSON.stringify(payload).length > 60000) {
              setStatus("This studio is too heavy to send. Remove sprites and try again.");
              return;
            }
            if (projectSignature(slim) === projectSignature(project)) {
              api.sendUpdate(
                { payload, info: "Studio laws", summary: `${project.title} · ${engine.name}` },
                "Share studio laws",
              );
              setStatus("Laws sent to this chat. Sprites stay on each device.");
            }
          }}
        >
          Send laws to this chat
        </Btn>
        <Btn onClick={() => setPreview(renderEngineHtml(project, engine))}>Preview the packed yard</Btn>
      </div>
      {preview ? (
        <iframe title="Packed engine preview" className="preview-frame mt-4 rounded-md border border-line" srcDoc={preview} />
      ) : null}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-brass">License carried in every packed engine</summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-mute">{AETHER_LICENSE}</pre>
      </details>
    </div>
  );
}

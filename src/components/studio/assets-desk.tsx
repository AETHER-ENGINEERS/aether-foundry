import { ImagePlus, Trash2 } from "lucide-react";
import { uid, useStudio } from "@/lib/engine/store";
import { downscaleImage, pickImages } from "@/lib/engine/webxdc";
import { Btn, StageHead } from "./ui";

export function AssetsDesk() {
  const assets = useStudio((s) => s.project.assets);
  const things = useStudio((s) => s.project.things);
  const selection = useStudio((s) => s.selection);
  const addAsset = useStudio((s) => s.addAsset);
  const deleteAsset = useStudio((s) => s.deleteAsset);
  const updateThing = useStudio((s) => s.updateThing);
  const setStatus = useStudio((s) => s.setStatus);
  const setSelection = useStudio((s) => s.setSelection);
  const thing = selection?.kind === "thing" ? things.find((item) => item.id === selection.id) : undefined;

  async function importAssets() {
    try {
      const files = await pickImages();
      if (!files.length) return;
      for (const file of files) {
        const dataUrl = await downscaleImage(file);
        addAsset({
          id: uid("asset"),
          name: file.name.replace(/\.[^.]+$/, "") || "Sprite",
          kind: "sprite",
          dataUrl,
        });
      }
      setStatus(files.length === 1 ? "Sprite imported." : `${files.length} sprites imported.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import that file.");
    }
  }

  return (
    <div>
      <StageHead
        kicker="Assets"
        title="Bring your own marks"
        lede="Import a picture and it becomes a body’s face in the yard. Inside Vector this opens the chat’s files. In a browser it opens yours. Sprites are kept on this device with the studio."
      />
      <Btn tone="brass" onClick={() => void importAssets()}>
        <ImagePlus className="size-4" />
        Import images
      </Btn>
      {assets.length === 0 ? (
        <p className="mt-4 text-mute">No sprites yet. The cast still has geometric marks, which is enough to read a yard.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.map((asset) => {
            const used = things.filter((item) => item.assetId === asset.id).map((item) => item.name);
            return (
              <li key={asset.id} className="rounded-md border border-line bg-panel p-3">
                <button type="button" className="block" onClick={() => setSelection({ kind: "asset", id: asset.id })}>
                  <img src={asset.dataUrl} alt={asset.name} className="mx-auto size-16" />
                </button>
                <p className="mt-2 text-sm">{asset.name}</p>
                <p className="text-sm text-mute">{used.length ? used.join(", ") : "Unused"}</p>
                <div className="mt-2 flex flex-col gap-2">
                  <Btn
                    disabled={!thing}
                    onClick={() => thing && updateThing(thing.id, { assetId: asset.id })}
                  >
                    {thing ? `Use on ${thing.name}` : "Select a thing first"}
                  </Btn>
                  <Btn onClick={() => deleteAsset(asset.id)}>
                    <Trash2 className="size-4" />
                    Remove
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

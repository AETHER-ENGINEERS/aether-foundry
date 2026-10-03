export type WebxdcUpdate = {
  payload: unknown;
  serial: number;
  max_serial: number;
  info?: string;
  summary?: string;
};

export type WebxdcApi = {
  sendUpdate: (
    update: { payload: unknown; info?: string; summary?: string; document?: string },
    description: string,
  ) => void;
  setUpdateListener: (cb: (update: WebxdcUpdate) => void, serial?: number) => void;
  sendToChat: (message: {
    file?: { name: string; base64?: string; blob?: Blob };
    text?: string;
  }) => Promise<unknown>;
  importFiles: (filter: {
    extensions?: string[];
    mimeTypes?: string[];
    multiple?: boolean;
  }) => Promise<File[]>;
  selfName?: string;
  selfAddr?: string;
};

declare global {
  interface Window {
    webxdc?: WebxdcApi;
  }
}

export function inVector(): boolean {
  return typeof window !== "undefined" && typeof window.webxdc !== "undefined";
}

export async function pickImages(): Promise<File[]> {
  const webxdc = window.webxdc;
  if (webxdc?.importFiles) {
    try {
      return await webxdc.importFiles({
        extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
        mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
        multiple: true,
      });
    } catch {
      return [];
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = true;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
}

export function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that image."));
        return;
      }
      ctx.clearRect(0, 0, size, size);
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

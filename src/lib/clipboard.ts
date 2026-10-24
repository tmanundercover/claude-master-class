export interface ClipboardWriter {
  writeText(value: string): Promise<void>;
}

export class ClipboardCopyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClipboardCopyError";
  }
}

export async function copyText(value: string, clipboard: ClipboardWriter | undefined): Promise<void> {
  if (!clipboard) {
    throw new ClipboardCopyError("Clipboard access is unavailable in this browser. Select and copy the draft manually.");
  }
  try {
    await clipboard.writeText(value);
  } catch {
    throw new ClipboardCopyError("The browser could not copy the draft. Check clipboard permission, then try again or copy it manually.");
  }
}

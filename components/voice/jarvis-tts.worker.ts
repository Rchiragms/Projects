/**
 * Piper runs in a dedicated Web Worker so synthesis does not block
 * the main dashboard / hologram animation thread.
 */

import { toSpokenText } from "@/lib/voice/spokenText";

type GenerateRequest = {
  id: number;
  text: string;
  warm?: boolean;
};

const scope = self as unknown as {
  postMessage: (value: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent<GenerateRequest>) => void) | null;
};

const VOICE_ID = "en_GB-northern_english_male-medium" as const;
let sequence: Promise<void> = Promise.resolve();

scope.onmessage = (event) => {
  const { id, text, warm } = event.data;
  if (typeof text !== "string" || typeof id !== "number") return;

  // Piper session is reused and processing is serialized to avoid
  // concurrent inference against the same ONNX session.
  sequence = sequence
    .then(async () => {
      const tts = await import("@mintplex-labs/piper-tts-web");
      const wav = await tts.predict({ voiceId: VOICE_ID, text: toSpokenText(text.slice(0, 420)) });
      if (warm) {
        scope.postMessage({ id, warm: true });
        return;
      }
      const buffer = await wav.arrayBuffer();
      scope.postMessage({ id, buffer }, [buffer]);
    })
    .catch((reason: unknown) => {
      scope.postMessage({
        id,
        error: reason instanceof Error ? reason.message : String(reason),
      });
    });
};

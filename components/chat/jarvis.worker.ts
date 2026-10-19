import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// This AI worker performs general conversations off the UI thread.
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (event: MessageEvent) => handler.onmessage(event);

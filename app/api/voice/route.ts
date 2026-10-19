import OpenAI from "openai";

export const runtime = "nodejs";

const voiceLines = {
  welcome:
    "Good evening. Welcome to the CNMS interface. " +
    "All systems are operational. How may I assist you?",

  enter:
    "Access granted. Welcome to Chirag's command centre. " +
    "All portfolio modules are ready for exploration.",

  skills:
    "Accessing technical capabilities. " +
    "Artificial intelligence, data science, and engineering systems are available.",

  battle:
    "Warning. An unauthorised intelligence has breached our defences. " +
    "I recommend activating the security protocol.",

  evolution:
    "Evolution protocol initiated. " +
    "Neural architecture restructuring. " +
    "Advanced cognitive interface coming online.",
} as const;

type VoiceLine = keyof typeof voiceLines;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key is missing." },
        { status: 503 }
      );
    }

    const body = await request.json();

    const cue = body?.cue;

    if (
      typeof cue !== "string" ||
      !Object.prototype.hasOwnProperty.call(voiceLines, cue)
    ) {
      return Response.json(
        { error: "Invalid voice command." },
        { status: 400 }
      );
    }

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",

      voice: "cedar",

      input: voiceLines[cue as VoiceLine],

      instructions:
        "Speak as an original, sophisticated futuristic AI assistant. " +
        "Use a calm, articulate, subtly British-inspired masculine voice. " +
        "Speak naturally, with measured pacing and quiet confidence. " +
        "Sound intelligent, composed, and slightly cinematic. " +
        "Do not imitate a specific actor.",

      response_format: "mp3",

      speed: 0.95,
    });

    const audio = await speech.arrayBuffer();

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
      },
    });
} catch (error) {
  console.error("JARVIS voice error:", error);

  if (error instanceof OpenAI.APIError) {
    return Response.json(
      {
        error: `OpenAI API error: ${error.status ?? "unknown"}`,
        code: error.code ?? "unknown",
      },
      {
        status: error.status ?? 500,
      }
    );
  }

  return Response.json(
    {
      error: "Voice generation failed. Check the server terminal.",
    },
    { status: 500 }
  );
}
}
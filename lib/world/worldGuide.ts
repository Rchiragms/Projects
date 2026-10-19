/** Canonical navigational data shared by 3D world and JARVIS chat. */
export const WORLD_SECTORS = ["about", "skills", "projects", "research", "mission", "contact"] as const;
export type WorldSector = (typeof WORLD_SECTORS)[number];
export const WORLD_STORAGE_KEY = "jarvis-world-visited-v1";

export const SECTORS: ReadonlyArray<{id: WorldSector; name: string; summary: string; accent: string; angle: number}> = [
  {id: "about", name: "IDENTITY ARCHIVE", summary: "Journey from Mysore, Karnataka to MSc studies at GCU in Glasgow.", accent: "#68d9ff", angle: 0},
  {id: "skills", name: "TECHNOLOGY LAB", summary: "Python, AI, data science, machine learning, IoT and digital twins.", accent: "#72e7cb", angle: Math.PI/3},
  {id: "projects", name: "PROJECT VAULT", summary: "Engineering and data science projects, demonstrations and source links.", accent: "#9baeff", angle: 2*Math.PI/3},
  {id: "research", name: "RESEARCH NEXUS", summary: "System health monitoring, neuroscience-inspired AI and research directions.", accent: "#c3a4ff", angle: Math.PI},
  {id: "mission", name: "ULTRON RESTRICTED SECTOR", summary: "Technical puzzles, ULTRON dialogue and the AEGIS mission.", accent: "#ff5266", angle: 4*Math.PI/3},
  {id: "contact", name: "CONTACT HUB", summary: "Contact information, collaboration and professional links.", accent: "#ffd18c", angle: 5*Math.PI/3},
];

export function visitedWorldSectors(): WorldSector[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(WORLD_STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? WORLD_SECTORS.filter(id => raw.includes(id)) : [];
  } catch { return []; }
}

export function markWorldVisited(id: WorldSector): WorldSector[] {
  const next = WORLD_SECTORS.filter(v => v === id || visitedWorldSectors().includes(v));
  if (typeof window !== "undefined") {
    try { localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("jarvis:world-progress", { detail: { visited: next } }));
  }
  return next;
}

export function worldGuideContext(): string {
  const visited = visitedWorldSectors();
  const remaining = SECTORS.filter(s => !visited.includes(s.id));
  return [
    "JARVIS WORLD NAVIGATION (actual current geometry): A circular reactor atrium with six physically walkable passageways ending in sector rooms.",
    "Controls: WASD move, mouse drag or click-to-capture to look, Shift sprint, E interact, M map and fast travel, J chat, H/F1 help, Escape releases mouse / shows menu.",
    "The map can fast travel into sector rooms; visitors can also explore the corridors by walking. Move near a room's holographic terminal and press E to open its portfolio content.",
    `Sectors: ${SECTORS.map(s => `${s.name} (${s.id}): ${s.summary}`).join(" | ")}`,
    `Explored ${visited.length} of 6. Completed: ${visited.join(", ") || "none"}. Remaining: ${remaining.map(s => s.name).join(", ") || "none"}.`,
    `FINAL OBJECTIVE: ${remaining.length ? "Return to the main reactor after opening all six terminals; currently LOCKED." : "The central reactor is unlocked; go to the centre of the atrium and press E to activate it."}`,
    "Biography: Chirag Nayaka M S is from Mysore, Karnataka, India. Completed a BE in Computer Science and Engineering in 2025. Now lives in Glasgow, Scotland and studies MSc Applied Data Science in Engineering at Glasgow Caledonian University (from 2026).",
  ].join("\n");
}

export function worldGuideAnswer(question: string): string | null {
  const q = question.trim().toLowerCase();
  if (/\b(how.*(move|walk|control|look|run)|wasd|keyboard|shortcut|help|instructions?)\b/.test(q))
    return "W A S D to walk; drag the mouse to look, or click the world to capture it. Shift to sprint, E to interact, M for map, J for chat, H for help.";
  if (/\b(ultron|mission|enemy|battle|combat)\b/.test(q))
    return "ULTRON is in the red restricted sector. Walk through its red-lit corridor or press M to fast travel. Interact with the mission terminal to launch the puzzle encounter.";
  if (/\b(final|finish|ending|reactor|core|goal|complete.*world)\b/.test(q)) {
    const remaining=SECTORS.filter(s=>!visitedWorldSectors().includes(s.id));
    return remaining.length ? `The final destination is the main Arc Reactor in the centre. First open all six sector terminals. ${remaining.length} remain: ${remaining.map(s=>s.name).join(", ")}.` : "All six sectors are complete. Return to the central Arc Reactor and press E to activate the final sequence.";
  }
  if (/\b(how many|progress|remain|still need|explored|visited)\b/.test(q)) {
    const visited=visitedWorldSectors();
    return `You've explored ${visited.length} of six sectors. Press M to see the map and reach your remaining destinations.`;
  }
  if (/\b(where|find|take me|navigate|direction|how.*(get|go)|location)\b/.test(q)) {
    const d=SECTORS.find(s => q.includes(s.id) || q.includes(s.name.toLowerCase().split(" ")[0]));
    if(d) return `${d.name}: ${d.summary} Press M, select the room, then press E by its holographic terminal.`;
    return "Open the map with M. All six rooms are connected to the central reactor atrium by illuminated corridors. You can walk or fast travel.";
  }
  if (/\b(what.*(do|next|here)|tour|start exploring|guide me)\b/.test(q))
    return "Explore the Identity Archive, Technology Lab, Project Vault, Research Nexus, ULTRON Sector and Contact Hub. Open each room's terminal. Finish at the central Arc Reactor.";
  return null;
}

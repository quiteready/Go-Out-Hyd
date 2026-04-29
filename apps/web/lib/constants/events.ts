export const EVENT_TYPE_LABELS: Record<string, string> = {
  live_music: "Live Music",
  open_mic: "Open Mic",
  workshop: "Workshop",
  comedy_night: "Comedy Night",
  gaming: "Gaming",
  jamming: "Jamming Session",
};

export const VALID_EVENT_TYPES = [
  "live_music",
  "open_mic",
  "workshop",
  "comedy_night",
  "gaming",
  "jamming",
] as const;

export type EventType = (typeof VALID_EVENT_TYPES)[number];

export function isValidEventType(value: string): value is EventType {
  return (VALID_EVENT_TYPES as readonly string[]).includes(value);
}

export function getEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}


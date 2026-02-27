import { getVisitorId, getEmail } from "./auth";

type EventType = "page_view" | "search" | "model_view" | "compare" | "recommend" | "signup";

export function trackEvent(
  eventType: EventType,
  eventData?: Record<string, unknown>,
  path?: string,
) {
  try {
    const body = {
      visitor_id: getVisitorId(),
      email: getEmail(),
      event_type: eventType,
      event_data: eventData || {},
      path: path || window.location.pathname,
    };

    // Fire and forget
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

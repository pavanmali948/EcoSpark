import { encodeLicenseForTopic } from "./topicCodec";

/** WebSocket/SockJS must hit the backend host directly (not the Vite /api proxy). */
const apiBase = () => {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080";
  if (raw === "/api" || (raw.startsWith("/") && !raw.startsWith("//"))) {
    return "http://localhost:8080";
  }
  return raw.replace(/\/$/, "");
};

/**
 * Subscribe to pump-scoped booking/slot updates (STOMP / SockJS).
 * Uses dynamic import so sockjs-client is not loaded on initial app boot (avoids blank screen with Vite).
 * @returns unsubscribe function
 */
export function subscribePumpUpdates(licenseNo, token, onMessage) {
  if (!licenseNo || !token || typeof onMessage !== "function") {
    return () => {};
  }

  const enc = encodeLicenseForTopic(licenseNo);
  const wsBase = `${apiBase()}/ws`;
  let stompClient = null;
  let cancelled = false;

  (async () => {
    try {
      const [sockMod, stompMod] = await Promise.all([
        import("sockjs-client"),
        import("@stomp/stompjs"),
      ]);
      const SockJS = sockMod.default;
      const { Client } = stompMod;
      if (cancelled) return;

      let stomp = null;
      stomp = new Client({
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        webSocketFactory: () =>
          new SockJS(`${wsBase}?token=${encodeURIComponent(token)}`),
        onConnect: () => {
          if (cancelled || !stomp) return;
          stomp.subscribe(`/topic/pump/${enc}/updates`, (frame) => {
            try {
              onMessage(JSON.parse(frame.body));
            } catch {
              onMessage(null);
            }
          });
        },
        onStompError: () => {},
        onWebSocketError: () => {},
      });

      stompClient = stomp;
      if (!cancelled) {
        stomp.activate();
      }
    } catch (e) {
      console.warn("Realtime (STOMP/SockJS) unavailable:", e);
    }
  })();

  return () => {
    cancelled = true;
    try {
      stompClient?.deactivate();
    } catch {
      /* ignore */
    }
  };
}

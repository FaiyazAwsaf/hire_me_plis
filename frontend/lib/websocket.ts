const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export type WsMessage =
  | { type: "token"; content: string }
  | { type: "done"; content: "" }
  | { type: "error"; content: string };

export interface ChatWebSocket {
  send: (message: string, sessionId: string, jobId?: string | null) => void;
  close: () => void;
}

/**
 * Opens a WebSocket to /chat/ws?token=<jwt> and wires message/error/close
 * callbacks. The caller is responsible for closing when done.
 */
export function createChatSocket(
  onMessage: (msg: WsMessage) => void,
  onOpen?: () => void,
  onError?: (event: Event, reason?: string) => void,
  onClose?: () => void,
): ChatWebSocket {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (!token) {
    // Defer so caller can wire up handlers first
    setTimeout(() => onError?.(new Event("error"), "no_token"), 0);
    return { send: () => {}, close: () => {} };
  }

  const url = `${WS_BASE}/chat/ws?token=${token}`;
  const ws = new WebSocket(url);
  // Track intentional closes (e.g. React Strict Mode cleanup) to suppress false errors
  let intentionallyClosed = false;

  ws.onopen = () => onOpen?.();

  ws.onmessage = (event) => {
    try {
      const msg: WsMessage = JSON.parse(event.data as string);
      onMessage(msg);
    } catch {
      // ignore unparseable frames
    }
  };

  // onerror always fires before onclose and never carries a close code — ignore it here
  ws.onerror = () => {};

  // onclose is the single source of truth for why the socket ended
  ws.onclose = (e) => {
    if (intentionallyClosed) {
      onClose?.();
      return;
    }
    if (e.code === 4001) {
      onError?.(new Event("error"), "auth_failed");
    } else if (e.code === 1000 || e.code === 1001) {
      // Normal / going-away close
      onClose?.();
    } else {
      // 1006 (abnormal) or anything else — real connection failure
      onError?.(new Event("error"));
    }
  };

  return {
    send(message: string, sessionId: string, jobId?: string | null) {
      if (ws.readyState === WebSocket.OPEN) {
        const payload: Record<string, string> = { message, session_id: sessionId };
        if (jobId) payload.job_id = jobId;
        ws.send(JSON.stringify(payload));
      }
    },
    close() {
      intentionallyClosed = true;
      ws.close();
    },
  };
}

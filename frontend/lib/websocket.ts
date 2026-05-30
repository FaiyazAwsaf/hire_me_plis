const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export type WsMessage =
  | { type: "token"; content: string }
  | { type: "done"; content: "" }
  | { type: "error"; content: string };

export interface ChatWebSocket {
  send: (message: string, sessionId: string) => void;
  close: () => void;
}

/**
 * Opens a WebSocket to /chat/ws?token=<jwt> and wires message/error/close
 * callbacks. The caller is responsible for closing when done.
 */
export function createChatSocket(
  onMessage: (msg: WsMessage) => void,
  onError?: (event: Event) => void,
  onClose?: () => void
): ChatWebSocket {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const url = `${WS_BASE}/chat/ws${token ? `?token=${token}` : ""}`;
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const msg: WsMessage = JSON.parse(event.data as string);
      onMessage(msg);
    } catch {
      // ignore unparseable frames
    }
  };

  ws.onerror = (e) => onError?.(e);
  ws.onclose = () => onClose?.();

  return {
    send(message: string, sessionId: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ message, session_id: sessionId }));
      }
    },
    close() {
      ws.close();
    },
  };
}

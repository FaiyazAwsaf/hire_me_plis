import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// TODO: wire up WebSocket via lib/websocket.ts; session_id generated client-side per session

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 shrink-0">AI Assistant</h1>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-4 mb-4">
        <SystemMessage text="Hi! I'm your career co-pilot. Ask me anything about your CV, job readiness, or career plans." />
      </div>

      {/* Input bar */}
      <div className="flex gap-2 shrink-0">
        <Input
          placeholder="Ask something… e.g. Am I ready for a senior SWE role?"
          className="flex-1"
        />
        <Button type="button">Send</Button>
      </div>
    </div>
  );
}

function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
        AI
      </div>
      <p className="text-sm leading-relaxed pt-0.5">{text}</p>
    </div>
  );
}

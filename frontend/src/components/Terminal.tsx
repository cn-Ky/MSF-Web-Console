import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { wsUrlFor } from "../api";

interface Props {
  sessionId: string;
}

export default function TerminalView({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
      theme: {
        background: "#0A0C10",
        foreground: "#E6E8EB",
        cursor: "#E8A33D",
        selectionBackground: "#2a2f3a",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    const ws = new WebSocket(wsUrlFor(sessionId));

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "data") {
          term.write(msg.data);
        } else if (msg.type === "exit") {
          term.write(`\r\n\r\n[oturum sonlandi, kod: ${msg.code}]\r\n`);
        } else if (msg.type === "error") {
          term.write(`\r\n[hata: ${msg.message}]\r\n`);
        }
      } catch {
        /* yoksay */
      }
    };

    const onData = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    const onResize = () => {
      fit.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      onData.dispose();
      ws.close();
      term.dispose();
    };
  }, [sessionId]);

  return <div ref={containerRef} className="h-full w-full px-3 py-2" />;
}

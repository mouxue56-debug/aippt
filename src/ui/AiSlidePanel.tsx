import { useState } from "react";

interface AiSlidePanelProps {
  disabled: boolean;
  onApplyLocal: (intent: string) => void;
}

export function AiSlidePanel({ disabled, onApplyLocal }: AiSlidePanelProps) {
  const [intent, setIntent] = useState("");

  return (
    <section className="ai-panel">
      <h2>单页 AI</h2>
      <textarea
        value={intent}
        onChange={(event) => setIntent(event.currentTarget.value)}
        placeholder="例如：把这一页改得更适合公开课讲解"
        disabled={disabled}
      />
      <button disabled={disabled || !intent.trim()} onClick={() => onApplyLocal(intent.trim())}>
        本地记录意图
      </button>
      <p className="muted">HMS/Hermes 接口已预留；MVP 先保留单页边界和本地降级，不整套重算。</p>
    </section>
  );
}


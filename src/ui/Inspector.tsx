import type { CanvasLayout, EditableElement, TextStyleProperty, VisualBlockInput, VisualBlockKind } from "../deck/types";

interface InspectorProps {
  editable: EditableElement[];
  selected?: EditableElement;
  selectedLayout?: CanvasLayout;
  onReplaceText: (editId: string, value: string) => void;
  onSetTextStyle: (editId: string, property: TextStyleProperty, value: string, label: string) => void;
  onReplaceImage: (editId: string, src: string, alt: string) => void;
  onSetLayout: (editId: string, layout: { x?: number; y?: number; dx?: number; dy?: number; width?: number }) => void;
  onDeleteObject: (editId: string) => void;
  onApplyMotion: (editId: string, preset: string) => void;
  onApplySlideMotion: (preset: string) => void;
  onInsertVisualBlock: (block: VisualBlockInput) => void;
}

export function Inspector({
  editable,
  selected,
  selectedLayout,
  onReplaceText,
  onSetTextStyle,
  onReplaceImage,
  onSetLayout,
  onDeleteObject,
  onApplyMotion,
  onApplySlideMotion,
  onInsertVisualBlock
}: InspectorProps) {
  const textItems = selected?.text && selected.role !== "image" ? [selected] : editable.filter((item) => item.text && item.role !== "image").slice(0, 8);
  const imageItems = editable.filter((item) => item.role === "image");
  const selectedText = selected && selected.role !== "image";
  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    onSetLayout(selected.id, { dx, dy });
  };
  const setStyle = (property: TextStyleProperty, value: string, label: string) => {
    if (!selected) return;
    onSetTextStyle(selected.id, property, value, label);
  };
  const setFontSize = (value: string) => {
    const size = Number(value);
    if (!Number.isFinite(size)) return;
    setStyle("font-size", `${Math.max(10, Math.min(140, size))}px`, "字号");
  };

  return (
    <section className="inspector">
      <h2>精修</h2>
      <div className="selected-card">
        <h3>{selected ? `已选中：${roleLabel(selected.role)}` : "先点击画布对象"}</h3>
        <p className="muted">{selected ? selected.text || selected.src || selected.id : "点击中间画布中的文字、图片或视觉块，右侧会切换成当前对象的编辑面板。"}</p>
        {selected ? (
          <>
            <div className="nudge-grid">
              <button onClick={() => nudge(0, -12)}>上移</button>
              <button onClick={() => nudge(0, 12)}>下移</button>
              <button onClick={() => nudge(-12, 0)}>左移</button>
              <button onClick={() => nudge(12, 0)}>右移</button>
            </div>
            <label className="field compact">
              <span>宽度</span>
              <input type="number" min="80" max="1200" step="20" placeholder="例如 420" onBlur={(event) => event.currentTarget.value && onSetLayout(selected.id, selectedLayout ? { x: selectedLayout.x, y: selectedLayout.y, width: Number(event.currentTarget.value) } : { width: Number(event.currentTarget.value) })} />
            </label>
            {selectedText ? (
              <div className="style-panel">
                <h4>文字样式</h4>
                <div className="style-grid">
                  <label className="field compact">
                    <span>文字颜色</span>
                    <input
                      aria-label="文字颜色"
                      type="color"
                      defaultValue="#111827"
                      onInput={(event) => setStyle("color", event.currentTarget.value, "颜色")}
                      onChange={(event) => setStyle("color", event.currentTarget.value, "颜色")}
                    />
                  </label>
                  <label className="field compact">
                    <span>字号</span>
                    <input aria-label="字号" type="number" min="10" max="140" step="2" placeholder="64" onBlur={(event) => event.currentTarget.value && setFontSize(event.currentTarget.value)} />
                  </label>
                </div>
                <div className="style-buttons">
                  <button type="button" onClick={() => setStyle("font-weight", "800", "加粗")}>加粗</button>
                  <button type="button" onClick={() => setStyle("font-style", "italic", "斜体")}>斜体</button>
                  <button type="button" onClick={() => setStyle("text-shadow", "0 0 14px rgba(0,229,255,.72), 0 0 26px rgba(255,61,139,.35)", "霓虹字")}>霓虹字</button>
                </div>
                <div className="style-buttons align-buttons">
                  <button type="button" onClick={() => setStyle("text-align", "left", "左对齐")}>左</button>
                  <button type="button" onClick={() => setStyle("text-align", "center", "居中")}>中</button>
                  <button type="button" onClick={() => setStyle("text-align", "right", "右对齐")}>右</button>
                </div>
              </div>
            ) : null}
            <button className="danger-button" onClick={() => onDeleteObject(selected.id)}>删除对象</button>
          </>
        ) : null}
      </div>
      <div className="field-group">
        <h3>{selected ? "当前文字" : "文字样本"}</h3>
        {textItems.length === 0 ? <p className="muted">当前页未识别到可编辑文字。</p> : null}
        {textItems.map((item) => (
          <label key={item.id} className="field">
            <span>{roleLabel(item.role)}</span>
            <textarea defaultValue={item.text} onBlur={(event) => onReplaceText(item.id, event.currentTarget.value)} />
          </label>
        ))}
      </div>

      <div className="field-group">
        <h3>图片</h3>
        <label className="file-mini visual-insert">
          <span>插入新图片</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onInsertVisualBlock({ kind: "image", src: String(reader.result), alt: file.name });
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {imageItems.length === 0 ? <p className="muted">当前页没有图片也可以直接插入图片块。</p> : null}
        {(selected?.role === "image" ? [selected] : imageItems).map((item) => (
          <label key={item.id} className="file-mini">
            <span>{item.src ?? "图片"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onReplaceImage(item.id, String(reader.result), file.name);
                reader.readAsDataURL(file);
              }}
            />
          </label>
        ))}
      </div>

      <div className="field-group">
        <h3>动效</h3>
        <div className="motion-row">
          <span>整页节奏</span>
          <select onChange={(event) => event.currentTarget.value && onApplySlideMotion(event.currentTarget.value)} defaultValue="">
            <option value="">选择</option>
            <option value="clean-static">静态清晰</option>
            <option value="guided-reveal">阅读引导</option>
            <option value="cinematic-focus">视觉聚焦</option>
            <option value="ai-neon-scan">AI霓虹扫描</option>
            <option value="hologram-depth">全息浮层</option>
            <option value="signal-pulse">信号脉冲</option>
            <option value="data-cascade">数据瀑布</option>
          </select>
        </div>
        {selected ? (
          <div className="motion-row">
            <span>选中对象</span>
            <select onChange={(event) => event.currentTarget.value && onApplyMotion(selected.id, event.currentTarget.value)} defaultValue="">
              <option value="">选择</option>
              <option value="focus-pop">聚焦弹入</option>
              <option value="neural-glow">神经高亮</option>
              <option value="scan-line">扫描入场</option>
            </select>
          </div>
        ) : null}
        <p className="muted">优先用整页节奏建立视觉记忆点，再给关键标题或数字加对象动效。</p>
      </div>

      <div className="field-group">
        <h3>视觉引导</h3>
        <div className="visual-buttons">
          {(["process", "mindmap", "gantt"] as VisualBlockKind[]).map((kind) => (
            <button key={kind} type="button" onClick={() => onInsertVisualBlock({ kind })}>
              {visualLabel(kind)}
            </button>
          ))}
        </div>
        <p className="muted">用于快速加入流程图、思维图、甘特图，再继续编辑里面的文字。</p>
      </div>
    </section>
  );
}

function roleLabel(role: EditableElement["role"]): string {
  const labels: Record<EditableElement["role"], string> = {
    title: "标题",
    subtitle: "副标题",
    body: "正文",
    quote: "引用",
    metric: "数字",
    image: "图片",
    icon: "图标",
    cta: "行动",
    note: "备注",
    unknown: "内容"
  };
  return labels[role];
}

function visualLabel(kind: VisualBlockKind): string {
  const labels: Record<VisualBlockKind, string> = {
    image: "图片",
    process: "流程图",
    mindmap: "思维图",
    gantt: "甘特图"
  };
  return labels[kind];
}

interface ExportPanelProps {
  disabled: boolean;
  slideCount: number;
  slideNumber?: number;
  dirty: boolean;
  lastSavedLabel?: string;
  savedDraftLabel?: string;
  onSaveProject: () => void;
  onSaveSlide: () => void;
  onRestoreDraft: () => void;
  onExportDeck: () => void;
  onExportSlide: () => void;
}

export function ExportPanel({
  disabled,
  slideCount,
  slideNumber,
  dirty,
  lastSavedLabel,
  savedDraftLabel,
  onSaveProject,
  onSaveSlide,
  onRestoreDraft,
  onExportDeck,
  onExportSlide
}: ExportPanelProps) {
  return (
    <section className="export-panel">
      <h2>保存 / 导出</h2>
      <p className="save-state">{dirty ? "有未保存修改" : lastSavedLabel ? `已保存：${lastSavedLabel}` : "当前没有本机草稿"}</p>
      <div className="export-actions">
        <button disabled={disabled} onClick={onSaveProject}>保存整套草稿</button>
        <button disabled={disabled} onClick={onSaveSlide}>保存当前页</button>
        <button disabled={!savedDraftLabel} onClick={onRestoreDraft}>{savedDraftLabel ? `恢复草稿 ${savedDraftLabel}` : "暂无草稿可恢复"}</button>
      </div>
      <div className="export-actions export-actions-primary">
        <button disabled={disabled} onClick={onExportDeck}>
          导出整套 HTML（{slideCount || 0}页）
        </button>
        <button disabled={disabled || !slideNumber} onClick={onExportSlide}>
          导出当前页 HTML{slideNumber ? `（第${String(slideNumber).padStart(2, "0")}页）` : ""}
        </button>
      </div>
    </section>
  );
}

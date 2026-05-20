import type { SlideModel } from "../deck/types";
import { localFallbackSlideEdit, validateSlideEditResponse } from "../ai/slideEditClient";
import { AiSlidePanel } from "../ui/AiSlidePanel";

interface InternalAiSlideToolsProps {
  disabled: boolean;
  selectedSlide?: SlideModel;
  onUpdateSlide: (slide: SlideModel, message: string) => void;
  onStatus: (message: string) => void;
}

export function InternalAiSlideTools({ disabled, selectedSlide, onUpdateSlide, onStatus }: InternalAiSlideToolsProps) {
  function applyLocalAi(intent: string) {
    if (!selectedSlide) return;
    const response = localFallbackSlideEdit(intent, selectedSlide.html);
    const validation = validateSlideEditResponse(response, selectedSlide.id);
    if (!validation.ok) {
      onStatus(validation.reason ?? "单页 AI 响应未通过验证。");
      return;
    }
    onUpdateSlide({ ...selectedSlide, html: response.updatedSlideHtml }, response.warnings.join(" "));
  }

  return <AiSlidePanel disabled={disabled} onApplyLocal={applyLocalAi} />;
}

export interface SlideEditRequest {
  slideId: string;
  slideIndex: number;
  selectedHtml: string;
  editIntent: string;
  constraints: string[];
  templateId: string;
}

export interface SlideEditResponse {
  updatedSlideHtml: string;
  patch: Array<{ op: string; path: string; value?: string }>;
  warnings: string[];
  modelUsed: string;
  costTokens: number;
}

export function validateSlideEditResponse(response: SlideEditResponse, slideId: string): { ok: boolean; reason?: string } {
  if (!response.updatedSlideHtml.includes(`data-slide-id="${slideId}"`) && !response.updatedSlideHtml.includes(`data-slide-id='${slideId}'`)) {
    return { ok: false, reason: "AI response removed or changed the selected slide id." };
  }
  if (/<script[\s>]/i.test(response.updatedSlideHtml)) {
    return { ok: false, reason: "AI response attempted to inject script into a slide fragment." };
  }
  if (/\son[a-z]+\s*=/i.test(response.updatedSlideHtml)) {
    return { ok: false, reason: "AI response attempted to add inline event handlers." };
  }
  return { ok: true };
}

export async function requestHermesSlideEdit(endpoint: string, request: SlideEditRequest): Promise<SlideEditResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Hermes slide edit failed: ${response.status}`);
  }

  return (await response.json()) as SlideEditResponse;
}

export function localFallbackSlideEdit(editIntent: string, selectedHtml: string): SlideEditResponse {
  return {
    updatedSlideHtml: selectedHtml,
    patch: [],
    warnings: [`本地降级模式：已记录意图「${editIntent}」，未调用远端模型。`],
    modelUsed: "local-fallback",
    costTokens: 0
  };
}

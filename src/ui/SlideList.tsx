import { getArchetypeLabel } from "../deck/archetypes";
import type { SlideModel } from "../deck/types";

interface SlideListProps {
  slides: SlideModel[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function SlideList({ slides, selectedId, onSelect }: SlideListProps) {
  return (
    <section className="slide-list" aria-label="幻灯片列表">
      {slides.map((slide) => (
        <button key={slide.id} className={slide.id === selectedId ? "slide-row selected" : "slide-row"} onClick={() => onSelect(slide.id)}>
          <span className="slide-num">{String(slide.index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{slide.title}</strong>
            <em>{getArchetypeLabel(slide.archetype)}</em>
          </span>
        </button>
      ))}
    </section>
  );
}


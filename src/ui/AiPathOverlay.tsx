import { useEffect, useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { AI_EXPLAINERS, loadExplainer, selectionFrom, type OverlayPathFile } from '../data/aiExplainers';
import { defaultSelection } from '../data/aiPathLogic';

/**
 * Panel controls for the AI view: pick an explainer and its choices (mode, device, ...)
 * to highlight the atlas nodes that path passes through. The choices come from the
 * explainer file itself, so a new explainer needs no code here.
 */
export function AiPathOverlay() {
  const { dataset, aiOverlay, aiOverlayNodeIds, setAiOverlay } = useGraphStore();
  const [file, setFile] = useState<OverlayPathFile | null>(null);

  useEffect(() => {
    let current = true;
    if (aiOverlay) loadExplainer(aiOverlay.slug).then((data) => { if (current) setFile(data); });
    else setFile(null);
    return () => { current = false; };
  }, [aiOverlay]);

  const choose = (slug: string) => {
    if (aiOverlay?.slug === slug) return setAiOverlay(null);
    loadExplainer(slug).then((data) => { if (data) setAiOverlay({ slug, selection: defaultSelection(data) }); });
  };

  const names = (aiOverlayNodeIds ?? []).map((id) => dataset?.languageMap.get(id)?.name ?? id);
  const query = aiOverlay ? new URLSearchParams(aiOverlay.selection).toString() : '';

  return (
    <div className="filter-group">
      <label className="filter-group-label">Show an execution path</label>
      <div className="filter-chips">
        {AI_EXPLAINERS.map((e) => (
          <button
            key={e.slug}
            className={`filter-chip ${aiOverlay?.slug === e.slug ? 'active' : ''}`}
            aria-pressed={aiOverlay?.slug === e.slug}
            onClick={() => choose(e.slug)}
          >
            {e.name}
          </button>
        ))}
      </div>

      {aiOverlay && file?.slug === aiOverlay.slug && file.dimensions.map((d) => (
        <div key={d.id} className="filter-chips ai-overlay-dimension" role="group" aria-label={d.legend}>
          {d.options.map((o) => (
            <button
              key={o.value}
              className={`filter-chip ${aiOverlay.selection[d.id] === o.value ? 'active' : ''}`}
              aria-pressed={aiOverlay.selection[d.id] === o.value}
              onClick={() => setAiOverlay({ slug: aiOverlay.slug, selection: selectionFrom(file, { ...aiOverlay.selection, [d.id]: o.value }) })}
            >
              {o.label}
            </button>
          ))}
        </div>
      ))}

      {aiOverlay && names.length > 0 && (
        <p className="influence-mode-note">
          On this path: {names.join(' → ')}. Graph edges still mean "written in". Stages that are not
          atlas nodes (intermediate code, kernels, hardware) and the steps between them are
          on <a href={`/ai/${aiOverlay.slug}?${query}`}>the full explainer</a>.
        </p>
      )}
    </div>
  );
}

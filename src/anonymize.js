'use strict';
/**
 * Anonymize — command entry.
 * Flow: config panel → scan scope → (if ambiguous units) review panel → apply.
 * In-place; revert with Sketch undo (cmd+z).
 */
const sketch = require('sketch');
const { Document } = require('sketch/dom');
import { showAnonymizePanel, showReviewPanel } from './anonymize/panel';
import { scan } from './anonymize/scan';
import { apply } from './anonymize/apply';

export default function () {
  const document = Document.getSelectedDocument();
  if (!document) {
    sketch.UI.message('Kein Dokument geöffnet.');
    return;
  }

  showAnonymizePanel((opts) => {
    if (opts.scope === 'selection') {
      const sel = (document.selectedLayers && document.selectedLayers.layers) || [];
      if (!sel.length) {
        sketch.UI.message('Anonymize: nichts ausgewählt.');
        return;
      }
    }

    const result = scan(document, opts.scope);
    if (!result.textLayers.length && !result.imageLayers.length) {
      sketch.UI.message('Anonymize: keine Text-/Bild-Layer im Bereich.');
      return;
    }

    const run = (preserve) => {
      const r = apply(result, { level: opts.level, style: opts.style, source: opts.source, preserve });
      sketch.UI.message(`Anonymize: ${r.textCount} Text, ${r.imageCount} Bild${r.imageCount === 1 ? '' : 'er'} bearbeitet (cmd+z für undo).`);
    };

    const needsReview = opts.level !== 'wipe' && opts.style !== 'blackout' && result.ambiguous.length > 0;
    if (needsReview) showReviewPanel(result.ambiguous, document, (preserve) => run(preserve));
    else run(new Set());
  });
}

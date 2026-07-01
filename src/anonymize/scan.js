'use strict';
/**
 * Sketch adapter: collect the layers in scope and the ambiguous unit tokens
 * that need user review before anonymizing. No mutation here.
 */
import { classifyTokens } from './core';

function collectByType(root, acc) {
  if (!root) return acc;
  try {
    if (root.type === 'Text') acc.text.push(root);
    if (root.type === 'Image') acc.image.push(root);
    else {
      const fills = root.style && root.style.fills;
      if (fills && fills.some((f) => f.enabled && f.fillType === 'Pattern')) acc.image.push(root);
    }
    // Symbol instances hold their visible text in OVERRIDES, not child layers.
    // The .overrides array is flat and includes nested-symbol overrides too
    // (same source smartSelect/equalize use). property 'stringValue' = text.
    if (root.type === 'SymbolInstance' && Array.isArray(root.overrides)) {
      root.overrides.forEach((ov) => {
        try {
          if (ov && ov.property === 'stringValue' && ov.editable !== false && typeof ov.value === 'string' && ov.value.length) {
            acc.overrides.push({ ov, owner: root }); // owner = the SymbolInstance (selectable on canvas)
          }
        } catch (e) {}
      });
    }
  } catch (e) {}
  const kids = root.layers;
  if (kids && kids.length) kids.forEach((k) => collectByType(k, acc));
  return acc;
}

function enclosingArtboard(layer) {
  let p = layer;
  let guard = 0;
  while (p && guard++ < 60) {
    if (p.type === 'Artboard') return p;
    p = p.parent;
  }
  return null;
}

/** Root layers to walk for the chosen scope: 'selection' | 'artboard' | 'document'. */
export function collectRoots(document, scope) {
  const sel = (document.selectedLayers && document.selectedLayers.layers) || [];
  if (scope === 'document') return document.pages || [];
  if (scope === 'artboard') {
    const abs = [];
    sel.forEach((l) => {
      const ab = enclosingArtboard(l);
      if (ab && !abs.includes(ab)) abs.push(ab);
    });
    if (abs.length) return abs;
    const page = document.selectedPage || (document.pages && document.pages[0]);
    return page ? (page.layers || []).filter((l) => l.type === 'Artboard') : [];
  }
  return sel; // selection
}

/** Add a string's ambiguous tokens to the map, recording the source layer per token. */
function addAmbiguous(map, text, source) {
  classifyTokens(text).forEach((t) => {
    if (t.kind !== 'ambiguous') return;
    let e = map.get(t.value);
    if (!e) {
      e = { value: t.value, reason: t.reason || 'mehrdeutig', layers: [] };
      map.set(t.value, e);
    }
    if (source && !e.layers.some((l) => l.id === source.id)) e.layers.push(source);
  });
}

export function scan(document, scope) {
  const roots = collectRoots(document, scope);
  const acc = { text: [], image: [], overrides: [] };
  roots.forEach((r) => collectByType(r, acc));

  // ambiguous tokens with their source layers (Text layer, or the SymbolInstance
  // owning an override) so the review panel can reveal where each was found.
  const map = new Map();
  acc.text.forEach((t) => addAmbiguous(map, String(t.text || ''), t));
  acc.overrides.forEach((o) => addAmbiguous(map, String(o.ov.value || ''), o.owner));

  return {
    roots,
    textLayers: acc.text,
    imageLayers: acc.image,
    textOverrides: acc.overrides,
    ambiguous: Array.from(map.values()),
  };
}

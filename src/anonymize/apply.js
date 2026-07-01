'use strict';
/**
 * Sketch adapter: mutate layers in place per the chosen level.
 * Levels: 'labels' (text only) | 'labelsData' (text + images) | 'wipe' (clear all).
 * In-place; relies on Sketch undo (cmd+z) to revert.
 */
import { anonymizeString } from './core';

const PLACEHOLDER_GRAY = '#CCCCCCFF';

function grayOut(layer) {
  try {
    layer.style.fills = [{ color: PLACEHOLDER_GRAY, fillType: 'Color', enabled: true }];
  } catch (e) {}
}

/**
 * @param scanResult from scan()
 * @param opts { level, style, source, preserve: Set<string> }  preserve = ambiguous tokens to keep as units
 * @returns { textCount, imageCount }
 */
export function apply(scanResult, opts) {
  const preserve = opts.preserve;
  const decide = preserve ? (tok) => preserve.has(tok) : () => false;
  const anon = (s) => anonymizeString(s, { style: opts.style, source: opts.source, decideAmbiguous: decide });
  let textCount = 0;
  let imageCount = 0;

  // read current value / write new value uniformly for Text layers and overrides
  const get = (item) => String((item.isOverride ? item.ov.value : item.layer.text) || '');
  const put = (item, v) => {
    if (item.isOverride) item.ov.value = v;
    else item.layer.text = v;
  };
  const targets = scanResult.textLayers
    .map((layer) => ({ layer, isOverride: false }))
    .concat((scanResult.textOverrides || []).map((o) => ({ ov: o.ov, isOverride: true })));

  targets.forEach((item) => {
    try {
      const orig = get(item);
      if (opts.level === 'wipe') {
        if (orig !== '') {
          put(item, ' ');
          textCount++;
        }
      } else {
        if (!orig.trim()) return;
        put(item, anon(orig));
        textCount++;
      }
    } catch (e) {}
  });

  if (opts.level === 'labelsData' || opts.level === 'wipe') {
    scanResult.imageLayers.forEach((l) => {
      grayOut(l);
      imageCount++;
    });
  }

  return { textCount, imageCount };
}

'use strict';
/**
 * Anonymize UI: config panel (scope / level / style radios + From-String field)
 * and a review panel for ambiguous unit tokens.
 *
 * NOTE: built against proven toolboxx AppKit patterns; needs an in-Sketch smoke test.
 */
import { MochaJSDelegate } from '../utils/mocha';
import { makeLabel, makeField, makeCheckbox, makeRadioGroup } from '../ui/controls';

function keepAround(on) {
  COScript.currentCOScript().setShouldKeepAround_(on);
}

function basePanel(identifier, title, width, height) {
  const td = NSThread.mainThread().threadDictionary();
  if (td[identifier]) {
    try {
      td[identifier].close();
    } catch (e) {}
    td.removeObjectForKey(identifier);
  }
  const panel = NSPanel.alloc().init();
  panel.setStyleMask(NSWindowStyleMaskTitled | NSWindowStyleMaskClosable);
  // size the CONTENT (not the window frame) so layout against `height` isn't
  // clipped by the title bar at top/bottom.
  panel.setContentSize(NSMakeSize(width, height));
  panel.setBackgroundColor(NSColor.windowBackgroundColor());
  panel.title = title;
  panel.center();
  panel.makeKeyAndOrderFront(null);
  panel.setLevel(NSFloatingWindowLevel);
  keepAround(true);
  td[identifier] = panel;
  return { panel, td };
}

function wireClose(panel, td, identifier, onClose) {
  const delegateKey = identifier + '.delegate';
  const cleanup = () => {
    try {
      td.removeObjectForKey(identifier);
      td.removeObjectForKey(delegateKey);
    } catch (e) {}
    keepAround(false);
    if (onClose) onClose();
  };
  const delegate = MochaJSDelegate({ 'windowWillClose:': () => cleanup() });
  panel.setDelegate_(delegate);
  td[delegateKey] = delegate;
  return cleanup;
}

function button(content, x, y, w, title, fn) {
  const b = NSButton.alloc().initWithFrame(NSMakeRect(x, y, w, 28));
  b.setTitle(title);
  b.setBezelStyle(NSBezelStyleRounded);
  b.setCOSJSTargetFunction(fn);
  content.addSubview(b);
  return b;
}

const SCOPE = [
  { label: 'Auswahl', value: 'selection' },
  { label: 'Artboard', value: 'artboard' },
  { label: 'Dokument', value: 'document' },
];
const LEVEL = [
  { label: 'Nur Labels (Text)', value: 'labels' },
  { label: 'Labels + Daten (Bilder)', value: 'labelsData' },
  { label: 'Alles leeren', value: 'wipe' },
];
const STYLE = [
  { label: 'Xxx 00 (zeichen-erhaltend)', value: 'xx00' },
  { label: 'Lorem Ipsum', value: 'lorem' },
  { label: 'Blackout ████', value: 'blackout' },
  { label: 'Aus Text…', value: 'fromString' },
];

/** Config panel. onApply({ scope, level, style, source }). */
export function showAnonymizePanel(onApply) {
  const W = 360;
  const H = 470;
  const id = 'net.notbot.toolboxx.anonymize.config';
  const { panel, td } = basePanel(id, 'Anonymize', W, H);
  const content = panel.contentView();
  const cleanup = wireClose(panel, td, id);

  const x = 20;
  const groupW = W - 40;
  let fromTop = 16;
  const headerH = 18;
  const rowH = 22;
  const section = (titleText, options, gapAfter) => {
    content.addSubview(makeLabel(NSMakeRect(x, H - fromTop - headerH, groupW, headerH), titleText, { size: 11, bold: true }));
    fromTop += headerH + 2;
    const grp = makeRadioGroup(content, options, { x: x + 4, top: H - fromTop - (rowH - 2), rowH, width: groupW - 4 }, gapAfter);
    fromTop += rowH * options.length + 8;
    return grp;
  };

  const scopeGrp = section('Bereich', SCOPE);
  const levelGrp = section('Umfang', LEVEL);

  // style group with onChange to toggle the source field
  content.addSubview(makeLabel(NSMakeRect(x, H - fromTop - headerH, groupW, headerH), 'Text-Stil', { size: 11, bold: true }));
  fromTop += headerH + 2;
  let sourceField = null;
  const styleGrp = makeRadioGroup(
    content,
    STYLE,
    { x: x + 4, top: H - fromTop - (rowH - 2), rowH, width: groupW - 4 },
    (val) => {
      if (sourceField) sourceField.setEnabled(val === 'fromString');
    }
  );
  fromTop += rowH * STYLE.length + 6;

  content.addSubview(makeLabel(NSMakeRect(x, H - fromTop - 14, groupW, 14), 'Quelltext (für „Aus Text…"):', { size: 10, color: NSColor.secondaryLabelColor() }));
  fromTop += 16;
  sourceField = makeField(NSMakeRect(x, H - fromTop - 24, groupW, 24), '');
  sourceField.setEnabled(false);
  content.addSubview(sourceField);
  fromTop += 30;

  button(content, x, 14, 150, 'Abbrechen', () => {
    panel.close();
    cleanup();
  });
  button(content, W - 20 - 150, 14, 150, 'Anonymisieren', () => {
    const opts = {
      scope: scopeGrp.get(),
      level: levelGrp.get(),
      style: styleGrp.get(),
      source: String(sourceField.stringValue()),
    };
    panel.close();
    cleanup();
    onApply(opts);
  });
}

/**
 * Review panel for ambiguous tokens. ambiguous: [{value, reason, layers}].
 * Clicking a row's ↗ selects + centers its source layer(s) on the canvas; the
 * original selection is saved and restored when the panel closes.
 * onConfirm(preserveSet: Set<string>) — checked items are kept as units.
 */
export function showReviewPanel(ambiguous, document, onConfirm) {
  const W = 460;
  const rowH = 26;
  const headH = 64;
  const footH = 54;
  const listH = Math.min(ambiguous.length * rowH + 8, 360);
  const H = headH + listH + footH;
  const id = 'net.notbot.toolboxx.anonymize.review';

  // save current selection so reveal-clicks can be undone on close
  let original = [];
  try {
    original = (document.selectedLayers && document.selectedLayers.layers) ? document.selectedLayers.layers.slice() : [];
  } catch (e) {}
  const select = (layers, center) => {
    try {
      document.selectedLayers.clear();
    } catch (e) {}
    (layers || []).forEach((l) => {
      try {
        l.selected = true;
      } catch (e) {}
    });
    if (center && layers && layers[0]) {
      try {
        document.centerOnLayer(layers[0]);
      } catch (e) {}
    }
  };

  const { panel, td } = basePanel(id, 'Anonymize — Einheiten prüfen', W, H);
  const content = panel.contentView();
  const cleanup = wireClose(panel, td, id, () => select(original, false)); // restore on any close

  content.addSubview(
    makeLabel(NSMakeRect(20, H - 40, W - 40, 32), 'Mehrdeutig — ankreuzen = als Einheit behalten. ↗ zeigt die Fundstelle im Canvas:', {
      size: 11,
    })
  );

  const scroll = NSScrollView.alloc().initWithFrame(NSMakeRect(16, footH, W - 32, listH));
  scroll.setHasVerticalScroller(true);
  scroll.setDrawsBackground(false);
  const docW = W - 48;
  const docView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, docW, Math.max(listH, ambiguous.length * rowH + 8)));
  scroll.setDocumentView(docView);
  content.addSubview(scroll);

  const checks = ambiguous.map((item, i) => {
    const y = docView.frame().size.height - (i + 1) * rowH;
    const n = (item.layers && item.layers.length) || 0;
    const cb = makeCheckbox(NSMakeRect(8, y, docW - 70, rowH - 4), `${item.value}   —   ${item.reason || ''}`, false);
    docView.addSubview(cb);

    const reveal = NSButton.alloc().initWithFrame(NSMakeRect(docW - 58, y - 1, 52, rowH - 2));
    reveal.setTitle(n > 1 ? `↗ ${n}` : '↗');
    reveal.setBezelStyle(NSBezelStyleRounded);
    reveal.setEnabled(n > 0);
    reveal.setCOSJSTargetFunction(() => select(item.layers, true));
    docView.addSubview(reveal);

    return { cb, value: item.value };
  });

  button(content, 16, 14, 120, 'Abbrechen', () => {
    panel.close();
    cleanup();
  });
  button(content, W - 16 - 160, 14, 160, 'Anonymisieren', () => {
    const preserve = new Set();
    checks.forEach((c) => {
      if (c.cb.state() === NSOnState) preserve.add(c.value);
    });
    panel.close();
    cleanup();
    onConfirm(preserve);
  });
}

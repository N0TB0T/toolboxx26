'use strict';
/**
 * Shared native AppKit control builders (used by contrast & anonymize panels).
 * Bottom-left origin; system font / labelColor → auto light/dark.
 */

export function makeLabel(frame, text, opts = {}) {
  const f = NSTextField.alloc().initWithFrame(frame);
  f.setEditable(false);
  f.setBordered(false);
  f.setBezeled(false);
  f.setDrawsBackground(false);
  f.setSelectable(opts.selectable || false);
  const size = opts.size || 12;
  f.setFont(opts.bold ? NSFont.boldSystemFontOfSize(size) : NSFont.systemFontOfSize(size));
  if (opts.align === 'center') f.setAlignment(NSTextAlignmentCenter);
  if (opts.color) f.setTextColor(opts.color);
  f.setStringValue(text || '');
  return f;
}

export function makeField(frame, text, opts = {}) {
  const f = NSTextField.alloc().initWithFrame(frame);
  f.setEditable(true);
  f.setBezeled(true);
  f.setBezelStyle(NSTextFieldRoundedBezel);
  f.setFont(NSFont.systemFontOfSize(11));
  if (opts.align === 'center') f.setAlignment(NSTextAlignmentCenter);
  f.setStringValue(text || '');
  return f;
}

export function makeSwatch(frame) {
  const v = NSView.alloc().initWithFrame(frame);
  v.setWantsLayer(true);
  v.layer().setCornerRadius(6);
  v.layer().setBorderWidth(1);
  v.layer().setBorderColor(NSColor.separatorColor().CGColor());
  return v;
}

export function makeCheckbox(frame, title, checked) {
  const b = NSButton.alloc().initWithFrame(frame);
  b.setButtonType(NSButtonTypeSwitch);
  b.setTitle(title);
  b.setState(checked ? NSOnState : NSOffState);
  return b;
}

/**
 * Mutually-exclusive radio group. options: [{label, value}].
 * IMPORTANT: each group gets its OWN enclosing NSView — Cocoa groups
 * NSButtonTypeRadio buttons by superview, so groups sharing one superview would
 * act as a single group. The first option sits at parent-y `top`.
 * @returns { get(), set(value), view }
 */
export function makeRadioGroup(parent, options, layout, onChange) {
  const { x, top, rowH, width } = layout;
  const n = options.length;
  const height = n * rowH;
  const group = NSView.alloc().initWithFrame(NSMakeRect(x, top - (n - 1) * rowH, width, height));
  parent.addSubview(group);

  const buttons = [];
  let selected = options[0] && options[0].value;
  options.forEach((opt, idx) => {
    const ly = height - (idx + 1) * rowH; // local y; option 0 at top
    const b = NSButton.alloc().initWithFrame(NSMakeRect(0, ly, width, rowH - 2));
    b.setButtonType(NSButtonTypeRadio);
    b.setTitle(opt.label);
    b.setState(idx === 0 ? NSOnState : NSOffState);
    b.setCOSJSTargetFunction(() => {
      selected = opt.value; // native radio handles visual exclusivity within this group
      if (onChange) onChange(opt.value);
    });
    group.addSubview(b);
    buttons.push(b);
  });

  return {
    get: () => selected,
    set: (v) => {
      const i = options.findIndex((o) => o.value === v);
      if (i >= 0) {
        buttons[i].setState(NSOnState);
        selected = v;
      }
    },
    view: group,
  };
}

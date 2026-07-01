'use strict';
/**
 * Pure anonymization logic — NO Sketch dependencies, node-testable.
 *
 * Anonymizes text while PRESERVING format:
 *  - case pattern (UPPER / lower / Title / per-char)
 *  - number shape (digit count, separators, sign, leading zeros)
 *  - units are detected and KEPT (configurable per ambiguous token)
 *
 * Styles: 'xx00' | 'lorem' | 'blackout' | 'fromString'
 */

// --- unit knowledge ----------------------------------------------------------

// normalized (lowercase, superscript→digit) known unit tokens.
const KNOWN_UNITS = new Set([
  // length
  'm', 'cm', 'mm', 'km', 'um', 'nm', 'ft', 'in', 'yd', 'mi',
  // volume (plain "m2"/"m3"/"cm3" forms are intentionally NOT here — they are
  // ambiguous with labels like "M2"/"A4" and handled by the ambiguity heuristic;
  // superscript forms (m², cm³) are caught as units separately)
  'l', 'ml', 'cl', 'dl', 'gal',
  // mass
  'g', 'kg', 'mg', 'ug', 't', 'lb', 'oz',
  // time
  's', 'ms', 'us', 'ns', 'min', 'h', 'hr', 'd',
  // frequency
  'hz', 'khz', 'mhz', 'ghz',
  // data
  'b', 'kb', 'mb', 'gb', 'tb', 'kib', 'mib', 'gib', 'bit', 'bps',
  // speed
  'mph', 'kn', 'kmh', 'mps',
  // temperature
  'k', '°c', '°f', '°',
  // electrical
  'a', 'ma', 'v', 'mv', 'kv', 'w', 'kw', 'mw', 'wh', 'kwh', 'mwh', 'ohm', 'va',
  // angle
  'deg', 'rad',
  // typography / web
  'px', 'pt', 'pc', 'em', 'rem', 'vw', 'vh', 'vmin', 'vmax', 'ch', 'dpi', 'ppi',
  // misc
  '%',
]);

// units that are also common words → only treat as unit when adjacent to a number
const UNIT_ALSO_WORD = new Set(['in', 'a', 't', 'd', 'b', 'h', 'm', 's', 'g', 'l', 'k', 'v', 'w']);

const SUPERSCRIPT = { '²': '2', '³': '3', '¹': '1', '⁰': '0', '⁴': '4', '⁵': '5' };
const SUBSCRIPT = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4' };

function hasSuperSub(s) {
  for (const ch of s) if (SUPERSCRIPT[ch] || SUBSCRIPT[ch]) return true;
  return false;
}

function normalizeUnitToken(token) {
  let out = '';
  for (const ch of token) out += SUPERSCRIPT[ch] || SUBSCRIPT[ch] || ch;
  return out.toLowerCase();
}

// --- tokenization ------------------------------------------------------------
// Splits into runs: number | word(letters, may include super/sub) | other(sep/punct).

const RE_NUMBER = /^[+-]?\d[\d.,]*\d|^[+-]?\d/;
const LETTER = /[A-Za-zÀ-ÖØ-öø-ÿ²³¹⁰-₄]/;

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const numMatch = rest.match(RE_NUMBER);
    if (numMatch && /\d/.test(text[i])) {
      tokens.push({ type: 'number', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }
    if (LETTER.test(text[i])) {
      let j = i;
      while (
        j < text.length &&
        (LETTER.test(text[j]) ||
          (j > i && /\d/.test(text[j])) ||
          // keep an internal slash that sits between letters (compound units: m³/s, l/s, km/h)
          (j > i && text[j] === '/' && j + 1 < text.length && LETTER.test(text[j + 1])))
      )
        j++;
      tokens.push({ type: 'alpha', value: text.slice(i, j) });
      i = j;
      continue;
    }
    // separator / punctuation run (single char keeps positions simple)
    tokens.push({ type: 'sep', value: text[i] });
    i++;
  }
  return tokens;
}

// --- classification ----------------------------------------------------------

/** Is this alpha token a unit? Returns 'unit' | 'word' | 'ambiguous'. */
// a unit part: a known unit, or a known base with an area/volume exponent (m³→m3, s²→s2)
function isUnitPart(p) {
  return KNOWN_UNITS.has(p) || (/^.+[23]$/.test(p) && KNOWN_UNITS.has(p.replace(/[23]$/, '')));
}

function classifyAlpha(token, { prevIsNumber = false } = {}) {
  const norm = normalizeUnitToken(token);
  const hasDigit = /\d/.test(token);
  // compound unit (has a slash): every part must be unit-like (so "and/or", "TCP/IP"
  // stay words, but "m³/s", "l/s", "km/h", "W/m²" are units).
  const known = KNOWN_UNITS.has(norm) || (norm.includes('/') && norm.split('/').every(isUnitPart));

  if (known) {
    if (UNIT_ALSO_WORD.has(norm)) return prevIsNumber ? 'unit' : 'ambiguous';
    return 'unit';
  }
  if (hasSuperSub(token)) return 'unit'; // m², cm³ → unit/math
  // letter(s) + trailing digit, e.g. "M2", "A4", "H2" → could be unit (m²) or label
  if (/^[A-Za-z]{1,2}\d{1,2}$/.test(token)) return prevIsNumber ? 'unit' : 'ambiguous';
  // short alpha next to a number, not in list → possible unit
  if (token.length <= 3 && prevIsNumber) return 'ambiguous';
  return 'word';
}

/**
 * Classify all tokens of a string. Returns array of
 * { value, kind: 'word'|'number'|'unit'|'ambiguous'|'sep' }.
 * Number-adjacency is computed left-to-right (also across a single space).
 */
function classifyTokens(text) {
  const toks = tokenize(text);
  let prevSignificant = null; // last non-sep token
  const out = toks.map((t) => {
    if (t.type === 'sep') return { value: t.value, kind: 'sep' };
    if (t.type === 'number') {
      prevSignificant = 'number';
      return { value: t.value, kind: 'number' };
    }
    const prevIsNumber = prevSignificant === 'number';
    const kind = classifyAlpha(t.value, { prevIsNumber });
    prevSignificant = 'alpha';
    return { value: t.value, kind, reason: kind === 'ambiguous' ? unitReason(t.value, prevIsNumber) : undefined };
  });
  return out;
}

function unitReason(token, prevIsNumber) {
  if (/^[A-Za-z]{1,2}\d{1,2}$/.test(token)) return `"${token}" könnte Einheit (z.B. m²/m³) oder Label sein`;
  if (prevIsNumber) return `"${token}" steht hinter einer Zahl — evtl. Einheit`;
  return `"${token}" mehrdeutig`;
}

// --- case + format preservation ---------------------------------------------

function casePattern(word) {
  if (word.length > 1 && word === word.toUpperCase() && /[a-z]/i.test(word)) return 'upper';
  if (word === word.toLowerCase()) return 'lower';
  if (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) return 'title';
  return 'mixed';
}

function applyCase(replacement, pattern) {
  switch (pattern) {
    case 'upper':
      return replacement.toUpperCase();
    case 'title':
      return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
    case 'lower':
      return replacement.toLowerCase();
    default:
      return replacement;
  }
}

/** Replace digits with random digits, preserving separators, sign and leading-zero shape. */
function randomizeNumber(value, rng) {
  const r = rng || Math.random;
  const totalDigits = value.replace(/[^\d]/g, '').length;
  let seenSignificant = false;
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (!/\d/.test(ch)) {
      out += ch; // separators, sign, decimal point preserved
      continue;
    }
    if (ch === '0' && !seenSignificant) {
      out += '0'; // preserve leading zeros (e.g. "007")
      continue;
    }
    if (!seenSignificant && totalDigits > 1) {
      out += String(1 + Math.floor(r() * 9)); // keep no-leading-zero shape
    } else {
      out += String(Math.floor(r() * 10));
    }
    seenSignificant = true;
  }
  return out;
}

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore magna aliqua enim ad minim veniam quis nostrud'.split(' ');

function loremWord(len) {
  // pick the lorem word whose length is closest to len
  let best = LOREM[0];
  let bestDiff = Infinity;
  for (const w of LOREM) {
    const diff = Math.abs(w.length - len);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = w;
    }
  }
  return best;
}

function sourceWords(source) {
  return (source || '').split(/\s+/).map((w) => w.replace(/[^A-Za-zÀ-ÿ]/g, '')).filter(Boolean);
}

function pickFromSource(words, len, rng) {
  if (!words.length) return loremWord(len);
  const exact = words.filter((w) => w.length === len);
  const pool = exact.length ? exact : words;
  const r = rng || Math.random;
  return pool[Math.floor(r() * pool.length)];
}

function anonymizeWord(word, style, ctx) {
  const pattern = casePattern(word);
  switch (style) {
    case 'xx00':
      // per-char: letter→x (case-preserving), other letters handled char-wise
      return word.replace(/[A-Za-zÀ-ÿ]/g, (c) => (c === c.toUpperCase() ? 'X' : 'x'));
    case 'blackout':
      return '█'.repeat(word.length);
    case 'lorem':
      return applyCase(loremWord(word.length), pattern);
    case 'fromString':
      return applyCase(pickFromSource(ctx.sourceWords, word.length, ctx.rng), pattern);
    default:
      return word;
  }
}

// --- main --------------------------------------------------------------------

/**
 * Anonymize a string.
 * @param {string} text
 * @param {object} opts
 *   style: 'xx00'|'lorem'|'blackout'|'fromString'
 *   source: string (for fromString)
 *   keepUnits: boolean (default true) — preserve tokens classified as 'unit'
 *   decideAmbiguous: (tokenValue) => boolean  — true = treat as unit (preserve)
 *   rng: () => number (testing)
 */
function anonymizeString(text, opts = {}) {
  const style = opts.style || 'xx00';
  const keepUnits = opts.keepUnits !== false;
  const decide = opts.decideAmbiguous || (() => false);
  const ctx = { sourceWords: sourceWords(opts.source), rng: opts.rng };
  const classified = classifyTokens(text);

  return classified
    .map((t) => {
      if (t.kind === 'sep') return t.value;
      if (t.kind === 'number') return style === 'blackout' ? '█'.repeat(t.value.replace(/[^\d]/g, '').length) : randomizeNumber(t.value, opts.rng);
      if (t.kind === 'unit' && keepUnits) return t.value;
      if (t.kind === 'ambiguous' && decide(t.value)) return t.value; // user said: it's a unit
      return anonymizeWord(t.value, style, ctx);
    })
    .join('');
}

/** Collect distinct ambiguous tokens across many strings, for the review panel. */
function collectAmbiguous(strings) {
  const map = new Map();
  strings.forEach((s) => {
    classifyTokens(s).forEach((t) => {
      if (t.kind === 'ambiguous' && !map.has(t.value)) map.set(t.value, t.reason || 'mehrdeutig');
    });
  });
  return Array.from(map, ([value, reason]) => ({ value, reason }));
}

export {
  KNOWN_UNITS,
  normalizeUnitToken,
  tokenize,
  classifyAlpha,
  classifyTokens,
  casePattern,
  applyCase,
  randomizeNumber,
  anonymizeWord,
  anonymizeString,
  collectAmbiguous,
};

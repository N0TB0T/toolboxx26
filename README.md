# ToolBoxx

Sketch productivity tools — public release.

## Download

[ToolBoxx-1.1.2-20260714.zip](https://github.com/N0TB0T/toolboxx26/raw/main/ToolBoxx-1.1.2-20260714.zip)

## Installation

1. Zip-Datei herunterladen
2. Entzippen — es erscheint `ToolBoxx.sketchplugin`
3. Doppelklick auf die `.sketchplugin`-Datei — Sketch installiert das Plugin automatisch

## Automatische Updates

Nach der Installation benachrichtigt Sketch automatisch, wenn eine neue Version verfügbar ist, und bietet die Installation an — kein manueller Download nötig.

## Funktionen

| Tool | Shortcut | Was es tut |
|---|---|---|
| Anonymize | `ctrl shift x` | Anonymisiert Text- und Symbol-Override-Inhalte formaterhaltend (Xxx 00 / Lorem / Blackout / aus Text). Erkennt Einheiten und lässt sie stehen; mehrdeutige Tokens werden im Review-Panel abgefragt (mit ↗ Sprung zur Fundstelle im Canvas). |
| Contrast Measure | `ctrl shift k` | Misst WCAG-2.1-Kontrast (+ ΔE2000-Farbabstand) für ein Vorder-/Hintergrund-Paar. Farben per Ein-Klick-Screen-Pipette, Hex oder aus der Selektion (Overrides + Symbol-Farben mit Swatch-Namen, inkl. Library). Ergebnis kopierbar. |

## Versionshistorie

### 1.1.2 (2026-07-14)

- Performance-Verbesserungen im Contrast-Panel bei längeren Sessions (Render-Loop-Optimierung).

### 1.1.1 (2026-07-13)

- Neu: **Contrast Measure** — WCAG-2.1-Kontrast + Farbabstand (ΔE2000). Farbwahl per Ein-Klick-Screen-Pipette, Hex oder aus der Selektion (Overrides + Symbol-Farben mit Swatch-Namen, inkl. Library).

### 1.0.0 (2026-07-01)

- Erstes öffentliches Release: **Anonymize** — formaterhaltende Anonymisierung von Text- und Symbol-Override-Inhalten.

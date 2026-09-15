# ToolBoxx

Sketch productivity tools — public release.

## Download

[ToolBoxx-1.2.1-20260915.zip](https://github.com/N0TB0T/toolboxx26/raw/main/ToolBoxx-1.2.1-20260915.zip)

## Installation

1. Zip-Datei herunterladen
2. Entzippen — es erscheint `ToolBoxx.sketchplugin`
3. Doppelklick auf die `.sketchplugin`-Datei — Sketch installiert das Plugin automatisch

## Automatische Updates

Nach der Installation benachrichtigt Sketch automatisch, wenn eine neue Version verfügbar ist, und bietet die Installation an — kein manueller Download nötig.

## Funktionen

| Tool | Shortcut | Was es tut |
|---|---|---|
| Smart Select | `ctrl shift s` | Findet und selektiert Ebenen nach ihren Eigenschaften: Farben (mit Swatch-Namen, auch aus Libraries), Overrides, Symbol-Master, Groessen und Textinhalte. Filterbare Tabelle statt Suche im Ebenenbaum. |
| Anonymize | `ctrl shift x` | Anonymisiert Text- und Symbol-Override-Inhalte formaterhaltend (Xxx 00 / Lorem / Blackout / aus Text). Erkennt Einheiten und lässt sie stehen; mehrdeutige Tokens werden im Review-Panel abgefragt (mit ↗ Sprung zur Fundstelle im Canvas). |
| Contrast Measure | `ctrl shift k` | Misst WCAG-2.1-Kontrast (+ ΔE2000-Farbabstand) für ein Vorder-/Hintergrund-Paar. Farben per Ein-Klick-Screen-Pipette, Hex oder aus der Selektion (Overrides + Symbol-Farben mit Swatch-Namen, inkl. Library). Ergebnis kopierbar. |

## Versionshistorie

### 1.2.1 (2026-09-15)

- Fix: **Smart Select** liess sich nach einem Abbruch nicht mehr schliessen — das Fenster blieb stehen, seine Knoepfe reagierten nicht, und Sketch war nur per Force Quit wieder nutzbar. Jeder Rueckweg schliesst das Panel jetzt, bevor er aufraeumt.
- Fix: **Smart Select** durchsuchte alle Seiten, konnte aber nur auf der aktuellen auswaehlen — Treffer auf anderen Seiten wurden gezaehlt und dann verworfen. Der Bereich heisst jetzt ehrlich \u201ePage\u201c und durchsucht genau die.
- Fix: **Smart Select** — der Umschalter \u201egek\u00fcrzt / vollst\u00e4ndig\u201c blieb bei Override-Zeilen wirkungslos; der volle Pfad stand nur im Tooltip.
- Intern: 14 stumme Fehlerpfade in den Panels von Anonymize und Contrast Measure melden sich jetzt im Log, statt Fehler zu verschlucken.

### 1.2.0 (2026-09-15)

- Neu: **Smart Select** — Ebenen nach ihren Eigenschaften finden und auswaehlen, statt sie im Ebenenbaum zu suchen. Zeigt Farben mit ihrem Swatch-Namen (auch aus Libraries), Overrides und Symbol-Eigenschaften in einer filterbaren Tabelle.

### 1.1.2 (2026-07-14)

- Fix: seltener Absturz, wenn das Contrast-Panel länger offen blieb (interne View wurde vom Render-Loop unsauber aufgerufen). Jetzt stabil.

### 1.1.1 (2026-07-13)

- Neu: **Contrast Measure** — WCAG-2.1-Kontrast + Farbabstand (ΔE2000). Farbwahl per Ein-Klick-Screen-Pipette, Hex oder aus der Selektion (Overrides + Symbol-Farben mit Swatch-Namen, inkl. Library).

### 1.0.0 (2026-07-01)

- Erstes öffentliches Release: **Anonymize** — formaterhaltende Anonymisierung von Text- und Symbol-Override-Inhalten.

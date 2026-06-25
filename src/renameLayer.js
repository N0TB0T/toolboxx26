const sketch = require('sketch');

/**
 * Rename Layer After Content — benennt ausgewählte Ebenen nach dem Symbol, das sie enthalten.
 *
 * Verhalten:
 *  - SymbolInstance: → Name des SymbolMasters
 *  - SymbolMaster: → eigener Name des Masters
 *  - Gruppe/Frame mit direkten Symbol-Kindern (Instance oder Master): → Name des ersten
 *  - Alles andere: übersprungen
 */

export default function() {
    const doc = sketch.getSelectedDocument();
    if (!doc) {
        sketch.UI.message('Kein Dokument geöffnet.');
        return;
    }

    const selection = doc.selectedLayers.layers;
    if (!selection || selection.length === 0) {
        sketch.UI.message('Keine Ebenen ausgewählt.');
        return;
    }

    let renamed = 0;
    let skipped = 0;

    console.log(`[renameLayer] ${selection.length} Ebene(n) ausgewählt`);

    for (const layer of selection) {
        console.log(`[renameLayer] Layer: "${layer.name}" type="${layer.type}"`);
        const newName = resolveSymbolName(layer);
        console.log(`[renameLayer]   → resolveSymbolName: ${JSON.stringify(newName)}`);
        if (newName !== null) {
            if (newName !== layer.name) {
                layer.name = newName;
                renamed++;
                console.log(`[renameLayer]   ✓ umbenannt → "${newName}"`);
            }
        } else {
            skipped++;
        }
    }

    if (renamed > 0) {
        const skipNote = skipped > 0 ? `, ${skipped} ohne Symbol übersprungen` : '';
        sketch.UI.message(`${renamed} Ebene(n) umbenannt${skipNote}.`);
    } else if (skipped > 0) {
        sketch.UI.message(`Keine Ebenen umbenannt — ${skipped} enthalten kein Symbol.`);
    } else {
        sketch.UI.message('Alle Namen sind bereits aktuell.');
    }
}

/**
 * Gibt den neuen Namen zurück, oder null wenn die Ebene kein Symbol enthält.
 */
function resolveSymbolName(layer) {
    // 1. Die Ebene selbst ist eine SymbolInstance → Master-Name
    if (layer.type === 'SymbolInstance') {
        return getMasterName(layer);
    }

    // 2. Die Ebene selbst ist ein SymbolMaster → eigener Name
    if (layer.type === 'SymbolMaster') {
        return layer.name ? String(layer.name) : null;
    }

    // 3. Gruppe/Frame/Artboard: erstes direktes Kind das Instance oder Master ist
    if (layer.layers && layer.layers.length > 0) {
        console.log(`[renameLayer]   Gruppe mit ${layer.layers.length} Kindern, types: ${layer.layers.slice(0,5).map(l => l.type).join(', ')}`);
        const erstesSymbol = layer.layers.find(function(l) {
            return l.type === 'SymbolInstance' || l.type === 'SymbolMaster';
        });

        if (erstesSymbol) {
            if (erstesSymbol.type === 'SymbolInstance') {
                return getMasterName(erstesSymbol);
            }
            return erstesSymbol.name ? String(erstesSymbol.name) : null;
        }
    }

    return null;
}

/**
 * Gibt den Master-Namen einer SymbolInstance zurück, oder null.
 */
function getMasterName(instance) {
    try {
        const master = instance.getSymbolMaster?.() || instance.master;
        console.log(`[renameLayer]   getMasterName: master=${master ? master.name : 'null'}`);
        if (master && master.name) {
            return String(master.name);
        }
    } catch (e) {
        console.log(`[renameLayer]   getMasterName JS-API Fehler: ${e}`);
    }

    try {
        const nativeInstance = instance.sketchObject;
        if (nativeInstance) {
            let nativeMaster = null;
            try { nativeMaster = nativeInstance.symbolMaster(); } catch (e) { console.log(`[renameLayer]   nativeInstance.symbolMaster() Fehler: ${e}`); }
            if (nativeMaster) {
                let name = null;
                try { name = String(nativeMaster.name()); } catch (e) {}
                if (!name) { try { name = String(nativeMaster.name); } catch (e) {} }
                console.log(`[renameLayer]   native master name: ${name}`);
                if (name) return name;
            }
        }
    } catch (e) {
        console.log(`[renameLayer]   getMasterName native Fehler: ${e}`);
    }

    return null;
}

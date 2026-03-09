/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Custom Jest environment che rende window.location (e window.window) mockabile.
 *
 * JSDOM 26+ marca queste proprietà come [LegacyUnforgeable] con configurable: false,
 * impedendo ai test di sovrascriverle. Questo environment patcha temporaneamente
 * il file Window.js di JSDOM per renderle configurabili.
 */

const path = require('path');
const Module = require('module');
const windowJsPath = path.join('jsdom', 'lib', 'jsdom', 'browser', 'Window.js').replace(/\\/g, '/');

let patched = false;

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const result = originalLoad.call(this, request, parent, isMain);

  if (!patched && parent && parent.filename) {
    const normalizedParent = parent.filename.replace(/\\/g, '/');
    if (normalizedParent.includes(windowJsPath)) {
      // Siamo nel contesto di Window.js - non possiamo patchare il require direttamente
      // Usiamo un approccio diverso
    }
  }

  return result;
};

// Ripristina il loader originale - questo approccio non funziona per patchare
Module._load = originalLoad;

// Approccio alternativo: patchare Object.defineProperties nel contesto del JSDOM
const { default: JsdomEnvironment } = require('jest-environment-jsdom');

class JsdomWithMockableLocationEnvironment extends JsdomEnvironment {
  constructor(config, context) {
    // Prima di chiamare super(), patcha Object.defineProperties temporaneamente
    // per intercettare la definizione di location come non-configurabile
    const originalDefineProperties = Object.defineProperties;

    Object.defineProperties = function (obj, props) {
      // Se stiamo definendo location, window, document, top su un oggetto Window
      if (props && props.location && props.location.configurable === false) {
        // Rendi location e window configurabili
        const patchedProps = { ...props };
        if (patchedProps.location) {
          patchedProps.location = { ...patchedProps.location, configurable: true };
        }
        if (patchedProps.window) {
          patchedProps.window = { ...patchedProps.window, configurable: true };
        }
        return originalDefineProperties.call(this, obj, patchedProps);
      }
      return originalDefineProperties.call(this, obj, props);
    };

    try {
      super(config, context);
    } finally {
      // Ripristina Object.defineProperties
      Object.defineProperties = originalDefineProperties;
    }
  }
}

module.exports = JsdomWithMockableLocationEnvironment;

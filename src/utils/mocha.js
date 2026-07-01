'use strict';
/**
 * Create an NSObject delegate whose selectors are backed by JS functions.
 * Shared helper — avoids re-inlining MochaJSDelegate per command.
 * Existing inline copies (inspectSymbolOrigin.js etc.) can migrate to this later.
 */
export function MochaJSDelegate(selectorHandlerDict) {
  const uniqueClassName = 'MochaJSDelegate_DynamicClass_' + NSUUID.UUID().UUIDString();
  const desc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, NSObject);
  desc.registerClass();
  Object.keys(selectorHandlerDict).forEach((selectorString) => {
    desc.addInstanceMethodWithSelector_function_(
      NSSelectorFromString(selectorString),
      selectorHandlerDict[selectorString]
    );
  });
  return NSClassFromString(uniqueClassName).new();
}

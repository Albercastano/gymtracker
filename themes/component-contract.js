"use strict";
(function(){
  const VERSION="0.1.0";
  const definitions=Object.freeze({
    button:Object.freeze({className:"phx-button",variants:Object.freeze(["primary","secondary","danger","neutral","material","profile"])}),
    surface:Object.freeze({className:"phx-surface",variants:Object.freeze(["card","panel","rail","inset"])}),
    input:Object.freeze({className:"phx-input",variants:Object.freeze(["text","select","textarea","toggle"])}),
    chip:Object.freeze({className:"phx-chip",variants:Object.freeze(["neutral","active","success","warning","danger"])}),
    metric:Object.freeze({className:"phx-metric",variants:Object.freeze(["standard","hero"])}),
    progress:Object.freeze({className:"phx-progress",variants:Object.freeze(["standard","success","warning"])}),
    label:Object.freeze({className:"phx-label",variants:Object.freeze(["eyebrow","caption"])}),
    timer:Object.freeze({className:"phx-timer",variants:Object.freeze(["precision","foundry"])}),
  });
  const allowedBase=new Set(Object.values(definitions).map(item=>item.className));
  function isSemanticClass(value){return typeof value==="string"&&(allowedBase.has(value)||value.startsWith("phx-button--")||value.startsWith("phx-surface--")||value.startsWith("phx-input--")||value.startsWith("phx-chip--")||value.startsWith("phx-metric--")||value.startsWith("phx-progress--")||value.startsWith("phx-label--")||value.startsWith("phx-timer--"))}
  window.PhoenixComponentContract=Object.freeze({version:VERSION,definitions,isSemanticClass});
})();

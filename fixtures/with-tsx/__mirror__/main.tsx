import {text as text2} from "/text.ts?namespace=file";
function jsx(t, p, children) {
  var node = document.createElement(t);
  var textNode = document.createTextNode(children || p.children);
  node.appendChild(textNode);
  document.body.appendChild(node);
}
let x = /* @__PURE__ */ jsx("div", null, text2);

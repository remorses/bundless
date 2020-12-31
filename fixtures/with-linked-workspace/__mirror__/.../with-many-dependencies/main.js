import slash_cjsImport0 from "/web_modules/node_modules/slash/index.js?namespace=file";
const slash = slash_cjsImport0 && slash_cjsImport0.__esModule ? slash_cjsImport0.default : slash_cjsImport0;
import react_cjsImport1 from "/web_modules/fixtures/with-many-dependencies/node_modules/react/index.js?namespace=file";
const React = react_cjsImport1 && react_cjsImport1.__esModule ? react_cjsImport1.default : react_cjsImport1;
import { useState } from '/web_modules/fixtures/with-many-dependencies/node_modules/preact/hooks/dist/hooks.module.js?namespace=file'
import reactDom_cjsImport3 from "/web_modules/fixtures/with-many-dependencies/node_modules/react-dom/index.js?namespace=file";
const ReactDom = reactDom_cjsImport3 && reactDom_cjsImport3.__esModule ? reactDom_cjsImport3.default : reactDom_cjsImport3;

console.log('Hello world!')
console.log(slash)
console.log(React.useState)
console.log(useState)
console.log(ReactDom.render)

export const variable = 10

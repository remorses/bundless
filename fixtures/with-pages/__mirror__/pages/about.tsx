
import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client';
import.meta.hot = __HMR__.createHotContext(import.meta.url);
var _s = $RefreshSig$();

const __this_path__ = "/Users/morse/Documents/GitHub/espack/fixtures/with-pages/pages/about.tsx";
import RefreshRuntime from "/_react-refresh-runtime_?namespace=react-refresh-runtime";
let prevRefreshReg;
let prevRefreshSig;

if (!window.__bundless_plugin_react_preamble_installed__) {
  throw new Error("bundless-plugin-react can't detect preamble. Something is wrong.");
}

if (import.meta.hot) {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;

  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __this_path__ + " " + id);
  };

  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}

import react_cjsImport2 from "/web_modules/react/index.js?namespace=file";
const React = react_cjsImport2 && react_cjsImport2.__esModule ? react_cjsImport2.default : react_cjsImport2;
const useEffect = react_cjsImport2["useEffect"];
const useState = react_cjsImport2["useState"];;
export default function Page() {
  _s();

  const [state, setState] = useState("");
  useEffect(() => {
    setTimeout(() => {
      setState("Dynamic content!");
    }, 1e3);
  }, []);
  return /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("p", null, "About me:"), /* @__PURE__ */React.createElement("p", null, "I Am Me"), /* @__PURE__ */React.createElement("p", null, "..."), /* @__PURE__ */React.createElement("p", null, "cool"), /* @__PURE__ */React.createElement("br", null), /* @__PURE__ */React.createElement("p", null, state));
}

_s(Page, "Z9hTlZ+NcQz32JPuAL7cN+c9jIA=");

_c = Page;
console.log("loaded");

var _c;

$RefreshReg$(_c, "Page");
if (import.meta.hot) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;

  import.meta.hot.accept();
  if (!window.__bundless_plugin_react_timeout) {
    window.__bundless_plugin_react_timeout = setTimeout(() => {
      window.__bundless_plugin_react_timeout = 0;
      RefreshRuntime.performReactRefresh();
    }, 30);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXBhZ2VzL3BhZ2VzL2Fib3V0LnRzeCIsImZpbGUudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBQSxhQUFBLEdBQUEsMEVBQUE7QUFFQSxPQUFBLGNBQUEsTUFBQSwwREFBQTtBQUVJLElBQUEsY0FBQTtBQUNJLElBQUEsY0FBQTs7QUFDYSxJQUFBLENBQUEsTUFDVixDQUFBLDRDQURVLEVBQ1Y7QUFBQSxRQUNKLElBQUEsS0FBQSxDQUNILGtFQURHLENBREk7QUFjWDs7Ozs7Ozs7Ozs7OztBQXJCQSxPQUFBLEtBQUEsSUFBQSxTQUFBLEVBQUEsUUFBQSxRQUFBLE9BQUE7QUFFQSxlQUFBLFNBQUEsSUFBQSxHQUFBO0FBQUE7O0FBQ0ksUUFBTSxDQUFBLEtBQUEsRUFBQSxRQUFBLElBQW9CLFFBQUEsQ0FBUyxFQUFULENBQTFCO0FBQ0EsRUFBQSxTQUFBLENBQVUsTUFBQTtBQUNOLElBQUEsVUFBQSxDQUFXLE1BQUE7QUFDUCxNQUFBLFFBQUEsQ0FBUyxrQkFBVCxDQUFBO0FBQVMsS0FEYixFQUVHLEdBRkgsQ0FBQTtBQUVHLEdBSFAsRUFJRyxFQUpILENBQUE7QUFLQSxTQUNJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxLQUFELEVBQUEsSUFBQSxFQUNJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxHQUFELEVBQUEsSUFBQSxFQUFHLFdBQUgsQ0FESixFQUVJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxHQUFELEVBQUEsSUFBQSxFQUFHLFNBQUgsQ0FGSixFQUdJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxHQUFELEVBQUEsSUFBQSxFQUFHLEtBQUgsQ0FISixFQUlJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxHQUFELEVBQUEsSUFBQSxFQUFHLE1BQUgsQ0FKSixFQUtJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxJQUFELEVBQUEsSUFBQSxDQUxKLEVBTUksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLEdBQUQsRUFBQSxJQUFBLEVBQUksS0FBSixDQU5KLENBREo7QUFPWTs7R0FkaEI7O0tBQUE7QUFtQkEsT0FBQSxDQUFRLEdBQVIsQ0FBWSxRQUFaIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUGFnZSgpIHtcbiAgICBjb25zdCBbc3RhdGUsIHNldFN0YXRlXSA9IHVzZVN0YXRlKCcnKVxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2V0U3RhdGUoJ0R5bmFtaWMgY29udGVudCEnKVxuICAgICAgICB9LCAxMDAwKVxuICAgIH0sIFtdKVxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8cD5BYm91dCBtZTo8L3A+XG4gICAgICAgICAgICA8cD5JIEFtIE1lPC9wPlxuICAgICAgICAgICAgPHA+Li4uPC9wPlxuICAgICAgICAgICAgPHA+Y29vbDwvcD5cbiAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgPHA+e3N0YXRlfTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgKVxufVxuXG5jb25zb2xlLmxvZygnbG9hZGVkJylcbiIsbnVsbF19
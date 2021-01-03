
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXBhZ2VzL3BhZ2VzL2Fib3V0LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQUEsYUFBQSxHQUFBLDBFQUFBO0FBRUEsT0FBQSxjQUFBLE1BQUEsMERBQUE7QUFFSSxJQUFBLGNBQUE7QUFDSSxJQUFBLGNBQUE7O0FBQ2EsSUFBQSxDQUFBLE1BQ1YsQ0FBQSw0Q0FEVSxFQUNWO0FBQUEsUUFDSixJQUFBLEtBQUEsQ0FDSCxrRUFERyxDQURJO0FBY1g7Ozs7Ozs7Ozs7Ozs7QUFyQkEsT0FBQSxLQUFBLElBQUEsU0FBQSxFQUFBLFFBQUEsUUFBQSxPQUFBO0FBRUEsZUFBQSxTQUFBLElBQUEsR0FBQTtBQUFBOztBQUNJLFFBQU0sQ0FBQSxLQUFBLEVBQUEsUUFBQSxJQUFvQixRQUFBLENBQVMsRUFBVCxDQUExQjtBQUNBLEVBQUEsU0FBQSxDQUFVLE1BQUE7QUFDTixJQUFBLFVBQUEsQ0FBVyxNQUFBO0FBQ1AsTUFBQSxRQUFBLENBQVMsa0JBQVQsQ0FBQTtBQUFTLEtBRGIsRUFFRyxHQUZILENBQUE7QUFFRyxHQUhQLEVBSUcsRUFKSCxDQUFBO0FBS0EsU0FDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsS0FBRCxFQUFBLElBQUEsRUFDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBLElBQUEsRUFBRyxXQUFILENBREosRUFFSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBLElBQUEsRUFBRyxTQUFILENBRkosRUFHSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBLElBQUEsRUFBRyxLQUFILENBSEosRUFJSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBLElBQUEsRUFBRyxNQUFILENBSkosRUFLSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsSUFBRCxFQUFBLElBQUEsQ0FMSixFQU1JLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxHQUFELEVBQUEsSUFBQSxFQUFJLEtBQUosQ0FOSixDQURKO0FBT1k7O0dBZGhCOztLQUFBO0FBbUJBLE9BQUEsQ0FBUSxHQUFSLENBQVksUUFBWiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFBhZ2UoKSB7XG4gICAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZSgnJylcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNldFN0YXRlKCdEeW5hbWljIGNvbnRlbnQhJylcbiAgICAgICAgfSwgMTAwMClcbiAgICB9LCBbXSlcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHA+QWJvdXQgbWU6PC9wPlxuICAgICAgICAgICAgPHA+SSBBbSBNZTwvcD5cbiAgICAgICAgICAgIDxwPi4uLjwvcD5cbiAgICAgICAgICAgIDxwPmNvb2w8L3A+XG4gICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgIDxwPntzdGF0ZX08L3A+XG4gICAgICAgIDwvZGl2PlxuICAgIClcbn1cblxuY29uc29sZS5sb2coJ2xvYWRlZCcpXG4iXX0=
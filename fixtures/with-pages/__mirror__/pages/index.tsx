
import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client';
import.meta.hot = __HMR__.createHotContext(import.meta.url);
const __this_path__ = "/Users/morse/Documents/GitHub/espack/fixtures/with-pages/pages/index.tsx";
import RefreshRuntime from "/_react-refresh-runtime_.js?namespace=react-refresh-runtime";
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
const React = react_cjsImport2 && react_cjsImport2.__esModule ? react_cjsImport2.default : react_cjsImport2;;
import { Link } from "/web_modules/react-router-dom/esm/react-router-dom.js?namespace=file";
export default function Page() {
  return /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("p", null, "Ciao"), /* @__PURE__ */React.createElement("a", {
    href: "/about"
  }, "/about with a"), /* @__PURE__ */React.createElement("br", null), /* @__PURE__ */React.createElement(Link, {
    to: "/about"
  }, "/about with Link"), /* @__PURE__ */React.createElement("p", null, "hello"));
}
_c = Page;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXBhZ2VzL3BhZ2VzL2luZGV4LnRzeCIsImZpbGUudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQUEsYUFBQSxHQUFBLDBFQUFBO0FBQ0EsT0FBQSxjQUFBLE1BQUEsNkJBQUE7QUFHSSxJQUFBLGNBQUE7QUFHUSxJQUFHLGNBQUg7O0FBRUEsSUFBTSxDQUFBLE1BQUcsQ0FBQSw0Q0FBVCxFQUFTO0FBQUEsUUFBUyxJQUFBLEtBQUEsQ0FDZixrRUFEZSxDQUFUOzs7Ozs7Ozs7Ozs7OztBQVRyQixPQUFBLEtBQUEsTUFBQSxPQUFBO0FBQ0EsU0FBQSxJQUFBLFFBQUEsa0JBQUE7QUFFQSxlQUFBLFNBQUEsSUFBQSxHQUFBO0FBQ0ksU0FDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsS0FBRCxFQUFBLElBQUEsRUFDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBLElBQUEsRUFBRyxNQUFILENBREosRUFFSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBO0FBQUcsSUFBQSxJQUFBLEVBQUs7QUFBUixHQUFBLEVBQWlCLGVBQWpCLENBRkosRUFHSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsSUFBRCxFQUFBLElBQUEsQ0FISixFQUlJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxJQUFELEVBQUE7QUFBTSxJQUFBLEVBQUEsRUFBRztBQUFULEdBQUEsRUFBa0Isa0JBQWxCLENBSkosRUFLSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsR0FBRCxFQUFBLElBQUEsRUFBRyxPQUFILENBTEosQ0FESjtBQU1XO0tBUGYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBMaW5rIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUGFnZSgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHA+Q2lhbzwvcD5cbiAgICAgICAgICAgIDxhIGhyZWY9Jy9hYm91dCc+L2Fib3V0IHdpdGggYTwvYT5cbiAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgPExpbmsgdG89Jy9hYm91dCc+L2Fib3V0IHdpdGggTGluazwvTGluaz5cbiAgICAgICAgICAgIDxwPmhlbGxvPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICApXG59XG4iLG51bGxdfQ==
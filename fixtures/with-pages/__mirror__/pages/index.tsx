
import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client';
import.meta.hot = __HMR__.createHotContext(import.meta.url);
const __this_path__ = "/Users/morse/Documents/GitHub/espack/fixtures/with-pages/pages/index.tsx";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXBhZ2VzL3BhZ2VzL2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFBLGFBQUEsR0FBQSwwRUFBQTtBQUNBLE9BQUEsY0FBQSxNQUFBLDBEQUFBO0FBR0ksSUFBQSxjQUFBO0FBR1EsSUFBRyxjQUFIOztBQUVBLElBQU0sQ0FBQSxNQUFHLENBQUEsNENBQVQsRUFBUztBQUFBLFFBQVMsSUFBQSxLQUFBLENBQ2Ysa0VBRGUsQ0FBVDs7Ozs7Ozs7Ozs7Ozs7QUFUckIsT0FBQSxLQUFBLE1BQUEsT0FBQTtBQUNBLFNBQUEsSUFBQSxRQUFBLGtCQUFBO0FBRUEsZUFBQSxTQUFBLElBQUEsR0FBQTtBQUNJLFNBQ0ksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLEtBQUQsRUFBQSxJQUFBLEVBQ0ksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLEdBQUQsRUFBQSxJQUFBLEVBQUcsTUFBSCxDQURKLEVBRUksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLEdBQUQsRUFBQTtBQUFHLElBQUEsSUFBQSxFQUFLO0FBQVIsR0FBQSxFQUFpQixlQUFqQixDQUZKLEVBR0ksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLElBQUQsRUFBQSxJQUFBLENBSEosRUFJSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsSUFBRCxFQUFBO0FBQU0sSUFBQSxFQUFBLEVBQUc7QUFBVCxHQUFBLEVBQWtCLGtCQUFsQixDQUpKLEVBS0ksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLEdBQUQsRUFBQSxJQUFBLEVBQUcsT0FBSCxDQUxKLENBREo7QUFNVztLQVBmIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTGluayB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFBhZ2UoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxwPkNpYW88L3A+XG4gICAgICAgICAgICA8YSBocmVmPScvYWJvdXQnPi9hYm91dCB3aXRoIGE8L2E+XG4gICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgIDxMaW5rIHRvPScvYWJvdXQnPi9hYm91dCB3aXRoIExpbms8L0xpbms+XG4gICAgICAgICAgICA8cD5oZWxsbzwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgKVxufVxuIl19
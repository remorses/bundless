
import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client';
import.meta.hot = __HMR__.createHotContext(import.meta.url);
var _s = $RefreshSig$(),
    _s2 = $RefreshSig$();

const __this_path__ = "/Users/morse/Documents/GitHub/espack/fixtures/with-pages/_bundless_paged_routes_.jsx";
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

var __defProp = Object.defineProperty;

var __publicField = (obj, key, value) => {
  if (typeof key !== "symbol") key += "";
  if (key in obj) return __defProp(obj, key, {
    enumerable: true,
    configurable: true,
    writable: true,
    value
  });
  return obj[key] = value;
};

import react_cjsImport2 from "/web_modules/react/index.js?namespace=file";
const React = react_cjsImport2 && react_cjsImport2.__esModule ? react_cjsImport2.default : react_cjsImport2;;
import { Switch, Route, useLocation } from "/web_modules/react-router-dom/esm/react-router-dom.js?namespace=file";
import { useMahoContext, MahoContext } from "/.../.../paged/src/client/index.ts?namespace=file";
const Suspense = React.Suspense;
let Route_about_tsx;
let load_about_tsx;

if (true) {
  Route_about_tsx = React.lazy(() => import('/pages/about.tsx?namespace=file'));
} else {
  const res = require("./pages/about.tsx");

  Route_about_tsx = res.default;
  load_about_tsx = res.load;
}

let Route_index_tsx;
let load_index_tsx;

if (true) {
  Route_index_tsx = React.lazy(() => import('/pages/index.tsx?namespace=file'));
} else {
  const res = require("./pages/index.tsx");

  Route_index_tsx = res.default;
  load_index_tsx = res.load;
}

const NotFound = () => {
  _s();

  const context = useMahoContext();

  if (context) {
    context.statusCode = 404;
  }

  return /* @__PURE__ */React.createElement("div", null, "404");
};

_s(NotFound, "MH/UE+7rkh6OqFk0ZRTbnUIGqsY=", false, function () {
  return [useMahoContext];
});

_c = NotFound;
export const loadFunctions = void 0;
export const Routes = () => {
  _s2();

  if (true) {
    const location = useLocation();
    React.useEffect(() => {
      const state = window.INITIAL_STATE;
      state.revalidateOnMount = true;
    }, [location.pathname]);
  }

  return /* @__PURE__ */React.createElement(Switch, null, /* @__PURE__ */React.createElement(Route, {
    path: "/about",
    component: Route_about_tsx
  }), /* @__PURE__ */React.createElement(Route, {
    path: "/",
    component: Route_index_tsx
  }), /* @__PURE__ */React.createElement(Route, {
    path: "*",
    component: NotFound
  }));
};

_s2(Routes, "BXcZrDMM76mmm4zA8/QV5UbMNXE=", false, function () {
  return [useLocation];
});

_c2 = Routes;

class ErrorBoundary extends React.Component {
  constructor() {
    super(...arguments);

    __publicField(this, "state", {
      error: null
    });

    __publicField(this, "tryAgain", () => this.setState({
      error: null
    }));
  }

  static getDerivedStateFromError(error) {
    return {
      error
    };
  }

  componentDidCatch() {}

  render() {
    return this.state.error ? /* @__PURE__ */React.createElement("div", null, "There was an error. ", /* @__PURE__ */React.createElement("button", {
      onClick: this.tryAgain
    }, "try again"), /* @__PURE__ */React.createElement("pre", {
      style: {
        whiteSpace: "normal"
      }
    }, this.state.error.message)) : this.props.children;
  }

}

export const App = ({
  context,
  Router
}) => {
  return /* @__PURE__ */React.createElement(MahoContext.Provider, {
    value: context
  }, /* @__PURE__ */React.createElement(ErrorBoundary, null, /* @__PURE__ */React.createElement(Suspense, {
    fallback: /* @__PURE__ */React.createElement("div", null, "Loading...")
  }, /* @__PURE__ */React.createElement(Router, {
    location: context.url
  }, /* @__PURE__ */React.createElement(Routes, null)))));
};
_c3 = App;

var _c, _c2, _c3;

$RefreshReg$(_c, "NotFound");
$RefreshReg$(_c2, "Routes");
$RefreshReg$(_c3, "App");
if (import.meta.hot) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;

  
  if (!window.__bundless_plugin_react_timeout) {
    window.__bundless_plugin_react_timeout = setTimeout(() => {
      window.__bundless_plugin_react_timeout = 0;
      RefreshRuntime.performReactRefresh();
    }, 30);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXBhZ2VzL19idW5kbGVzc19wYWdlZF9yb3V0ZXNfLmpzeCIsImZpbGUudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztrQkFDQTtBQUVBOztBQUtRLElBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxFQUFBLGNBQUEsR0FBQSxNQUFBLENBQUEsWUFBQTtBQUNBLEVBQUEsY0FBSSxHQUFBLE1BQUEsQ0FBQSxZQUFKOztBQUNJLEVBQUEsTUFBQSxDQUFBLFlBQUEsR0FBa0IsQ0FBQSxJQUFBLEVBQVcsRUFBWCxLQUF3QjtBQUFBLElBQUEsY0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLEVBQUEsYUFBQSxHQUFBLEdBQUEsR0FBQSxFQUFBO0FBRTFDLEdBRkE7O0FBR0EsRUFBQSxNQUFBLENBQUEsWUFBQSxHQUFzQixjQUFBLENBQUEsbUNBQXRCO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQWRaLE9BQUEsS0FBQSxNQUFBLE9BQUE7QUFDQSxTQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsV0FBQSxRQUFBLGtCQUFBO0FBQ0EsU0FBQSxjQUFBLEVBQUEsV0FBQSxRQUFBLHlDQUFBO0FBRUEsTUFBTSxRQUFBLEdBQTZCLEtBQUEsQ0FBTSxRQUF6QztBQUdRLElBQUEsZUFBQTtBQUNBLElBQUEsY0FBQTs7QUFDQSxJQUFJLElBQUosRUFBSTtBQUNBLEVBQUEsZUFBQSxHQUFrQixLQUFBLENBQU0sSUFBTixDQUFXLE1BQWEsT0FBQSxtQkFBQSxDQUF4QixDQUFsQjtBQUEwQyxDQUQ5QyxNQUM4QztBQUUxQyxRQUFBLEdBQUEsR0FBWSxPQUFBLENBQVEsbUJBQVIsQ0FBWjs7QUFDQSxFQUFBLGVBQUEsR0FBa0IsR0FBQSxDQUFJLE9BQXRCO0FBQ0EsRUFBQSxjQUFBLEdBQWlCLEdBQUEsQ0FBSSxJQUFyQjtBQUFxQjs7QUFJekIsSUFBQSxlQUFB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QUEsRUFBWTtBQUFiO0FBQVosS0FBQSxFQUFxQyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLE9BQXRELENBRkosQ0FERyxHQU1ILEtBQUssS0FBTCxDQUFXLFFBTmY7QUFNZTs7QUFoQlc7O0FBcUIzQixPQUFBLE1BQUEsR0FBQSxHQUFZLENBQUE7QUFBRyxFQUFBLE9BQUg7QUFBWSxFQUFBO0FBQVosQ0FBQSxLQUFZO0FBQzNCLFNBQU8sZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLFdBQUEsQ0FBWSxRQUFiLEVBQUE7QUFBc0IsSUFBQSxLQUFBLEVBQU87QUFBN0IsR0FBQSxFQUNILGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxhQUFELEVBQUEsSUFBQSxFQUNJLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxRQUFELEVBQUE7QUFBVSxJQUFBLFFBQUEsRUFBVSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsS0FBRCxFQUFBLElBQUEsRUFBSyxZQUFMO0FBQXBCLEdBQUEsRUFDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsTUFBRCxFQUFBO0FBQVEsSUFBQSxRQUFBLEVBQVUsT0FBQSxDQUFRO0FBQTFCLEdBQUEsRUFDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsTUFBRCxFQUFBLElBQUEsQ0FESixDQURKLENBREosQ0FERyxDQUFQO0FBSWdCLENBTGI7TUFBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgU3dpdGNoLCBSb3V0ZSwgdXNlTG9jYXRpb24gfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJ1xuaW1wb3J0IHsgdXNlTWFob0NvbnRleHQsIE1haG9Db250ZXh0IH0gZnJvbSAnQGJ1bmRsZXNzL3BsdWdpbi1yZWFjdC1wYWdlZC9zcmMvY2xpZW50J1xuXG5jb25zdCBTdXNwZW5zZSA9IHByb2Nlc3MuYnJvd3NlciA/IFJlYWN0LlN1c3BlbnNlIDogKHtjaGlsZHJlbn0pID0+IGNoaWxkcmVuXG5cblxuICAgICAgICBsZXQgUm91dGVfYWJvdXRfdHN4XG4gICAgICAgIGxldCBsb2FkX2Fib3V0X3RzeFxuICAgICAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgICAgICBSb3V0ZV9hYm91dF90c3ggPSBSZWFjdC5sYXp5KCgpID0+IGltcG9ydChcIi4vcGFnZXMvYWJvdXQudHN4XCIpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gcmVxdWlyZShcIi4vcGFnZXMvYWJvdXQudHN4XCIpXG4gICAgICAgICAgICBSb3V0ZV9hYm91dF90c3ggPSByZXMuZGVmYXVsdFxuICAgICAgICAgICAgbG9hZF9hYm91dF90c3ggPSByZXMubG9hZFxuICAgICAgICB9XG4gICAgICAgIFxuXG4gICAgICAgIGxldCBSb3V0ZV9pbmRleF90c3hcbiAgICAgICAgbGV0IGxvYWRfaW5kZXhfdHN4XG4gICAgICAgIGlmIChwcm9jZXNzLmJyb3dzZXIpIHtcbiAgICAgICAgICAgIFJvdXRlX2luZGV4X3RzeCA9IFJlYWN0LmxhenkoKCkgPT4gaW1wb3J0KFwiLi9wYWdlcy9pbmRleC50c3hcIikpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSByZXF1aXJlKFwiLi9wYWdlcy9pbmRleC50c3hcIilcbiAgICAgICAgICAgIFJvdXRlX2luZGV4X3RzeCA9IHJlcy5kZWZhdWx0XG4gICAgICAgICAgICBsb2FkX2luZGV4X3RzeCA9IHJlcy5sb2FkXG4gICAgICAgIH1cbiAgICAgICAgXG5cblxuXG5jb25zdCBOb3RGb3VuZCA9ICgpID0+IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdXNlTWFob0NvbnRleHQoKVxuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgIGNvbnRleHQuc3RhdHVzQ29kZSA9IDQwNFxuICAgIH1cbiAgICByZXR1cm4gPGRpdj40MDQ8L2Rpdj5cbn1cblxuZXhwb3J0IGNvbnN0IGxvYWRGdW5jdGlvbnMgPSBwcm9jZXNzLmJyb3dzZXIgPyB1bmRlZmluZWQgOiBbXG4gICAge1xuICAgICAgICAgICAgcGF0aDogXCIvYWJvdXRcIixcbiAgICAgICAgICAgIGxvYWQ6IGxvYWRfYWJvdXRfdHN4XG4gICAgICAgIH0sXG57XG4gICAgICAgICAgICBwYXRoOiBcIi9cIixcbiAgICAgICAgICAgIGxvYWQ6IGxvYWRfaW5kZXhfdHN4XG4gICAgICAgIH1cbl1cblxuZXhwb3J0IGNvbnN0IFJvdXRlcyA9ICgpID0+IHtcbiAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gdXNlTG9jYXRpb24oKVxuICAgICAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB3aW5kb3cuSU5JVElBTF9TVEFURVxuICAgICAgICAgICAgc3RhdGUucmV2YWxpZGF0ZU9uTW91bnQgPSB0cnVlXG4gICAgICAgIH0sIFtsb2NhdGlvbi5wYXRobmFtZV0pXG4gICAgfVxuICAgIHJldHVybiA8U3dpdGNoPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9hYm91dFwiXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudD17Um91dGVfYWJvdXRfdHN4fVxuICAgICAgICAgICAgICAgIC8+XG48Um91dGUgcGF0aD1cIi9cIlxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ9e1JvdXRlX2luZGV4X3RzeH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICA8Um91dGUgcGF0aD1cIipcIiBjb21wb25lbnQ9e05vdEZvdW5kfSAvPlxuICAgIDwvU3dpdGNoPlxufVxuXG5jbGFzcyBFcnJvckJvdW5kYXJ5IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0ZSA9IHtlcnJvcjogbnVsbH1cbiAgICBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbUVycm9yKGVycm9yKSB7XG4gICAgICAgIHJldHVybiB7ZXJyb3J9XG4gICAgfVxuICAgIGNvbXBvbmVudERpZENhdGNoKCkge1xuICAgICAgICAvLyBsb2cgdGhlIGVycm9yIHRvIHRoZSBzZXJ2ZXJcbiAgICB9XG4gICAgdHJ5QWdhaW4gPSAoKSA9PiB0aGlzLnNldFN0YXRlKHtlcnJvcjogbnVsbH0pXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5lcnJvciA/IChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgVGhlcmUgd2FzIGFuIGVycm9yLiA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMudHJ5QWdhaW59PnRyeSBhZ2FpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxwcmUgc3R5bGU9e3t3aGl0ZVNwYWNlOiAnbm9ybWFsJ319Pnt0aGlzLnN0YXRlLmVycm9yLm1lc3NhZ2V9PC9wcmU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IEFwcCA9ICh7IGNvbnRleHQsIFJvdXRlciB9KSA9PiB7XG4gICAgcmV0dXJuIDxNYWhvQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17Y29udGV4dH0+XG4gICAgICAgIDxFcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgPFN1c3BlbnNlIGZhbGxiYWNrPXs8ZGl2PkxvYWRpbmcuLi48L2Rpdj59PlxuICAgICAgICAgICAgICAgIDxSb3V0ZXIgbG9jYXRpb249e2NvbnRleHQudXJsfT5cbiAgICAgICAgICAgICAgICAgICAgPFJvdXRlcyAvPlxuICAgICAgICAgICAgICAgIDwvUm91dGVyPlxuICAgICAgICAgICAgPC9TdXNwZW5zZT5cbiAgICAgICAgPC9FcnJvckJvdW5kYXJ5PlxuICAgIDwvTWFob0NvbnRleHQuUHJvdmlkZXI+XG59XG4iLG51bGxdfQ==
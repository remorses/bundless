
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXBhZ2VzL19idW5kbGVzc19wYWdlZF9yb3V0ZXNfLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7a0JBQ0E7QUFFQTs7QUFLUSxJQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxFQUFBO0FBQ0EsRUFBQSxjQUFBLEdBQUEsTUFBQSxDQUFBLFlBQUE7QUFDQSxFQUFBLGNBQUksR0FBQSxNQUFBLENBQUEsWUFBSjs7QUFDSSxFQUFBLE1BQUEsQ0FBQSxZQUFBLEdBQWtCLENBQUEsSUFBQSxFQUFXLEVBQVgsS0FBd0I7QUFBQSxJQUFBLGNBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxFQUFBLGFBQUEsR0FBQSxHQUFBLEdBQUEsRUFBQTtBQUUxQyxHQUZBOztBQUdBLEVBQUEsTUFBQSxDQUFBLFlBQUEsR0FBc0IsY0FBQSxDQUFBLG1DQUF0QjtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUFkWixPQUFBLEtBQUEsTUFBQSxPQUFBO0FBQ0EsU0FBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLFdBQUEsUUFBQSxrQkFBQTtBQUNBLFNBQUEsY0FBQSxFQUFBLFdBQUEsUUFBQSx5Q0FBQTtBQUVBLE1BQU0sUUFBQSxHQUE2QixLQUFBLENBQU0sUUFBekM7QUFHUSxJQUFBLGVBQUE7QUFDQSxJQUFBLGNBQUE7O0FBQ0EsSUFBSSxJQUFKLEVBQUk7QUFDQSxFQUFBLGVBQUEsR0FBa0IsS0FBQSxDQUFNLElBQU4sQ0FBVyxNQUFhLE9BQUEsbUJBQUEsQ0FBeEIsQ0FBbEI7QUFBMEMsQ0FEOUMsTUFDOEM7QUFFMUMsUUFBQSxHQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSLENBQVo7O0FBQ0EsRUFBQSxlQUFBLEdBQWtCLEdBQUEsQ0FBSSxPQUF0QjtBQUNBLEVBQUEsY0FBQSxHQUFpQixHQUFBLENBQUksSUFBckI7QUFBcUI7O0FBSXpCLElBQUEsZUFBQTtBQUNBLElBQUEs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YjtBQUFaLEtBQUEsRUFBcUMsS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixPQUF0RCxDQUZKLENBREcsR0FNSCxLQUFLLEtBQUwsQ0FBVyxRQU5mO0FBTWU7O0FBaEJXOztBQXFCM0IsT0FBQSxNQUFBLEdBQUEsR0FBWSxDQUFBO0FBQUcsRUFBQSxPQUFIO0FBQVksRUFBQTtBQUFaLENBQUEsS0FBWTtBQUMzQixTQUFPLGVBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQyxXQUFBLENBQVksUUFBYixFQUFBO0FBQXNCLElBQUEsS0FBQSxFQUFPO0FBQTdCLEdBQUEsRUFDSCxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsYUFBRCxFQUFBLElBQUEsRUFDSSxlQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUMsUUFBRCxFQUFBO0FBQVUsSUFBQSxRQUFBLEVBQVUsZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLEtBQUQsRUFBQSxJQUFBLEVBQUssWUFBTDtBQUFwQixHQUFBLEVBQ0ksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLE1BQUQsRUFBQTtBQUFRLElBQUEsUUFBQSxFQUFVLE9BQUEsQ0FBUTtBQUExQixHQUFBLEVBQ0ksZUFBQSxLQUFBLENBQUEsYUFBQSxDQUFDLE1BQUQsRUFBQSxJQUFBLENBREosQ0FESixDQURKLENBREcsQ0FBUDtBQUlnQixDQUxiO01BQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFN3aXRjaCwgUm91dGUsIHVzZUxvY2F0aW9uIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbmltcG9ydCB7IHVzZU1haG9Db250ZXh0LCBNYWhvQ29udGV4dCB9IGZyb20gJ0BidW5kbGVzcy9wbHVnaW4tcmVhY3QtcGFnZWQvc3JjL2NsaWVudCdcblxuY29uc3QgU3VzcGVuc2UgPSBwcm9jZXNzLmJyb3dzZXIgPyBSZWFjdC5TdXNwZW5zZSA6ICh7Y2hpbGRyZW59KSA9PiBjaGlsZHJlblxuXG5cbiAgICAgICAgbGV0IFJvdXRlX2Fib3V0X3RzeFxuICAgICAgICBsZXQgbG9hZF9hYm91dF90c3hcbiAgICAgICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICAgICAgUm91dGVfYWJvdXRfdHN4ID0gUmVhY3QubGF6eSgoKSA9PiBpbXBvcnQoXCIuL3BhZ2VzL2Fib3V0LnRzeFwiKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHJlcXVpcmUoXCIuL3BhZ2VzL2Fib3V0LnRzeFwiKVxuICAgICAgICAgICAgUm91dGVfYWJvdXRfdHN4ID0gcmVzLmRlZmF1bHRcbiAgICAgICAgICAgIGxvYWRfYWJvdXRfdHN4ID0gcmVzLmxvYWRcbiAgICAgICAgfVxuICAgICAgICBcblxuICAgICAgICBsZXQgUm91dGVfaW5kZXhfdHN4XG4gICAgICAgIGxldCBsb2FkX2luZGV4X3RzeFxuICAgICAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgICAgICBSb3V0ZV9pbmRleF90c3ggPSBSZWFjdC5sYXp5KCgpID0+IGltcG9ydChcIi4vcGFnZXMvaW5kZXgudHN4XCIpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gcmVxdWlyZShcIi4vcGFnZXMvaW5kZXgudHN4XCIpXG4gICAgICAgICAgICBSb3V0ZV9pbmRleF90c3ggPSByZXMuZGVmYXVsdFxuICAgICAgICAgICAgbG9hZF9pbmRleF90c3ggPSByZXMubG9hZFxuICAgICAgICB9XG4gICAgICAgIFxuXG5cblxuY29uc3QgTm90Rm91bmQgPSAoKSA9PiB7XG4gICAgY29uc3QgY29udGV4dCA9IHVzZU1haG9Db250ZXh0KClcbiAgICBpZiAoY29udGV4dCkge1xuICAgICAgICBjb250ZXh0LnN0YXR1c0NvZGUgPSA0MDRcbiAgICB9XG4gICAgcmV0dXJuIDxkaXY+NDA0PC9kaXY+XG59XG5cbmV4cG9ydCBjb25zdCBsb2FkRnVuY3Rpb25zID0gcHJvY2Vzcy5icm93c2VyID8gdW5kZWZpbmVkIDogW1xuICAgIHtcbiAgICAgICAgICAgIHBhdGg6IFwiL2Fib3V0XCIsXG4gICAgICAgICAgICBsb2FkOiBsb2FkX2Fib3V0X3RzeFxuICAgICAgICB9LFxue1xuICAgICAgICAgICAgcGF0aDogXCIvXCIsXG4gICAgICAgICAgICBsb2FkOiBsb2FkX2luZGV4X3RzeFxuICAgICAgICB9XG5dXG5cbmV4cG9ydCBjb25zdCBSb3V0ZXMgPSAoKSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHVzZUxvY2F0aW9uKClcbiAgICAgICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gd2luZG93LklOSVRJQUxfU1RBVEVcbiAgICAgICAgICAgIHN0YXRlLnJldmFsaWRhdGVPbk1vdW50ID0gdHJ1ZVxuICAgICAgICB9LCBbbG9jYXRpb24ucGF0aG5hbWVdKVxuICAgIH1cbiAgICByZXR1cm4gPFN3aXRjaD5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvYWJvdXRcIlxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ9e1JvdXRlX2Fib3V0X3RzeH1cbiAgICAgICAgICAgICAgICAvPlxuPFJvdXRlIHBhdGg9XCIvXCJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50PXtSb3V0ZV9pbmRleF90c3h9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIqXCIgY29tcG9uZW50PXtOb3RGb3VuZH0gLz5cbiAgICA8L1N3aXRjaD5cbn1cblxuY2xhc3MgRXJyb3JCb3VuZGFyeSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGUgPSB7ZXJyb3I6IG51bGx9XG4gICAgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21FcnJvcihlcnJvcikge1xuICAgICAgICByZXR1cm4ge2Vycm9yfVxuICAgIH1cbiAgICBjb21wb25lbnREaWRDYXRjaCgpIHtcbiAgICAgICAgLy8gbG9nIHRoZSBlcnJvciB0byB0aGUgc2VydmVyXG4gICAgfVxuICAgIHRyeUFnYWluID0gKCkgPT4gdGhpcy5zZXRTdGF0ZSh7ZXJyb3I6IG51bGx9KVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuZXJyb3IgPyAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIFRoZXJlIHdhcyBhbiBlcnJvci4gPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLnRyeUFnYWlufT50cnkgYWdhaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8cHJlIHN0eWxlPXt7d2hpdGVTcGFjZTogJ25vcm1hbCd9fT57dGhpcy5zdGF0ZS5lcnJvci5tZXNzYWdlfTwvcHJlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBBcHAgPSAoeyBjb250ZXh0LCBSb3V0ZXIgfSkgPT4ge1xuICAgIHJldHVybiA8TWFob0NvbnRleHQuUHJvdmlkZXIgdmFsdWU9e2NvbnRleHR9PlxuICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17PGRpdj5Mb2FkaW5nLi4uPC9kaXY+fT5cbiAgICAgICAgICAgICAgICA8Um91dGVyIGxvY2F0aW9uPXtjb250ZXh0LnVybH0+XG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZXMgLz5cbiAgICAgICAgICAgICAgICA8L1JvdXRlcj5cbiAgICAgICAgICAgIDwvU3VzcGVuc2U+XG4gICAgICAgIDwvRXJyb3JCb3VuZGFyeT5cbiAgICA8L01haG9Db250ZXh0LlByb3ZpZGVyPlxufVxuIl19
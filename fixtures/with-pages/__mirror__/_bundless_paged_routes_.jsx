var __defProp = Object.defineProperty;
var __publicField = (obj, key, value) => {
  if (typeof key !== "symbol")
    key += "";
  if (key in obj)
    return __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value});
  return obj[key] = value;
};
import react_cjsImport0 from "/web_modules/react/index.js?namespace=file";
const React = react_cjsImport0 && react_cjsImport0.__esModule ? react_cjsImport0.default : react_cjsImport0;;
import {Switch, Route, useLocation} from "/web_modules/react-router-dom/esm/react-router-dom.js?namespace=file";
import {useMahoContext, MahoContext} from "/.../.../paged/src/client/index.ts?namespace=file";
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
  const context = useMahoContext();
  if (context) {
    context.statusCode = 404;
  }
  return /* @__PURE__ */ React.createElement("div", null, "404");
};
export const loadFunctions = void 0;
export const Routes = () => {
  if (true) {
    const location = useLocation();
    React.useEffect(() => {
      const state = window.INITIAL_STATE;
      state.revalidateOnMount = true;
    }, [location.pathname]);
  }
  return /* @__PURE__ */ React.createElement(Switch, null, /* @__PURE__ */ React.createElement(Route, {
    path: "/about",
    component: Route_about_tsx
  }), /* @__PURE__ */ React.createElement(Route, {
    path: "/",
    component: Route_index_tsx
  }), /* @__PURE__ */ React.createElement(Route, {
    path: "*",
    component: NotFound
  }));
};
class ErrorBoundary extends React.Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", {error: null});
    __publicField(this, "tryAgain", () => this.setState({error: null}));
  }
  static getDerivedStateFromError(error) {
    return {error};
  }
  componentDidCatch() {
  }
  render() {
    return this.state.error ? /* @__PURE__ */ React.createElement("div", null, "There was an error. ", /* @__PURE__ */ React.createElement("button", {
      onClick: this.tryAgain
    }, "try again"), /* @__PURE__ */ React.createElement("pre", {
      style: {whiteSpace: "normal"}
    }, this.state.error.message)) : this.props.children;
  }
}
export const App = ({context, Router}) => {
  return /* @__PURE__ */ React.createElement(MahoContext.Provider, {
    value: context
  }, /* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(Suspense, {
    fallback: /* @__PURE__ */ React.createElement("div", null, "Loading...")
  }, /* @__PURE__ */ React.createElement(Router, {
    location: context.url
  }, /* @__PURE__ */ React.createElement(Routes, null)))));
};

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL21vcnNlL0RvY3VtZW50cy9HaXRIdWIvZXNwYWNrL2ZpeHR1cmVzL3dpdGgtcGFnZXMvX2J1bmRsZXNzX3BhZ2VkX3JvdXRlc18uanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFN3aXRjaCwgUm91dGUsIHVzZUxvY2F0aW9uIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbmltcG9ydCB7IHVzZU1haG9Db250ZXh0LCBNYWhvQ29udGV4dCB9IGZyb20gJ0BidW5kbGVzcy9wbHVnaW4tcmVhY3QtcGFnZWQvc3JjL2NsaWVudCdcblxuY29uc3QgU3VzcGVuc2UgPSBwcm9jZXNzLmJyb3dzZXIgPyBSZWFjdC5TdXNwZW5zZSA6ICh7Y2hpbGRyZW59KSA9PiBjaGlsZHJlblxuXG5cbiAgICAgICAgbGV0IFJvdXRlX2Fib3V0X3RzeFxuICAgICAgICBsZXQgbG9hZF9hYm91dF90c3hcbiAgICAgICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICAgICAgUm91dGVfYWJvdXRfdHN4ID0gUmVhY3QubGF6eSgoKSA9PiBpbXBvcnQoXCIuL3BhZ2VzL2Fib3V0LnRzeFwiKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHJlcXVpcmUoXCIuL3BhZ2VzL2Fib3V0LnRzeFwiKVxuICAgICAgICAgICAgUm91dGVfYWJvdXRfdHN4ID0gcmVzLmRlZmF1bHRcbiAgICAgICAgICAgIGxvYWRfYWJvdXRfdHN4ID0gcmVzLmxvYWRcbiAgICAgICAgfVxuICAgICAgICBcblxuICAgICAgICBsZXQgUm91dGVfaW5kZXhfdHN4XG4gICAgICAgIGxldCBsb2FkX2luZGV4X3RzeFxuICAgICAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgICAgICBSb3V0ZV9pbmRleF90c3ggPSBSZWFjdC5sYXp5KCgpID0+IGltcG9ydChcIi4vcGFnZXMvaW5kZXgudHN4XCIpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gcmVxdWlyZShcIi4vcGFnZXMvaW5kZXgudHN4XCIpXG4gICAgICAgICAgICBSb3V0ZV9pbmRleF90c3ggPSByZXMuZGVmYXVsdFxuICAgICAgICAgICAgbG9hZF9pbmRleF90c3ggPSByZXMubG9hZFxuICAgICAgICB9XG4gICAgICAgIFxuXG5cblxuY29uc3QgTm90Rm91bmQgPSAoKSA9PiB7XG4gICAgY29uc3QgY29udGV4dCA9IHVzZU1haG9Db250ZXh0KClcbiAgICBpZiAoY29udGV4dCkge1xuICAgICAgICBjb250ZXh0LnN0YXR1c0NvZGUgPSA0MDRcbiAgICB9XG4gICAgcmV0dXJuIDxkaXY+NDA0PC9kaXY+XG59XG5cbmV4cG9ydCBjb25zdCBsb2FkRnVuY3Rpb25zID0gcHJvY2Vzcy5icm93c2VyID8gdW5kZWZpbmVkIDogW1xuICAgIHtcbiAgICAgICAgICAgIHBhdGg6IFwiL2Fib3V0XCIsXG4gICAgICAgICAgICBsb2FkOiBsb2FkX2Fib3V0X3RzeFxuICAgICAgICB9LFxue1xuICAgICAgICAgICAgcGF0aDogXCIvXCIsXG4gICAgICAgICAgICBsb2FkOiBsb2FkX2luZGV4X3RzeFxuICAgICAgICB9XG5dXG5cbmV4cG9ydCBjb25zdCBSb3V0ZXMgPSAoKSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHVzZUxvY2F0aW9uKClcbiAgICAgICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gd2luZG93LklOSVRJQUxfU1RBVEVcbiAgICAgICAgICAgIHN0YXRlLnJldmFsaWRhdGVPbk1vdW50ID0gdHJ1ZVxuICAgICAgICB9LCBbbG9jYXRpb24ucGF0aG5hbWVdKVxuICAgIH1cbiAgICByZXR1cm4gPFN3aXRjaD5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvYWJvdXRcIlxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ9e1JvdXRlX2Fib3V0X3RzeH1cbiAgICAgICAgICAgICAgICAvPlxuPFJvdXRlIHBhdGg9XCIvXCJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50PXtSb3V0ZV9pbmRleF90c3h9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIqXCIgY29tcG9uZW50PXtOb3RGb3VuZH0gLz5cbiAgICA8L1N3aXRjaD5cbn1cblxuY2xhc3MgRXJyb3JCb3VuZGFyeSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGUgPSB7ZXJyb3I6IG51bGx9XG4gICAgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21FcnJvcihlcnJvcikge1xuICAgICAgICByZXR1cm4ge2Vycm9yfVxuICAgIH1cbiAgICBjb21wb25lbnREaWRDYXRjaCgpIHtcbiAgICAgICAgLy8gbG9nIHRoZSBlcnJvciB0byB0aGUgc2VydmVyXG4gICAgfVxuICAgIHRyeUFnYWluID0gKCkgPT4gdGhpcy5zZXRTdGF0ZSh7ZXJyb3I6IG51bGx9KVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuZXJyb3IgPyAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIFRoZXJlIHdhcyBhbiBlcnJvci4gPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLnRyeUFnYWlufT50cnkgYWdhaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8cHJlIHN0eWxlPXt7d2hpdGVTcGFjZTogJ25vcm1hbCd9fT57dGhpcy5zdGF0ZS5lcnJvci5tZXNzYWdlfTwvcHJlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBBcHAgPSAoeyBjb250ZXh0LCBSb3V0ZXIgfSkgPT4ge1xuICAgIHJldHVybiA8TWFob0NvbnRleHQuUHJvdmlkZXIgdmFsdWU9e2NvbnRleHR9PlxuICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17PGRpdj5Mb2FkaW5nLi4uPC9kaXY+fT5cbiAgICAgICAgICAgICAgICA8Um91dGVyIGxvY2F0aW9uPXtjb250ZXh0LnVybH0+XG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZXMgLz5cbiAgICAgICAgICAgICAgICA8L1JvdXRlcj5cbiAgICAgICAgICAgIDwvU3VzcGVuc2U+XG4gICAgICAgIDwvRXJyb3JCb3VuZGFyeT5cbiAgICA8L01haG9Db250ZXh0LlByb3ZpZGVyPlxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFDQTtBQUNBO0FBQ0E7QUFFQSxNQUFNLFdBQTZCLE1BQU07QUFHakM7QUFDQTtBQUNBLElBQUk7QUFDQSxvQkFBa0IsTUFBTSxLQUFLLE1BQWE7QUFBQTtBQUUxQyxjQUFZLFFBQVE7QUFDcEIsb0JBQWtCLElBQUk7QUFDdEIsbUJBQWlCLElBQUk7QUFBQTtBQUl6QjtBQUNBO0FBQ0EsSUFBSTtBQUNBLG9CQUFrQixNQUFNLEtBQUssTUFBYTtBQUFBO0FBRTFDLGNBQVksUUFBUTtBQUNwQixvQkFBa0IsSUFBSTtBQUN0QixtQkFBaUIsSUFBSTtBQUFBO0FBTWpDLGlCQUFpQjtBQUNiLGtCQUFnQjtBQUNoQixNQUFJO0FBQ0EsWUFBUSxhQUFhO0FBQUE7QUFFekIsU0FBTyxvQ0FBQyxPQUFELE1BQUs7QUFBQTtBQUdULDZCQUF3QztBQVd4QyxzQkFBZTtBQUNsQixNQUFJO0FBQ0EscUJBQWlCO0FBQ2pCLFVBQU0sVUFBVTtBQUNaLG9CQUFjLE9BQU87QUFDckIsWUFBTSxvQkFBb0I7QUFBQSxPQUMzQixDQUFDLFNBQVM7QUFBQTtBQUVqQixTQUFPLG9DQUFDLFFBQUQsTUFDSCxvQ0FBQyxPQUFEO0FBQUEsSUFBTyxNQUFLO0FBQUEsSUFDQSxXQUFXO0FBQUEsTUFFL0Isb0NBQUMsT0FBRDtBQUFBLElBQU8sTUFBSztBQUFBLElBQ1EsV0FBVztBQUFBLE1BRXZCLG9DQUFDLE9BQUQ7QUFBQSxJQUFPLE1BQUs7QUFBQSxJQUFJLFdBQVc7QUFBQTtBQUFBO0FBbEVuQyw0QkFzRTRCLE1BQU07QUFBQSxFQXRFbEM7QUFBQTtBQXVFSSxpQ0FBUSxDQUFDLE9BQU87QUFPaEIsb0NBQVcsTUFBTSxLQUFLLFNBQVMsQ0FBQyxPQUFPO0FBQUE7QUFBQSxTQU5oQztBQUNILFdBQU8sQ0FBQztBQUFBO0FBQUEsRUFFWjtBQUFBO0FBQUEsRUFJQTtBQUNJLFdBQU8sS0FBSyxNQUFNLFFBQ2Qsb0NBQUMsT0FBRCxNQUFLLHdCQUNtQixvQ0FBQyxVQUFEO0FBQUEsTUFBUSxTQUFTLEtBQUs7QUFBQSxPQUFVLGNBQ3BELG9DQUFDLE9BQUQ7QUFBQSxNQUFLLE9BQU8sQ0FBQyxZQUFZO0FBQUEsT0FBWSxLQUFLLE1BQU0sTUFBTSxZQUcxRCxLQUFLLE1BQU07QUFBQTtBQUFBO0FBS2hCLG1CQUFZLEVBQUcsU0FBUztBQUMzQixTQUFPLG9DQUFDLFlBQVksVUFBYjtBQUFBLElBQXNCLE9BQU87QUFBQSxLQUNoQyxvQ0FBQyxlQUFELE1BQ0ksb0NBQUMsVUFBRDtBQUFBLElBQVUsVUFBVSxvQ0FBQyxPQUFELE1BQUs7QUFBQSxLQUNyQixvQ0FBQyxRQUFEO0FBQUEsSUFBUSxVQUFVLFFBQVE7QUFBQSxLQUN0QixvQ0FBQyxRQUFEO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
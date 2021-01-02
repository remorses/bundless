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
}
let Route_index_tsx;
let load_index_tsx;
if (true) {
  Route_index_tsx = React.lazy(() => import('/pages/index.tsx?namespace=file'));
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
    location: "/"
  }, /* @__PURE__ */ React.createElement(Routes, null)))));
};

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL21vcnNlL0RvY3VtZW50cy9HaXRIdWIvZXNwYWNrL2ZpeHR1cmVzL3dpdGgtcGFnZXMvX2J1bmRsZXNzX3BhZ2VkX3JvdXRlc18uanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFN3aXRjaCwgUm91dGUsIHVzZUxvY2F0aW9uIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbmltcG9ydCB7IHVzZU1haG9Db250ZXh0LCBNYWhvQ29udGV4dCB9IGZyb20gJ0BidW5kbGVzcy9wbHVnaW4tcmVhY3QtcGFnZWQvc3JjL2NsaWVudCdcblxuY29uc3QgU3VzcGVuc2UgPSBwcm9jZXNzLmJyb3dzZXIgPyBSZWFjdC5TdXNwZW5zZSA6ICh7Y2hpbGRyZW59KSA9PiBjaGlsZHJlblxuXG5cbiAgICAgICAgbGV0IFJvdXRlX2Fib3V0X3RzeFxuICAgICAgICBsZXQgbG9hZF9hYm91dF90c3hcbiAgICAgICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICAgICAgUm91dGVfYWJvdXRfdHN4ID0gUmVhY3QubGF6eSgoKSA9PiBpbXBvcnQoXCIuL3BhZ2VzL2Fib3V0LnRzeFwiKSlcbiAgICAgICAgfVxuICAgICAgICBcblxuICAgICAgICBsZXQgUm91dGVfaW5kZXhfdHN4XG4gICAgICAgIGxldCBsb2FkX2luZGV4X3RzeFxuICAgICAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgICAgICBSb3V0ZV9pbmRleF90c3ggPSBSZWFjdC5sYXp5KCgpID0+IGltcG9ydChcIi4vcGFnZXMvaW5kZXgudHN4XCIpKVxuICAgICAgICB9XG4gICAgICAgIFxuXG5cblxuY29uc3QgTm90Rm91bmQgPSAoKSA9PiB7XG4gICAgY29uc3QgY29udGV4dCA9IHVzZU1haG9Db250ZXh0KClcbiAgICBpZiAoY29udGV4dCkge1xuICAgICAgICBjb250ZXh0LnN0YXR1c0NvZGUgPSA0MDRcbiAgICB9XG4gICAgcmV0dXJuIDxkaXY+NDA0PC9kaXY+XG59XG5cbmV4cG9ydCBjb25zdCBsb2FkRnVuY3Rpb25zID0gcHJvY2Vzcy5icm93c2VyID8gdW5kZWZpbmVkIDogW1xuICAgIHtcbiAgICAgICAgICAgIHBhdGg6IFwiL2Fib3V0XCIsXG4gICAgICAgICAgICBsb2FkOiBsb2FkX2Fib3V0X3RzeFxuICAgICAgICB9LFxue1xuICAgICAgICAgICAgcGF0aDogXCIvXCIsXG4gICAgICAgICAgICBsb2FkOiBsb2FkX2luZGV4X3RzeFxuICAgICAgICB9XG5dXG5cbmV4cG9ydCBjb25zdCBSb3V0ZXMgPSAoKSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHVzZUxvY2F0aW9uKClcbiAgICAgICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gd2luZG93LklOSVRJQUxfU1RBVEVcbiAgICAgICAgICAgIHN0YXRlLnJldmFsaWRhdGVPbk1vdW50ID0gdHJ1ZVxuICAgICAgICB9LCBbbG9jYXRpb24ucGF0aG5hbWVdKVxuICAgIH1cbiAgICByZXR1cm4gPFN3aXRjaD5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvYWJvdXRcIlxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ9e1JvdXRlX2Fib3V0X3RzeH1cbiAgICAgICAgICAgICAgICAvPlxuPFJvdXRlIHBhdGg9XCIvXCJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50PXtSb3V0ZV9pbmRleF90c3h9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIqXCIgY29tcG9uZW50PXtOb3RGb3VuZH0gLz5cbiAgICA8L1N3aXRjaD5cbn1cblxuY2xhc3MgRXJyb3JCb3VuZGFyeSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGUgPSB7ZXJyb3I6IG51bGx9XG4gICAgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21FcnJvcihlcnJvcikge1xuICAgICAgICByZXR1cm4ge2Vycm9yfVxuICAgIH1cbiAgICBjb21wb25lbnREaWRDYXRjaCgpIHtcbiAgICAgICAgLy8gbG9nIHRoZSBlcnJvciB0byB0aGUgc2VydmVyXG4gICAgfVxuICAgIHRyeUFnYWluID0gKCkgPT4gdGhpcy5zZXRTdGF0ZSh7ZXJyb3I6IG51bGx9KVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuZXJyb3IgPyAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIFRoZXJlIHdhcyBhbiBlcnJvci4gPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLnRyeUFnYWlufT50cnkgYWdhaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8cHJlIHN0eWxlPXt7d2hpdGVTcGFjZTogJ25vcm1hbCd9fT57dGhpcy5zdGF0ZS5lcnJvci5tZXNzYWdlfTwvcHJlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBBcHAgPSAoeyBjb250ZXh0LCBSb3V0ZXIgfSkgPT4ge1xuICAgIHJldHVybiA8TWFob0NvbnRleHQuUHJvdmlkZXIgdmFsdWU9e2NvbnRleHR9PlxuICAgICAgICA8RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17PGRpdj5Mb2FkaW5nLi4uPC9kaXY+fT5cbiAgICAgICAgICAgICAgICA8Um91dGVyIGxvY2F0aW9uPXsnLyd9PlxuICAgICAgICAgICAgICAgICAgICA8Um91dGVzIC8+XG4gICAgICAgICAgICAgICAgPC9Sb3V0ZXI+XG4gICAgICAgICAgICA8L1N1c3BlbnNlPlxuICAgICAgICA8L0Vycm9yQm91bmRhcnk+XG4gICAgPC9NYWhvQ29udGV4dC5Qcm92aWRlcj5cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7O0FBQ0E7QUFDQTtBQUNBO0FBRUEsTUFBTSxXQUE2QixNQUFNO0FBR2pDO0FBQ0E7QUFDQSxJQUFJO0FBQ0Esb0JBQWtCLE1BQU0sS0FBSyxNQUFhO0FBQUE7QUFJOUM7QUFDQTtBQUNBLElBQUk7QUFDQSxvQkFBa0IsTUFBTSxLQUFLLE1BQWE7QUFBQTtBQU10RCxpQkFBaUI7QUFDYixrQkFBZ0I7QUFDaEIsTUFBSTtBQUNBLFlBQVEsYUFBYTtBQUFBO0FBRXpCLFNBQU8sb0NBQUMsT0FBRCxNQUFLO0FBQUE7QUFHVCw2QkFBd0M7QUFXeEMsc0JBQWU7QUFDbEIsTUFBSTtBQUNBLHFCQUFpQjtBQUNqQixVQUFNLFVBQVU7QUFDWixvQkFBYyxPQUFPO0FBQ3JCLFlBQU0sb0JBQW9CO0FBQUEsT0FDM0IsQ0FBQyxTQUFTO0FBQUE7QUFFakIsU0FBTyxvQ0FBQyxRQUFELE1BQ0gsb0NBQUMsT0FBRDtBQUFBLElBQU8sTUFBSztBQUFBLElBQ0EsV0FBVztBQUFBLE1BRS9CLG9DQUFDLE9BQUQ7QUFBQSxJQUFPLE1BQUs7QUFBQSxJQUNRLFdBQVc7QUFBQSxNQUV2QixvQ0FBQyxPQUFEO0FBQUEsSUFBTyxNQUFLO0FBQUEsSUFBSSxXQUFXO0FBQUE7QUFBQTtBQTFEbkMsNEJBOEQ0QixNQUFNO0FBQUEsRUE5RGxDO0FBQUE7QUErREksaUNBQVEsQ0FBQyxPQUFPO0FBT2hCLG9DQUFXLE1BQU0sS0FBSyxTQUFTLENBQUMsT0FBTztBQUFBO0FBQUEsU0FOaEM7QUFDSCxXQUFPLENBQUM7QUFBQTtBQUFBLEVBRVo7QUFBQTtBQUFBLEVBSUE7QUFDSSxXQUFPLEtBQUssTUFBTSxRQUNkLG9DQUFDLE9BQUQsTUFBSyx3QkFDbUIsb0NBQUMsVUFBRDtBQUFBLE1BQVEsU0FBUyxLQUFLO0FBQUEsT0FBVSxjQUNwRCxvQ0FBQyxPQUFEO0FBQUEsTUFBSyxPQUFPLENBQUMsWUFBWTtBQUFBLE9BQVksS0FBSyxNQUFNLE1BQU0sWUFHMUQsS0FBSyxNQUFNO0FBQUE7QUFBQTtBQUtoQixtQkFBWSxFQUFHLFNBQVM7QUFDM0IsU0FBTyxvQ0FBQyxZQUFZLFVBQWI7QUFBQSxJQUFzQixPQUFPO0FBQUEsS0FDaEMsb0NBQUMsZUFBRCxNQUNJLG9DQUFDLFVBQUQ7QUFBQSxJQUFVLFVBQVUsb0NBQUMsT0FBRCxNQUFLO0FBQUEsS0FDckIsb0NBQUMsUUFBRDtBQUFBLElBQVEsVUFBVTtBQUFBLEtBQ2Qsb0NBQUMsUUFBRDtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
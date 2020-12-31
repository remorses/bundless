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
    const location2 = useLocation();
    React.useEffect(() => {
      const state = window.INITIAL_STATE;
      state.revalidateOnMount = true;
    }, [location2.pathname]);
  }
  return /* @__PURE__ */ React.createElement(Switch, null, /* @__PURE__ */ React.createElement(Route, {
    path: "/",
    component: Route_index_tsx
  }), /* @__PURE__ */ React.createElement(Route, {
    path: "*",
    component: NotFound
  }));
};
const useLiveReload = () => {
  React.useEffect(() => {
    let ws = new WebSocket(`ws://${location.hostname}:8080`);
    ws.onerror = () => {
      console.error("WebSocket error");
    };
    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    ws.onclose = () => {
      console.log("WebSocket connection closed");
      ws = null;
    };
    ws.onmessage = (e) => {
      if (e.data === "reload") {
        location.reload();
      }
    };
  }, []);
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
  if (false) {
    useLiveReload();
  }
  return /* @__PURE__ */ React.createElement(MahoContext.Provider, {
    value: context
  }, /* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(Suspense, {
    fallback: /* @__PURE__ */ React.createElement("div", null, "Loading...")
  }, /* @__PURE__ */ React.createElement(Router, null, /* @__PURE__ */ React.createElement(Routes, null)))));
};

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL21vcnNlL0RvY3VtZW50cy9HaXRIdWIvZXNwYWNrL2ZpeHR1cmVzL3dpdGgtcGFnZXMvX2J1bmRsZXNzX3BhZ2VkX3JvdXRlc18uanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFN3aXRjaCwgUm91dGUsIHVzZUxvY2F0aW9uIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbmltcG9ydCB7IHVzZU1haG9Db250ZXh0LCBNYWhvQ29udGV4dCB9IGZyb20gJ0BidW5kbGVzcy9wbHVnaW4tcmVhY3QtcGFnZWQvc3JjL2NsaWVudCdcblxuY29uc3QgU3VzcGVuc2UgPSBwcm9jZXNzLmJyb3dzZXIgPyBSZWFjdC5TdXNwZW5zZSA6ICh7Y2hpbGRyZW59KSA9PiBjaGlsZHJlblxuXG5cbiAgICAgICAgbGV0IFJvdXRlX2luZGV4X3RzeFxuICAgICAgICBsZXQgbG9hZF9pbmRleF90c3hcbiAgICAgICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICAgICAgUm91dGVfaW5kZXhfdHN4ID0gUmVhY3QubGF6eSgoKSA9PiBpbXBvcnQoXCIuL3BhZ2VzL2luZGV4LnRzeFwiKSlcbiAgICAgICAgfVxuICAgICAgICBcblxuXG5cbmNvbnN0IE5vdEZvdW5kID0gKCkgPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB1c2VNYWhvQ29udGV4dCgpXG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgY29udGV4dC5zdGF0dXNDb2RlID0gNDA0XG4gICAgfVxuICAgIHJldHVybiA8ZGl2PjQwNDwvZGl2PlxufVxuXG5leHBvcnQgY29uc3QgbG9hZEZ1bmN0aW9ucyA9IHByb2Nlc3MuYnJvd3NlciA/IHVuZGVmaW5lZCA6IFtcbiAgICB7XG4gICAgICAgICAgICBwYXRoOiBcIi9cIixcbiAgICAgICAgICAgIGxvYWQ6IGxvYWRfaW5kZXhfdHN4XG4gICAgICAgIH1cbl1cblxuZXhwb3J0IGNvbnN0IFJvdXRlcyA9ICgpID0+IHtcbiAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gdXNlTG9jYXRpb24oKVxuICAgICAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB3aW5kb3cuSU5JVElBTF9TVEFURVxuICAgICAgICAgICAgc3RhdGUucmV2YWxpZGF0ZU9uTW91bnQgPSB0cnVlXG4gICAgICAgIH0sIFtsb2NhdGlvbi5wYXRobmFtZV0pXG4gICAgfVxuICAgIHJldHVybiA8U3dpdGNoPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9cIlxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ9e1JvdXRlX2luZGV4X3RzeH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICA8Um91dGUgcGF0aD1cIipcIiBjb21wb25lbnQ9e05vdEZvdW5kfSAvPlxuICAgIDwvU3dpdGNoPlxufVxuXG5jb25zdCB1c2VMaXZlUmVsb2FkID0gKCkgPT4ge1xuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGxldCB3cyA9IG5ldyBXZWJTb2NrZXQoYHdzOi8vJHtsb2NhdGlvbi5ob3N0bmFtZX06ODA4MGApXG4gICAgICAgIHdzLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdXZWJTb2NrZXQgZXJyb3InKVxuICAgICAgICB9XG4gICAgICAgIHdzLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdXZWJTb2NrZXQgY29ubmVjdGlvbiBlc3RhYmxpc2hlZCcpXG4gICAgICAgIH1cbiAgICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdXZWJTb2NrZXQgY29ubmVjdGlvbiBjbG9zZWQnKVxuICAgICAgICAgICAgd3MgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgd3Mub25tZXNzYWdlID0gKGUpID0+IHtcbiAgICAgICAgICAgIGlmIChlLmRhdGEgPT09ICdyZWxvYWQnKSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIFtdKVxufVxuXG5jbGFzcyBFcnJvckJvdW5kYXJ5IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0ZSA9IHtlcnJvcjogbnVsbH1cbiAgICBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbUVycm9yKGVycm9yKSB7XG4gICAgICAgIHJldHVybiB7ZXJyb3J9XG4gICAgfVxuICAgIGNvbXBvbmVudERpZENhdGNoKCkge1xuICAgICAgICAvLyBsb2cgdGhlIGVycm9yIHRvIHRoZSBzZXJ2ZXJcbiAgICB9XG4gICAgdHJ5QWdhaW4gPSAoKSA9PiB0aGlzLnNldFN0YXRlKHtlcnJvcjogbnVsbH0pXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5lcnJvciA/IChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgVGhlcmUgd2FzIGFuIGVycm9yLiA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMudHJ5QWdhaW59PnRyeSBhZ2FpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxwcmUgc3R5bGU9e3t3aGl0ZVNwYWNlOiAnbm9ybWFsJ319Pnt0aGlzLnN0YXRlLmVycm9yLm1lc3NhZ2V9PC9wcmU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IEFwcCA9ICh7IGNvbnRleHQsIFJvdXRlciB9KSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuYnJvd3NlciAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgICAgICB1c2VMaXZlUmVsb2FkKClcbiAgICB9XG4gICAgcmV0dXJuIDxNYWhvQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17Y29udGV4dH0+XG4gICAgICAgIDxFcnJvckJvdW5kYXJ5PlxuICAgICAgICAgICAgPFN1c3BlbnNlIGZhbGxiYWNrPXs8ZGl2PkxvYWRpbmcuLi48L2Rpdj59PlxuICAgICAgICAgICAgICAgIDxSb3V0ZXI+XG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZXMgLz5cbiAgICAgICAgICAgICAgICA8L1JvdXRlcj5cbiAgICAgICAgICAgIDwvU3VzcGVuc2U+XG4gICAgICAgIDwvRXJyb3JCb3VuZGFyeT5cbiAgICA8L01haG9Db250ZXh0LlByb3ZpZGVyPlxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFDQTtBQUNBO0FBQ0E7QUFFQSxNQUFNLFdBQTZCLE1BQU07QUFHakM7QUFDQTtBQUNBLElBQUk7QUFDQSxvQkFBa0IsTUFBTSxLQUFLLE1BQWE7QUFBQTtBQU10RCxpQkFBaUI7QUFDYixrQkFBZ0I7QUFDaEIsTUFBSTtBQUNBLFlBQVEsYUFBYTtBQUFBO0FBRXpCLFNBQU8sb0NBQUMsT0FBRCxNQUFLO0FBQUE7QUFHVCw2QkFBd0M7QUFPeEMsc0JBQWU7QUFDbEIsTUFBSTtBQUNBLHNCQUFpQjtBQUNqQixVQUFNLFVBQVU7QUFDWixvQkFBYyxPQUFPO0FBQ3JCLFlBQU0sb0JBQW9CO0FBQUEsT0FDM0IsQ0FBQyxVQUFTO0FBQUE7QUFFakIsU0FBTyxvQ0FBQyxRQUFELE1BQ0gsb0NBQUMsT0FBRDtBQUFBLElBQU8sTUFBSztBQUFBLElBQ0EsV0FBVztBQUFBLE1BRXZCLG9DQUFDLE9BQUQ7QUFBQSxJQUFPLE1BQUs7QUFBQSxJQUFJLFdBQVc7QUFBQTtBQUFBO0FBSW5DLHNCQUFzQjtBQUNsQixRQUFNLFVBQVU7QUFDWixhQUFTLElBQUksVUFBVSxRQUFRLFNBQVM7QUFDeEMsT0FBRyxVQUFVO0FBQ1QsY0FBUSxNQUFNO0FBQUE7QUFFbEIsT0FBRyxTQUFTO0FBQ1IsY0FBUSxJQUFJO0FBQUE7QUFFaEIsT0FBRyxVQUFVO0FBQ1QsY0FBUSxJQUFJO0FBQ1osV0FBSztBQUFBO0FBRVQsT0FBRyxZQUFZO0FBQ1gsVUFBSSxFQUFFLFNBQVM7QUFDWCxpQkFBUztBQUFBO0FBQUE7QUFBQSxLQUdsQjtBQUFBO0FBbEVQLDRCQXFFNEIsTUFBTTtBQUFBLEVBckVsQztBQUFBO0FBc0VJLGlDQUFRLENBQUMsT0FBTztBQU9oQixvQ0FBVyxNQUFNLEtBQUssU0FBUyxDQUFDLE9BQU87QUFBQTtBQUFBLFNBTmhDO0FBQ0gsV0FBTyxDQUFDO0FBQUE7QUFBQSxFQUVaO0FBQUE7QUFBQSxFQUlBO0FBQ0ksV0FBTyxLQUFLLE1BQU0sUUFDZCxvQ0FBQyxPQUFELE1BQUssd0JBQ21CLG9DQUFDLFVBQUQ7QUFBQSxNQUFRLFNBQVMsS0FBSztBQUFBLE9BQVUsY0FDcEQsb0NBQUMsT0FBRDtBQUFBLE1BQUssT0FBTyxDQUFDLFlBQVk7QUFBQSxPQUFZLEtBQUssTUFBTSxNQUFNLFlBRzFELEtBQUssTUFBTTtBQUFBO0FBQUE7QUFLaEIsbUJBQVksRUFBRyxTQUFTO0FBQzNCLE1BQXVCO0FBQ25CO0FBQUE7QUFFSixTQUFPLG9DQUFDLFlBQVksVUFBYjtBQUFBLElBQXNCLE9BQU87QUFBQSxLQUNoQyxvQ0FBQyxlQUFELE1BQ0ksb0NBQUMsVUFBRDtBQUFBLElBQVUsVUFBVSxvQ0FBQyxPQUFELE1BQUs7QUFBQSxLQUNyQixvQ0FBQyxRQUFELE1BQ0ksb0NBQUMsUUFBRDtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQo=
import react_cjsImport0 from "/web_modules/react/index.js?namespace=file";
const React = react_cjsImport0 && react_cjsImport0.__esModule ? react_cjsImport0.default : react_cjsImport0;
const useEffect = react_cjsImport0["useEffect"];
const useState = react_cjsImport0["useState"];;
export default function Page() {
  const [state, setState] = useState("");
  useEffect(() => {
    setTimeout(() => {
      setState("Dynamic content!");
    }, 1e3);
  }, []);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", null, "About me:"), /* @__PURE__ */ React.createElement("p", null, "I Am Me"), /* @__PURE__ */ React.createElement("p", null, "..."), /* @__PURE__ */ React.createElement("p", null, "cool"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("p", null, state));
}
console.log("loaded");

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL21vcnNlL0RvY3VtZW50cy9HaXRIdWIvZXNwYWNrL2ZpeHR1cmVzL3dpdGgtcGFnZXMvcGFnZXMvYWJvdXQudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBQYWdlKCkge1xuICAgIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGUoJycpXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBzZXRTdGF0ZSgnRHluYW1pYyBjb250ZW50IScpXG4gICAgICAgIH0sIDEwMDApXG4gICAgfSwgW10pXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxwPkFib3V0IG1lOjwvcD5cbiAgICAgICAgICAgIDxwPkkgQW0gTWU8L3A+XG4gICAgICAgICAgICA8cD4uLi48L3A+XG4gICAgICAgICAgICA8cD5jb29sPC9wPlxuICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICA8cD57c3RhdGV9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICApXG59XG5cbmNvbnNvbGUubG9nKCdsb2FkZWQnKVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFFQTtBQUNJLFFBQU0sb0JBQW9CLFNBQVM7QUFDbkMsWUFBVTtBQUNOLGVBQVc7QUFDUCxlQUFTO0FBQUEsT0FDVjtBQUFBLEtBQ0o7QUFDSCxTQUNJLG9DQUFDLE9BQUQsTUFDSSxvQ0FBQyxLQUFELE1BQUcsY0FDSCxvQ0FBQyxLQUFELE1BQUcsWUFDSCxvQ0FBQyxLQUFELE1BQUcsUUFDSCxvQ0FBQyxLQUFELE1BQUcsU0FDSCxvQ0FBQyxNQUFELE9BQ0Esb0NBQUMsS0FBRCxNQUFJO0FBQUE7QUFLaEIsUUFBUSxJQUFJOyIsCiAgIm5hbWVzIjogW10KfQo=
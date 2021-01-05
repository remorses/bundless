import '/_hmr_client.js?namespace=hmr-client';
var define_process_default = {};
import {useLocation} from "/web_modules/react-router-dom/esm/react-router-dom.js?namespace=file";
import useSWR from "/web_modules/swr/esm/index.js?namespace=file";
import {useMahoContext} from "/.../.../paged/src/client/context.ts?namespace=file";
export {useMahoContext, MahoContext} from "/.../.../paged/src/client/context.ts?namespace=file";
const routeDataFetcher = async (pathname) => {
  return fetch(pathname, {
    headers: {
      accept: "application/json"
    }
  }).then((res) => res.json()).then((data) => data[pathname]);
};
export const useRouteData = () => {
  const {routeData = {}} = useMahoContext();
  const location = useLocation();
  if (define_process_default["browser"]) {
    const state = window["INITIAL_STATE"];
    const {data} = useSWR(location.pathname, routeDataFetcher, {
      suspense: true,
      initialData: routeData[location.pathname],
      revalidateOnMount: state.revalidateOnMount
    });
    return data;
  }
  return routeData[location.pathname] || {};
};

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL21vcnNlL0RvY3VtZW50cy9HaXRIdWIvZXNwYWNrL3BhZ2VkL3NyYy9jbGllbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IHVzZUxvY2F0aW9uIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbmltcG9ydCB1c2VTV1IgZnJvbSAnc3dyJ1xuXG5pbXBvcnQgeyB1c2VNYWhvQ29udGV4dCB9IGZyb20gJy4vY29udGV4dCdcblxuZXhwb3J0IHsgdXNlTWFob0NvbnRleHQsIE1haG9Db250ZXh0IH0gZnJvbSAnLi9jb250ZXh0J1xuXG5jb25zdCByb3V0ZURhdGFGZXRjaGVyID0gYXN5bmMgKHBhdGhuYW1lOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gZmV0Y2gocGF0aG5hbWUsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgYWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgfSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IGRhdGFbcGF0aG5hbWVdKVxufVxuXG5leHBvcnQgY29uc3QgdXNlUm91dGVEYXRhID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgcm91dGVEYXRhID0ge30gfSA9IHVzZU1haG9Db250ZXh0KClcbiAgICBjb25zdCBsb2NhdGlvbiA9IHVzZUxvY2F0aW9uKClcblxuICAgIGlmIChwcm9jZXNzWydicm93c2VyJ10pIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB3aW5kb3dbJ0lOSVRJQUxfU1RBVEUnXVxuICAgICAgICBjb25zdCB7IGRhdGEgfSA9IHVzZVNXUihsb2NhdGlvbi5wYXRobmFtZSwgcm91dGVEYXRhRmV0Y2hlciwge1xuICAgICAgICAgICAgc3VzcGVuc2U6IHRydWUsXG4gICAgICAgICAgICBpbml0aWFsRGF0YTogcm91dGVEYXRhW2xvY2F0aW9uLnBhdGhuYW1lXSxcbiAgICAgICAgICAgIHJldmFsaWRhdGVPbk1vdW50OiBzdGF0ZS5yZXZhbGlkYXRlT25Nb3VudCxcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG5cbiAgICByZXR1cm4gcm91dGVEYXRhW2xvY2F0aW9uLnBhdGhuYW1lXSB8fCB7fVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvYWRGdW5jdGlvbkNvbnRleHQge1xuICAgIHBhcmFtczoge1xuICAgICAgICBbazogc3RyaW5nXTogc3RyaW5nIHwgc3RyaW5nW11cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIExvYWRGdW5jdGlvbiA9IChcbiAgICBjdHg6IExvYWRGdW5jdGlvbkNvbnRleHQsXG4pID0+IG9iamVjdCB8IFByb21pc2U8b2JqZWN0PlxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBO0FBQ0E7QUFFQTtBQUVBO0FBRUEsTUFBTSxtQkFBbUI7QUFDckIsU0FBTyxNQUFNLFVBQVU7QUFBQSxJQUNuQixTQUFTO0FBQUEsTUFDTCxRQUFRO0FBQUE7QUFBQSxLQUdYLEtBQUssU0FBUyxJQUFJLFFBQ2xCLEtBQUssVUFBVSxLQUFLO0FBQUE7QUFHdEIsNEJBQXFCO0FBQ3hCLFNBQVEsWUFBWSxNQUFPO0FBQzNCLG1CQUFpQjtBQUVqQixNQUFJLHVCQUFRO0FBQ1Isa0JBQWMsT0FBTztBQUNyQixXQUFRLFFBQVMsT0FBTyxTQUFTLFVBQVUsa0JBQWtCO0FBQUEsTUFDekQsVUFBVTtBQUFBLE1BQ1YsYUFBYSxVQUFVLFNBQVM7QUFBQSxNQUNoQyxtQkFBbUIsTUFBTTtBQUFBO0FBRTdCLFdBQU87QUFBQTtBQUdYLFNBQU8sVUFBVSxTQUFTLGFBQWE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
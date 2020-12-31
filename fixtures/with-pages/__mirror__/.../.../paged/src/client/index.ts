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
  const {routeData} = useMahoContext();
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL21vcnNlL0RvY3VtZW50cy9HaXRIdWIvZXNwYWNrL3BhZ2VkL3NyYy9jbGllbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IHVzZUxvY2F0aW9uIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSdcbmltcG9ydCB1c2VTV1IgZnJvbSAnc3dyJ1xuXG5pbXBvcnQgeyB1c2VNYWhvQ29udGV4dCB9IGZyb20gJy4vY29udGV4dCdcblxuZXhwb3J0IHsgdXNlTWFob0NvbnRleHQsIE1haG9Db250ZXh0IH0gZnJvbSAnLi9jb250ZXh0J1xuXG5jb25zdCByb3V0ZURhdGFGZXRjaGVyID0gYXN5bmMgKHBhdGhuYW1lOiBzdHJpbmcpID0+IHtcbiAgcmV0dXJuIGZldGNoKHBhdGhuYW1lLCB7XG4gICAgaGVhZGVyczoge1xuICAgICAgYWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgfSxcbiAgfSlcbiAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgIC50aGVuKChkYXRhKSA9PiBkYXRhW3BhdGhuYW1lXSlcbn1cblxuXG5cbmV4cG9ydCBjb25zdCB1c2VSb3V0ZURhdGEgPSAoKSA9PiB7XG4gIGNvbnN0IHsgcm91dGVEYXRhIH0gPSB1c2VNYWhvQ29udGV4dCgpXG4gIGNvbnN0IGxvY2F0aW9uID0gdXNlTG9jYXRpb24oKVxuXG4gIGlmIChwcm9jZXNzWydicm93c2VyJ10pIHtcbiAgICBjb25zdCBzdGF0ZSA9IHdpbmRvd1snSU5JVElBTF9TVEFURSddXG4gICAgY29uc3QgeyBkYXRhIH0gPSB1c2VTV1IobG9jYXRpb24ucGF0aG5hbWUsIHJvdXRlRGF0YUZldGNoZXIsIHtcbiAgICAgIHN1c3BlbnNlOiB0cnVlLFxuICAgICAgaW5pdGlhbERhdGE6IHJvdXRlRGF0YVtsb2NhdGlvbi5wYXRobmFtZV0sXG4gICAgICByZXZhbGlkYXRlT25Nb3VudDogc3RhdGUucmV2YWxpZGF0ZU9uTW91bnQsXG4gICAgfSlcbiAgICByZXR1cm4gZGF0YVxuICB9XG5cbiAgcmV0dXJuIHJvdXRlRGF0YVtsb2NhdGlvbi5wYXRobmFtZV0gfHwge31cbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2FkRnVuY3Rpb25Db250ZXh0IHtcbiAgcGFyYW1zOiB7XG4gICAgW2s6IHN0cmluZ106IHN0cmluZyB8IHN0cmluZ1tdXG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgTG9hZEZ1bmN0aW9uID0gKFxuICBjdHg6IExvYWRGdW5jdGlvbkNvbnRleHQsXG4pID0+IG9iamVjdCB8IFByb21pc2U8b2JqZWN0PlxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBO0FBQ0E7QUFFQTtBQUVBO0FBRUEsTUFBTSxtQkFBbUI7QUFDdkIsU0FBTyxNQUFNLFVBQVU7QUFBQSxJQUNyQixTQUFTO0FBQUEsTUFDUCxRQUFRO0FBQUE7QUFBQSxLQUdULEtBQUssU0FBUyxJQUFJLFFBQ2xCLEtBQUssVUFBVSxLQUFLO0FBQUE7QUFLbEIsNEJBQXFCO0FBQzFCLFNBQVEsYUFBYztBQUN0QixtQkFBaUI7QUFFakIsTUFBSSx1QkFBUTtBQUNWLGtCQUFjLE9BQU87QUFDckIsV0FBUSxRQUFTLE9BQU8sU0FBUyxVQUFVLGtCQUFrQjtBQUFBLE1BQzNELFVBQVU7QUFBQSxNQUNWLGFBQWEsVUFBVSxTQUFTO0FBQUEsTUFDaEMsbUJBQW1CLE1BQU07QUFBQTtBQUUzQixXQUFPO0FBQUE7QUFHVCxTQUFPLFVBQVUsU0FBUyxhQUFhO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
import { useLocation } from 'react-router-dom'
import useSWR from 'swr'

import { useMahoContext } from './context'

export { useMahoContext, MahoContext } from './context'

const routeDataFetcher = async (pathname: string) => {
  return fetch(pathname, {
    headers: {
      accept: 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => data[pathname])
}



export const useRouteData = () => {
  const { routeData } = useMahoContext()
  const location = useLocation()

  if (process['browser']) {
    const state = window['INITIAL_STATE']
    const { data } = useSWR(location.pathname, routeDataFetcher, {
      suspense: true,
      initialData: routeData[location.pathname],
      revalidateOnMount: state.revalidateOnMount,
    })
    return data
  }

  return routeData[location.pathname] || {}
}

export interface LoadFunctionContext {
  params: {
    [k: string]: string | string[]
  }
}

export type LoadFunction = (
  ctx: LoadFunctionContext,
) => object | Promise<object>

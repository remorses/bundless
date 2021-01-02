import React from 'react'
import { HelmetData } from 'react-helmet'

export const MahoContext = React.createContext<{
    url?: string
    helmet?: HelmetData
    statusCode?: number
    routeData?: { [path: string]: any }
} | null>(null)

export const useMahoContext = () => {
    const context = React.useContext(MahoContext)
    if (!context) {
        throw new Error(`cannot get maho context`)
    }
    return context
}

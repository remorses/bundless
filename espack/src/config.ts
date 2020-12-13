export interface Config {
    root?: string
    port?: number
    cors?: boolean
    jsx?:
        | 'vue'
        | 'preact'
        | 'react'
        | {
              factory?: string
              fragment?: string
          }
}


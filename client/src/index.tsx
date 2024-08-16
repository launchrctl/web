import './I18n'

import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <React.Suspense fallback="Loading">
      <App />
    </React.Suspense>
  </React.StrictMode>
)

window.onload = () => {
  const preloader = document.getElementById('app-preloader')
  if (preloader) {
    preloader.remove()
  }
}

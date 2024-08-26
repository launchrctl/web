const isProductionMode = import.meta.env.MODE === 'production'
const addDefaultPort = (protocol: string) =>
  protocol === 'https:' ? ':443' : ':80'

export function getApiUrl() {
  let url = import.meta.env.VITE_API_URL

  if (isProductionMode) {
    const { location } = window
    url = location.origin

    if (!location.port) {
      url += addDefaultPort(location.protocol)
    }

    url += '/api'
  }

  return url
}

export function getWebSocketUrl() {
  let url = import.meta.env.VITE_WEBSOCKET_URL

  if (isProductionMode) {
    const { location } = window
    url = location.protocol === 'https:' ? 'wss://' : 'ws://'
    url += location.host
    if (!location.port) {
      url += addDefaultPort(location.protocol)
    }

    url += '/ws'
  }

  return url
}

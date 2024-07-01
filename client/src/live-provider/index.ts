import { LiveProvider } from '@refinedev/core'
import {
  ICloseEvent,
  IMessageEvent,
  w3cwebsocket as W3CWebSocket,
} from 'websocket'

const websocketUrl = 'ws://localhost:8080/ws'
let actionsSocket = new W3CWebSocket(websocketUrl)

const reconnectInterval = 5000
let reconnectAttempts = 0
const maxReconnectAttempts = 10

const handleOpen = () => {
  console.log('WebSocket connection opened')
  reconnectAttempts = 0
}

const handleClose = (event: ICloseEvent) => {
  if (event.wasClean) {
    console.log(
      `WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`
    )
  } else {
    console.log('WebSocket connection lost unexpectedly')

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (attempt ${reconnectAttempts})...`)
        actionsSocket = new W3CWebSocket(websocketUrl)
        setupWebSocketHandlers()
      }, reconnectInterval)
    } else {
      console.error('Max reconnect attempts reached')
    }
  }
}

const handleError = (error: Error) => {
  console.error('WebSocket error:', error)
}

const setupWebSocketHandlers = () => {
  actionsSocket.onopen = handleOpen
  actionsSocket.onclose = handleClose
  actionsSocket.onerror = handleError
}

setupWebSocketHandlers()

export const liveProvider: LiveProvider = {
  subscribe: async ({ channel, callback }) => {
    const handleMessage = (e: IMessageEvent) => {
      const data = JSON.parse(e.data.toString())
      const event = {
        channel,
        type: data.message,
        payload: { data },
        date: new Date(),
      }
      callback(event)
    }

    actionsSocket.onmessage = handleMessage

    return () => {
      // TODO: Add unsubscribe.
    }
  },
  unsubscribe: (unsubscribe) => {
    unsubscribe.then((f: () => void) => f())
  },
  publish: async ({ channel, payload }) => {
    const message = {
      message: channel === 'processes' ? 'get-processes' : 'get-streams',
      ...payload,
    }
    actionsSocket.send(JSON.stringify(message))
  },
}

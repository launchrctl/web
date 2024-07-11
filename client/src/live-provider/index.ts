import { LiveEvent, LiveProvider } from '@refinedev/core'
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

const messageHandlers = new Map<
  string,
  Map<string, Set<(event: LiveEvent) => void>>
>()

const handleMessage = (e: IMessageEvent) => {
  try {
    const data = JSON.parse(e.data.toString())
    const event = {
      channel: data.channel,
      type: data.message,
      payload: { data },
      date: new Date(),
    }

    messageHandlers
      .get(event.channel)
      ?.get(event.type)
      ?.forEach((callback) => callback(event))
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
  }
}

const setupWebSocketHandlers = () => {
  actionsSocket.onopen = handleOpen
  actionsSocket.onclose = handleClose
  actionsSocket.onerror = handleError
  actionsSocket.onmessage = handleMessage
}

setupWebSocketHandlers()

export const liveProvider: LiveProvider = {
  subscribe: async ({ channel, callback, types }) => {
    if (!messageHandlers.has(channel)) {
      messageHandlers.set(channel, new Map())
    }

    for (const type of types) {
      if (!messageHandlers.get(channel)?.has(type)) {
        messageHandlers.get(channel)?.set(type, new Set())
      }
      messageHandlers.get(channel)?.get(type)?.add(callback)
    }

    return () => {
      // TODO: Add unsubscribe.
    }
  },
  unsubscribe: (unsubscribe) => {
    unsubscribe.then((f: () => void) => f())
  },
  publish: async ({ payload, type }) => {
    const message = {
      message: type,
      ...payload,
    }
    actionsSocket.send(JSON.stringify(message))
  },
}

export default async function () {
  return {
    receve: [
      {
        server: "websocket",
        channel: "actionsList",
      }
    ]
  }
}

// export const lifecycleEvent = "onServerConnectionOpen"

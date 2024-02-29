import { Message } from '@asyncapi/glee';

const ids = [
  "example.foundation.software.flatcar:bump - PROCESS_ID",
  "example.integration.application.bus:watch - PROCESS_ID",
  "example.platform:build - PROCESS_ID",
  "example.platform:bump - PROCESS_ID",
  "example.ui:cowsay - PROCESS_ID"
]

const statuses = [
  "not started",
  "running",
  "finished"
]

const generateRandomArray = () => {
  return ids.map((id) => ({
    id,
    status: statuses[Math.floor(Math.random() * statuses.length)]
  }));
};


export default async function ({
  glee,
  channel,
  connection,
}) {
  if (connection.hasChannel('actionsRun')) {
    setInterval(() => {
      glee.send(new Message({
        channel: 'actionsRun',
        connection,
        payload: generateRandomArray()
      }));
    }, 3000)
  }

  // return {
  //   send: [
  //     {
  //       server: "websocket",
  //       channel: "actionsRun",
  //       payload: generateRandomArray()
  //     }
  //   ]
  // }
}

export const lifecycleEvent = "onServerConnectionOpen"

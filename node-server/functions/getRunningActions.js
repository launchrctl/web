const ids = [
  "example.foundation.software.flatcar:bump",
  "example.integration.application.bus:watch",
  "example.platform:build",
  "example.platform:bump",
  "example.ui:cowsay"
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

export default async function () {
  return {
    send: [{
      payload: generateRandomArray()
    }]
  }
}

import { WebSocketServer } from "ws"
import si from "systeminformation";

const ws = new WebSocketServer({ port: 3000 })

ws.on("connection", function connection(socket) {
  socket.on("message", function message(data) {
    console.log("received: %s", data)
  })

  setInterval(async () => {
    const cpuTemp = JSON.stringify(await si.currentLoad());
    socket.send(cpuTemp);
  }, 1000);
})
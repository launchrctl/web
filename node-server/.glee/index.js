var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { WebSocketServer } from "ws";
import si from "systeminformation";
const ws = new WebSocketServer({ port: 3000 });
ws.on("connection", function connection(socket) {
    socket.on("message", function message(data) {
        console.log("received: %s", data);
    });
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        const cpuTemp = JSON.stringify(yield si.currentLoad());
        socket.send(cpuTemp);
    }), 1000);
});

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Message } from '@asyncapi/glee';
const ids = [
    "example.foundation.software.flatcar:bump - PROCESS_ID",
    "example.integration.application.bus:watch - PROCESS_ID",
    "example.platform:build - PROCESS_ID",
    "example.platform:bump - PROCESS_ID",
    "example.ui:cowsay - PROCESS_ID"
];
const statuses = [
    "not started",
    "running",
    "finished"
];
const generateRandomArray = () => {
    return ids.map((id) => ({
        id,
        status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
};
export default function ({ glee, channel, connection, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (connection.hasChannel('actionsRun')) {
            setInterval(() => {
                glee.send(new Message({
                    channel: 'actionsRun',
                    connection,
                    payload: generateRandomArray()
                }));
            }, 3000);
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
    });
}
export const lifecycleEvent = "onServerConnectionOpen";

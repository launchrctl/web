var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { exec } from "node:child_process";
import { Message } from "@asyncapi/glee";
export default function ({ glee, channel, connection }) {
    return __awaiter(this, void 0, void 0, function* () {
        const cliCommand = `
    for ((i=1; i<=10; i++)); do
      echo "Line $i"
      sleep $((1 + RANDOM % 3))
    done
  `;
        const commandProcess = exec(cliCommand);
        let buffer = '';
        commandProcess.stdout.on("data", (data) => {
            buffer += data.toString();
            const lines = buffer.split("\n");
            if (lines.length > 1) {
                const newLines = lines.slice(0, -1);
                buffer = lines[lines.length - 1];
                newLines.forEach((line) => {
                    glee.send(new Message({
                        channel: "actionsRunStream",
                        connection,
                        payload: line.trim(),
                    }));
                });
            }
        });
        // Handle process completion
        commandProcess.once("close", (code) => {
            if (buffer.trim() !== '') {
                glee.send(new Message({
                    channel: "actionsRunStream",
                    connection,
                    payload: buffer.trim(),
                }));
            }
            glee.send(new Message({
                channel: "actionsRunStream",
                connection,
                payload: `Command exited with code ${code}`,
            }));
        });
    });
}

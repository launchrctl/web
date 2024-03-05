import { exec } from "node:child_process";
import { Message } from "@asyncapi/glee";

export default async function ({ glee, channel, connection }) {
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
        glee.send(
          new Message({
            channel: "actionsRunStream",
            connection,
            payload: line.trim(),
          })
        );
      });
    }
  });

  // Handle process completion
  commandProcess.once("close", (code) => {
    if (buffer.trim() !== '') {
      glee.send(
        new Message({
          channel: "actionsRunStream",
          connection,
          payload: buffer.trim(),
        })
      );
    }

    glee.send(
      new Message({
        channel: "actionsRunStream",
        connection,
        payload: `Command exited with code ${code}`,
      })
    );
  });
}

import { LiveProvider, LiveEvent } from "@refinedev/core";
import { w3cwebsocket } from "websocket";

const actionsSocket = new w3cwebsocket("ws://localhost:3000/actions-list");
const runningActionsSocket = new w3cwebsocket("ws://localhost:3000/actions/actionId/running/runId");
const actionStreamSocket = new w3cwebsocket("ws://localhost:3000/actions-stream");

export const liveProvider: LiveProvider = {
  subscribe: async ({ channel, params, types, callback, meta }) => {
    actionsSocket.onopen = () => {
      actionsSocket.send("get actions");
    };

    actionsSocket.onmessage = (e) => {
      const event = {
        channel: "actions-list",
        type: "get-actions-list",
        payload: {
          actions: JSON.parse(e.data.toString()),
        },
        date: new Date(),
      };
      callback(event);
    };

    actionStreamSocket.onmessage = (e) => {
      const event = {
        channel: "stdout-result",
        type: "get-stdout",
        payload: JSON.parse(e.data.toString()),
        date: new Date(),
      };
      callback(event);
    };

    runningActionsSocket.onmessage = (e) => {
      const event = {
        channel: "running-actions-list",
        type: "get-runing-actions-list",
        payload: {
          actions: JSON.parse(e.data.toString()),
        },
        date: new Date(),
      };
      callback(event);
    };


    return {
      unsubscribe: () => {},
    };
  },
  unsubscribe: (unsubscribe) => {
    // unsubscribe();
  },
  publish: async ({ channel, type, payload, date }) => {
    if (channel === 'resorces/actions') {
      actionsSocket.send("get actions");
    }

    if (channel === 'resorces/streams') {
      actionStreamSocket.send("get actions");
    }
  },
};

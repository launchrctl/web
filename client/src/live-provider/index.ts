import { LiveProvider, LiveEvent } from "@refinedev/core";
import { w3cwebsocket } from "websocket";

const socket = new w3cwebsocket("ws://localhost:3000/actions-list");

export const liveProvider: LiveProvider = {
  subscribe: async ({ channel, params, types, callback, meta }) => {
    socket.onopen = () => {
      socket.send("get actions");
    };

    socket.onmessage = (e) => {
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

    return {
      unsubscribe: () => {},
    };
  },
  unsubscribe: (unsubscribe) => {
    // unsubscribe();
  },
  publish: async ({ channel, type, payload, date }) => {
    // Publish the data to the resource channel using Socket.IO
    socket.send("get actions");
  },
};

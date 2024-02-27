import { useList } from "@refinedev/core";
import { useState } from "react";
export const AsyncActionList: React.FC = () => {
  const [actions, setActions] = useState([]);
  useList({
    liveMode: "manual",
    onLiveEvent: (event) => {
      console.log(event?.payload?.actions)
      setActions(event?.payload?.actions)
    },
  });

  return (
    <ul>
      {actions.map((action) => (
        <li key={action.id}>
          <h4>
            {action.title} - ({action.description})
          </h4>
        </li>
      ))}
    </ul>
  );
}



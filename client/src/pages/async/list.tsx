import { useList, usePublish } from "@refinedev/core";
import { useState } from "react";
import {
  Box,
  Button,
  Code,
  Heading,
  List,
  ListItem,
  ListIcon,
  OrderedList,
  Stack,
  UnorderedList,
} from "@chakra-ui/react";

import { ArrowRightIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";

export const AsyncActionList: React.FC = () => {
  const [actions, setActions] = useState([]);
  const [running, setRunning] = useState([]);
  const publish = usePublish();
  const [output, setOutput] = useState("");

  useList({
    liveMode: "manual",
    onLiveEvent: (event) => {
      if (event.type === "get-actions-list") {
        setActions(event?.payload?.actions);
      }

      if (event.type === "get-runing-actions-list") {
        setRunning(event?.payload?.actions);
      }

      if (event.type === "get-stdout") {
        setOutput((prevOutput) => prevOutput + (event?.payload || "") + "\n");
      }
    },
  });

  const onSubmit = () => {
    if (publish) {
      publish({
        channel: "resorces/streams",
        type: "get stdout",
        payload: {},
        date: new Date(),
      });
    }
  };

  return (
    <Stack>
      <Heading>Dynamic actions list</Heading>
      <UnorderedList spacing={3}>
        {actions.map((action) => (
          <ListItem key={action.id}>
            <p>
              {action.title} - ({action.description})
            </p>
          </ListItem>
        ))}
      </UnorderedList>

      <Heading>Dynamic running actions list (every 3 sec)</Heading>
      <UnorderedList spacing={3}>
        {running.map((action) => (
          <ListItem key={action.id}>
            {action.status === "finished" && <CheckIcon color="green.500" />}
            {action.status === "running" && <ArrowRightIcon color="red.500" />}
            {action.status === "not started" && <CloseIcon color="black.500" />}
            {action.id} - {action.status}
          </ListItem>
        ))}
      </UnorderedList>

      <Heading>Stdout</Heading>
      <Button onClick={onSubmit}>trigger stdout</Button>
      <Stack spacing={4}>
        <Box borderWidth={1} borderRadius="md" p={4}>
          <Code whiteSpace="pre-wrap" fontSize="sm">
            {output}
          </Code>
        </Box>
      </Stack>
    </Stack>
  );
};

import type { IResourceComponentsProps } from "@refinedev/core";
import { ChakraUIListInferencer } from "@refinedev/inferencer/chakra-ui";
import * as React from "react";

export const ActionList: React.FC<IResourceComponentsProps> = () => (
  <ChakraUIListInferencer />
);

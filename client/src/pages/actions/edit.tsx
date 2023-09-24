import type { IResourceComponentsProps } from "@refinedev/core";
import { ChakraUIEditInferencer } from "@refinedev/inferencer/chakra-ui";
import * as React from "react";

export const ActionEdit: React.FC<IResourceComponentsProps> = () => (
  <ChakraUIEditInferencer />
);

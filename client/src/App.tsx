import { ChakraProvider } from "@chakra-ui/react";
import {
  ErrorComponent,
  RefineThemes,
  ThemedLayoutV2,
  ThemedTitleV2,
  useNotificationProvider,
} from "@refinedev/chakra-ui";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import * as React from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

import { Header } from "./components";
import { AppIcon } from "./components/app-icon";
import { ActionList, ActionShow } from "./pages/actions";
import { dataProvider as launchrDataProvider } from "./rest-data-provider";

const apiUrl = "http://localhost:8080/api";

export function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        {/* You can change the theme colors here. example: theme={RefineThemes.Magenta} */}
        <ChakraProvider theme={RefineThemes.Yellow}>
          <Refine
            dataProvider={{
              default: launchrDataProvider(apiUrl),
            }}
            notificationProvider={useNotificationProvider}
            routerProvider={routerBindings}
            resources={[
              {
                name: "actions",
                list: "/actions",
                show: "/actions/:id/show",
                // edit: "/actions/:id/edit",
                meta: {
                  canDelete: false,
                },
              },
            ]}
            options={{
              // syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <ThemedLayoutV2
                    Header={() => <Header sticky />}
                    Title={({ collapsed }) => (
                      <ThemedTitleV2
                        collapsed={collapsed}
                        text={"launchr" /* @todo use app name from API */}
                        icon={<AppIcon />}
                      />
                    )}
                  >
                    <Outlet />
                  </ThemedLayoutV2>
                }
              >
                <Route
                  index
                  element={<NavigateToResource resource="actions" />}
                />
                <Route path="/actions">
                  <Route index element={<ActionList />} />
                  <Route path=":id/show" element={<ActionShow />} />
                  {/*<Route path=":id/running/:runId" element={<ActionAttach />} />*/}
                  {/*<Route path=":id/edit" element={<ActionEdit />} />*/}
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>

            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </ChakraProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

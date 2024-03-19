import { Refine } from '@refinedev/core'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'
import { ErrorComponent, useNotificationProvider } from '@refinedev/mui'
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router-v6'
import * as React from 'react'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'

import { ThemedLayoutV2 } from './components/layout'
import { ThemedHeaderV2 } from './components/layout/Header'
import { ThemedSiderV2 } from './components/layout/Sider'
import { ThemedTitleV2 } from './components/layout/Title'
import { ActionList, ActionShow } from './pages/actions'
import { dataProvider as launchrDataProvider } from './rest-data-provider'
import { ThemeProvider } from './ThemeProvider'

const apiUrl = import.meta.env.VITE_API_URL

export function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <Refine
            dataProvider={{
              default: launchrDataProvider(apiUrl),
            }}
            notificationProvider={useNotificationProvider}
            routerProvider={routerBindings}
            resources={[
              {
                name: 'actions',
                list: '/actions',
                show: '/actions/:id/show',
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
                    Header={ThemedHeaderV2}
                    Sider={ThemedSiderV2}
                    Title={ThemedTitleV2}
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
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  )
}

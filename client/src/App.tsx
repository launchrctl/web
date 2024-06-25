import { Refine } from '@refinedev/core'
import { KBarProvider, RefineKbar } from '@refinedev/kbar'
import { ErrorComponent, useNotificationProvider } from '@refinedev/mui'
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router-v6'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'

import { ThemedLayoutV2 } from './components/layout'
import { ThemedHeaderV2 } from './components/layout/Header'
import { ThemedSiderV2 } from './components/layout/Sider'
import { ThemedTitleV2 } from './components/layout/Title'
import { ActionProvider } from './context/ActionContext'
import { ActionList, ActionShow } from './pages/actions'
import { FlowShow } from './pages/flow'
import { dataProvider as launchrDataProvider } from './rest-data-provider'
import { ThemeProvider } from './ThemeProvider'

const apiUrl = import.meta.env.VITE_API_URL

export function App() {
  const actions = [
    {
      id: 'blog',
      name: 'Do something good',
      shortcut: ['d'],
      keywords: 'writing words',
      perform: () => (window.location.pathname = 'blog'),
    },
    {
      id: 'contact',
      name: 'Do something very good',
      shortcut: ['c'],
      keywords: 'email',
      perform: () => (window.location.pathname = 'contact'),
    },
  ]

  return (
    <BrowserRouter>
      <KBarProvider actions={actions}>
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
                <Route path="/flow">
                  <Route
                    index
                    element={
                      <ActionProvider>
                        <FlowShow />
                      </ActionProvider>
                    }
                  />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>

            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </ThemeProvider>
      </KBarProvider>
    </BrowserRouter>
  )
}

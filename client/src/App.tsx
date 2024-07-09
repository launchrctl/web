import { Refine } from '@refinedev/core'
import { RefineKbar } from '@refinedev/kbar'
import { ErrorComponent, useNotificationProvider } from '@refinedev/mui'
import routerBindings, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from '@refinedev/react-router-v6'
import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'

import { GlobalKBarProvider } from './components/GlobalKBarProvider'
import { ThemedLayoutV2 } from './components/layout'
import { ThemedHeaderV2 } from './components/layout/Header'
import { ThemedSiderV2 } from './components/layout/Sider'
import { ThemedTitleV2 } from './components/layout/Title'
import { ActionProvider } from './context/ActionContext'
import AppProvider from './context/AppContext'
import { liveProvider } from './live-provider'
import { ActionList, ActionShow } from './pages/actions'
import { FlowShow } from './pages/flow'
import { WizardShow } from './pages/wizard'
import { dataProvider as launchrDataProvider } from './rest-data-provider'
import { ThemeProvider } from './ThemeProvider'
import { getApiUrl } from './utils/app-urls-resolver'
import { getCustomisation, setCustomisation } from './utils/page-customisation'

const apiUrl = getApiUrl()

const customTitleHandler = () => {
  return getCustomisation()?.plasmactl_web_ui_platform_page_name ?? 'Platform'
}

export function App() {
  useEffect(() => {
    setCustomisation()
  }, [])

  return (
    <AppProvider>
      <ActionProvider>
        <BrowserRouter>
          <ThemeProvider>
            <Refine
              dataProvider={{
                default: launchrDataProvider(apiUrl),
              }}
              liveProvider={liveProvider}
              notificationProvider={useNotificationProvider}
              routerProvider={routerBindings}
              resources={[
                {
                  name: 'actions',
                  list: '/actions',
                  show: '/actions/:id/show',
                  meta: {
                    canDelete: false,
                  },
                },
              ]}
              options={{
                liveMode: 'manual',
              }}
            >
              <GlobalKBarProvider>
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
                    <Route index element={<Navigate to="/flow" replace />} />
                    <Route path="/actions">
                      <Route index element={<ActionList />} />
                      <Route path=":id/show" element={<ActionShow />} />
                    </Route>
                    <Route path="/wizard">
                      <Route path=":id/show" element={<WizardShow />} />
                    </Route>
                    <Route path="/flow">
                      <Route index element={<FlowShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <UnsavedChangesNotifier />
                <DocumentTitleHandler handler={customTitleHandler} />
                <RefineKbar />
              </GlobalKBarProvider>
            </Refine>
          </ThemeProvider>
        </BrowserRouter>
      </ActionProvider>
    </AppProvider>
  )
}

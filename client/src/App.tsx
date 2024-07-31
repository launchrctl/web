import { Refine } from '@refinedev/core'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'
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

import { ThemedLayoutV2 } from './components/layout'
import { ThemedHeaderV2 } from './components/layout/Header'
import { ThemedSiderV2 } from './components/layout/Sider'
import { ThemedTitleV2 } from './components/layout/Title'
import { ActionProvider } from './context/ActionContext'
import AppProvider from './context/AppContext'
import { liveProvider } from './live-provider'
import { ActionList, ActionShow } from './pages/actions'
import { FlowShow } from './pages/flow'
import { dataProvider as launchrDataProvider } from './rest-data-provider'
import { ThemeProvider } from './ThemeProvider'
import { getApiUrl } from './utils/app-urls-resolver'
import { svgToBase64 } from './utils/helpers'

const apiUrl = getApiUrl()

const fetchData = async () => {
  const response = await fetch(`${apiUrl}/customisation`, {
    method: 'GET',
  })
  const data = await response.json()
  if (data?.plasmactl_web_ui_platform_favicon) {
    const base64Favicon = svgToBase64(data.plasmactl_web_ui_platform_favicon)
    sessionStorage.setItem('plasmactl_web_ui_platform_favicon', base64Favicon)
    setFavicon(base64Favicon)

    sessionStorage.setItem(
      'plasmactl_web_ui_platform_logo',
      data?.plasmactl_web_ui_platform_logo
    )
  }
  if (data?.plasmactl_web_ui_platform_logo) {
    const base64Logo = svgToBase64(data.plasmactl_web_ui_platform_logo)
    sessionStorage.setItem('plasmactl_web_ui_platform_logo', base64Logo)
  }

  if (data?.plasmactl_web_ui_platform_name) {
    sessionStorage.setItem(
      'plasmactl_web_ui_platform_name',
      data?.plasmactl_web_ui_platform_name
    )
  }
}

const setFavicon = (faviconUrl: string) => {
  const link: HTMLLinkElement =
    (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
    (document.createElement('link') as HTMLLinkElement)
  link.type = 'image/svg+xml'
  link.rel = 'icon'
  link.href = faviconUrl
  document.getElementsByTagName('head')[0].append(link)
}

export function App() {
  useEffect(() => {
    const favicon = sessionStorage.getItem('plasmactl_web_ui_platform_favicon')
    if (favicon) {
      setFavicon(favicon)
    } else {
      fetchData()
    }
  }, [])

  return (
    <AppProvider>
      <ActionProvider>
        <BrowserRouter>
          <RefineKbarProvider>
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
                    // edit: "/actions/:id/edit",
                    meta: {
                      canDelete: false,
                    },
                  },
                ]}
                options={{
                  liveMode: 'manual',
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
                    <Route index element={<Navigate to="/flow" replace />} />
                    <Route path="/actions">
                      <Route index element={<ActionList />} />
                      <Route path=":id/show" element={<ActionShow />} />
                      {/*<Route path=":id/running/:runId" element={<ActionAttach />} />*/}
                      {/*<Route path=":id/edit" element={<ActionEdit />} />*/}
                    </Route>
                    <Route path="/flow">
                      <Route index element={<FlowShow />} />
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
      </ActionProvider>
    </AppProvider>
  )
}

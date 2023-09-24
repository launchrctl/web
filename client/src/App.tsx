import { ChakraProvider } from "@chakra-ui/react";
import {
  ErrorComponent,
  notificationProvider,
  RefineThemes,
  ThemedLayoutV2,
  ThemedTitleV2,
} from "@refinedev/chakra-ui";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerBindings, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import dataProvider from "@refinedev/simple-rest";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

import { Header } from "./components";
import { AppIcon } from "./components/app-icon";
import { ActionList, ActionShow } from "./pages/actions";
import {
  BlogPostCreate,
  BlogPostEdit,
  BlogPostList,
  BlogPostShow,
} from "./pages/blog-posts";
import { dataProvider as launchrDataProvider } from "./rest-data-provider";

export function App() {
  const { t, i18n } = useTranslation();

  const i18nProvider = {
    translate: (key: string, params: Record<K, V>) => t(key, params),
    changeLocale: (lang: string) => i18n.changeLanguage(lang),
    getLocale: () => i18n.language,
  };

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        {/* You can change the theme colors here. example: theme={RefineThemes.Magenta} */}
        <ChakraProvider theme={RefineThemes.Yellow}>
          <Refine
            dataProvider={{
              default: launchrDataProvider("http://localhost:8080/api"),
              fake: dataProvider("https://api.fake-rest.refine.dev"),
            }}
            notificationProvider={notificationProvider}
            i18nProvider={i18nProvider}
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
              {
                name: "blog_posts",
                list: "/blog-posts",
                create: "/blog-posts/create",
                edit: "/blog-posts/edit/:id",
                show: "/blog-posts/show/:id",
                meta: {
                  canDelete: true,
                  dataProviderName: "fake",
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
                  {/*<Route path=":id/edit" element={<ActionEdit />} />*/}
                </Route>
                <Route path="/blog-posts">
                  <Route index element={<BlogPostList />} />
                  <Route path="create" element={<BlogPostCreate />} />
                  <Route path="edit/:id" element={<BlogPostEdit />} />
                  <Route path="show/:id" element={<BlogPostShow />} />
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

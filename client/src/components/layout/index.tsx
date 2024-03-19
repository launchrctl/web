import Box from '@mui/material/Box'
import type { RefineThemedLayoutV2Props } from '@refinedev/mui'
import { ThemedLayoutContextProvider } from '@refinedev/mui'
import type { FC } from 'react'

import { ThemedHeaderV2 as DefaultHeader } from './Header'
import { ThemedSiderV2 as DefaultSider } from './Sider'

export const ThemedLayoutV2: FC<RefineThemedLayoutV2Props> = ({
  Sider,
  Header,
  Title,
  Footer,
  OffLayoutArea,
  children,
  initialSiderCollapsed,
}) => {
  const SiderToRender = Sider ?? DefaultSider
  const HeaderToRender = Header ?? DefaultHeader

  return (
    <ThemedLayoutContextProvider initialSiderCollapsed={initialSiderCollapsed}>
      <Box display="flex" flexDirection="row">
        <SiderToRender Title={Title} />
        <Box
          sx={[
            {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: '100vh',
            },
            { overflow: 'auto' },
            { overflow: 'clip' },
          ]}
        >
          <HeaderToRender />
          <Box
            component="main"
            sx={{
              p: { xs: 0, md: 2, lg: 3 },
              flexGrow: 1,
              bgcolor: (theme) => theme.palette.background.default,
              '& > .MuiPaper-root, & > div:not([class]) > .MuiPaper-root': {
                borderRadius: {
                  xs: 0,
                  md: 1,
                },
              },
            }}
          >
            {children}
          </Box>
          {Footer && <Footer />}
        </Box>
        {OffLayoutArea && <OffLayoutArea />}
      </Box>
    </ThemedLayoutContextProvider>
  )
}

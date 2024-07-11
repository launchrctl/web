import Box from '@mui/material/Box'
import type { RefineThemedLayoutV2Props } from '@refinedev/mui'
import { ThemedLayoutContextProvider } from '@refinedev/mui'
import type { FC } from 'react'

import StatusBox from '../StatusBox'
import { ThemedHeaderV2 as DefaultHeader } from './Header'

export const ThemedLayoutV2: FC<RefineThemedLayoutV2Props> = ({
  Header,
  Footer,
  OffLayoutArea,
  children,
  initialSiderCollapsed,
}) => {
  const HeaderToRender = Header ?? DefaultHeader

  return (
    <ThemedLayoutContextProvider initialSiderCollapsed={initialSiderCollapsed}>
      <Box display="flex" flexDirection="row">
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
              flexGrow: 1,
              bgcolor: (theme) => theme.palette.background.default,
              paddingBlockEnd: '100px',
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
        <StatusBox />
      </Box>
    </ThemedLayoutContextProvider>
  )
}

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Hidden from "@mui/material/Hidden";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useActiveAuthProvider, useGetIdentity } from "@refinedev/core";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/mui";
import React from "react";

import { DarkModeSwitcher } from "./darkModeSwitcher";
import { HamburgerMenu } from "./hamburgerMenu";
import { ThemedTitleV2 as Title } from "./title";

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = () => {
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  return (
    <Hidden mdUp>
      <AppBar position="sticky" color="secondary">
        <Toolbar>
          <Title collapsed={false} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
              flexGrow: 1,
            }}
          >
            <DarkModeSwitcher />
            <HamburgerMenu />
          </Box>
          {/*<Stack*/}
          {/*  direction="row"*/}
          {/*  width="100%"*/}
          {/*  justifyContent="flex-end"*/}
          {/*  alignItems="center"*/}
          {/*>*/}
          {/*  <Stack*/}
          {/*    direction="row"*/}
          {/*    gap="16px"*/}
          {/*    alignItems="center"*/}
          {/*    justifyContent="center"*/}
          {/*  >*/}
          {/*    {user?.name && (*/}
          {/*      <Typography variant="subtitle2" data-testid="header-user-name">*/}
          {/*        {user?.name}*/}
          {/*      </Typography>*/}
          {/*    )}*/}
          {/*    {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}*/}
          {/*  </Stack>*/}
          {/*</Stack>*/}
        </Toolbar>
      </AppBar>
    </Hidden>
  );
};

import React from "react";
import { useGetIdentity, useActiveAuthProvider } from "@refinedev/core";
import { HamburgerMenu } from "./hamburgerMenu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Hidden from '@mui/material/Hidden';
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/mui";

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = () => {
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  return (
    <Hidden mdUp>
      <AppBar position="sticky" color="secondary">
        <Toolbar>
          <HamburgerMenu />
          <Stack
            direction="row"
            width="100%"
            justifyContent="flex-end"
            alignItems="center"
          >
            <Stack
              direction="row"
              gap="16px"
              alignItems="center"
              justifyContent="center"
            >
              {user?.name && (
                <Typography variant="subtitle2" data-testid="header-user-name">
                  {user?.name}
                </Typography>
              )}
              {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>
    </Hidden>
  );
};

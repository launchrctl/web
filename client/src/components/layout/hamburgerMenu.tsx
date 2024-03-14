import React from "react";
import { useThemedLayoutContext } from "@refinedev/mui";
import { Menu } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import type { IconButtonProps } from "@mui/material/IconButton";

const HamburgerIcon = (props: IconButtonProps) => (
  <IconButton color="inherit" aria-label="open drawer" edge="end" {...props}>
    <Menu />
  </IconButton>
);

export const HamburgerMenu: React.FC = () => {
  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  return (
    <>
      <HamburgerIcon
        onClick={() => setSiderCollapsed(!siderCollapsed)}
        sx={{
          mr: 2,
          display: { xs: "none", md: "flex" },
          ...(!siderCollapsed && { display: "none" }),
        }}
      />
      <HamburgerIcon
        onClick={() => setMobileSiderOpen(!mobileSiderOpen)}
        sx={{
          display: { xs: "flex", md: "none" },
        }}
      />
    </>
  );
};

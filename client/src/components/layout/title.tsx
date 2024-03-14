import React from "react";
import { useRouterContext, useLink, useRouterType } from "@refinedev/core";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { RefineLayoutThemedTitleProps } from "@refinedev/mui";
import Logo from "../../assets/logo.svg";
import { useTranslation } from 'react-i18next';

const defaultText = import.meta.env.VITE_APP_NAME;

export const ThemedTitleV2: React.FC<RefineLayoutThemedTitleProps> = ({
  collapsed,
  wrapperStyles,
  text = defaultText,
}) => {
  const { t } = useTranslation();
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();

  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  return (
    <>
      <MuiLink
        to="/"
        component={ActiveLink}
        underline="none"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          ...wrapperStyles,
        }}
      >
        <img src={Logo} width="24" height="24" alt={t("Logo")} />
        {!collapsed && (
          <Typography
            variant="h5"
            fontWeight={700}
            color="text.primary"
            fontSize="15px"
            textOverflow="ellipsis"
            overflow="hidden"
          >
            {text}
          </Typography>
        )}
      </MuiLink>
    </>
  );
};

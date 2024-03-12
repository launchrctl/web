import React, { ReactNode } from 'react';
import { RefineThemes, RefineSnackbarProvider } from "@refinedev/mui";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import {
  ThemeProvider as MuiThemeProvider,
  TypographyVariantsOptions,
  createTheme,
} from "@mui/material/styles";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";

interface ThemeProviderProps {
  children: ReactNode;
}

const typographyOptions: TypographyVariantsOptions = {
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: 16,
};

const theme = createTheme({
  ...RefineThemes.Blue,
  palette: {
    primary: {
      main: "#000",
    },
    secondary: {
      main: "#1570EF",
    },
  },
  typography: {
    ...typographyOptions,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => (
  // Available themes: Blue, Purple, Magenta, Red, Orange, Yellow, Green
  // Change the line below to change the theme
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
    <RefineSnackbarProvider>{children}</RefineSnackbarProvider>
  </MuiThemeProvider>
);

export default ThemeProvider;

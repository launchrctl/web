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

export const ThemeProvider = ({ children }) => (
  // Available themes: Blue, Purple, Magenta, Red, Orange, Yellow, Green
  // Change the line below to change the theme
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
    <RefineSnackbarProvider>{children}</RefineSnackbarProvider>
  </MuiThemeProvider>
);

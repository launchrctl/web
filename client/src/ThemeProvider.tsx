import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'

import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import type { TypographyVariantsOptions } from '@mui/material/styles'
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from '@mui/material/styles'
import { useMediaQuery } from '@mui/system'
import { RefineSnackbarProvider, RefineThemes } from '@refinedev/mui'
import type { FC, ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

interface IThemeProviderProps {
  children: ReactNode
}

const typographyOptions: TypographyVariantsOptions = {
  fontFamily: ['Inter', 'Arial', 'sans-serif'].join(','),
  fontSize: 16,
}

interface IThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<IThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {
    // Toggles dark mode state
  },
})

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = () => useContext(ThemeContext)

const ThemeProvider: FC<IThemeProviderProps> = ({ children }) => {
  let hasDarkModeValue = useMediaQuery('(prefers-color-scheme: dark)')
  const storage = localStorage.getItem('darkMode')

  if (storage === 'true') {
    hasDarkModeValue = true
  } else if (storage === 'false') {
    hasDarkModeValue = false
  }

  const [isDarkMode, setDarkMode] = useState<boolean>(hasDarkModeValue)

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString())
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setDarkMode(!isDarkMode)
  }

  const theme = createTheme({
    ...RefineThemes.Blue,
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#fff' : '#000',
      },
      secondary: {
        main: isDarkMode ? '#000' : '#fff',
      },
    },
    typography: {
      ...typographyOptions,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: 18,
            borderRadius: 28,
            textTransform: 'none',
            fontWeight: 600,
            lineHeight: 1.55,
            '& .MuiButton-startIcon > *:nth-of-type(1)': {
              fontSize: 24,
            },
          },
        },
      },
    },
  })

  return (
    // Available themes: Blue, Purple, Magenta, Red, Orange, Yellow, Green
    // Change the line below to change the theme
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
      <RefineSnackbarProvider>
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
          {children}
        </ThemeContext.Provider>
      </RefineSnackbarProvider>
    </MuiThemeProvider>
  )
}

export { ThemeProvider }

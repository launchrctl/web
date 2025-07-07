import { getApiUrl } from './app-urls-resolver'
import { svgToBase64 } from './helpers'

const apiUrl = getApiUrl()

export const setCustomisation = async () => {
  const response = await fetch(`${apiUrl}/customisation`, {
    method: 'GET',
  })
  const data = await response.json()
  sessionStorage.setItem('plasmactl_web_ui_customisation', JSON.stringify(data))

  setFavicon()
  return data
}

export const getCustomisation = () => {
  const customisation = sessionStorage.getItem('plasmactl_web_ui_customisation')
  if (customisation) {
    const parsed = JSON.parse(customisation)
    if (parsed) {
      if (parsed.favicon) {
        parsed.favicon = svgToBase64(
          parsed.favicon
        )
      }
      if (parsed.logo) {
        parsed.logo = svgToBase64(
          parsed.logo
        )
      }
      return parsed
    }
  }
  return {}
}

export const setFavicon = () => {
  const favicon = getCustomisation()?.favicon
  if (favicon) {
    const link: HTMLLinkElement =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
      (document.createElement('link') as HTMLLinkElement)
    link.type = 'image/svg+xml'
    link.rel = 'icon'
    link.href = favicon
    document.getElementsByTagName('head')[0]?.append(link)
  }
}

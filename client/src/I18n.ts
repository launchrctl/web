import i18next from 'i18next'
import detector from 'i18next-browser-languagedetector'
import Backend from 'i18next-xhr-backend'
import { initReactI18next } from 'react-i18next'

export default i18next
  .use(Backend)
  .use(detector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common'],
    defaultNS: 'common',
    fallbackLng: ['en'],
  })

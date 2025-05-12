import type { GenericObjectType, UiSchema } from '@rjsf/utils'
import { components } from '../../openapi'

export const sentenceCase = (a: string) => {
  const b = a.replaceAll(/[_-]/g, ' ')
  return b.charAt(0).toUpperCase() + b.slice(1)
}

export const splitActionId = (actionId: string) => {
  const isAction = actionId.includes(':')
  if (!actionId.includes(':') && !isAction) {
    return { levels: [], id: actionId, isRoot: true, isAction }
  }

  const [path, id] = actionId.split(':')
  const levels = path ? path.split('.') : []
  return { levels, id, isRoot: false, isAction }
}

export const splitRunId = (runId: string) => {
  const [timestamp, id] = runId.split('___')
  return { id, timestamp }
}

// If field label contains word password or passphrase
export const customizeUiSchema = (
  schema: GenericObjectType,
  parentKey = ''
): UiSchema => {
  const uiSchema: UiSchema = {}

  for (const key of Object.keys(schema.properties || {})) {
    const property = schema.properties[key]
    const fullKey = parentKey ? `${parentKey}.${key}` : key

    if (property.type === 'object') {
      uiSchema[key] = customizeUiSchema(property, fullKey)
    } else if (
      property.title &&
      (property.title.toLowerCase().includes('password') ||
        property.title.toLowerCase().includes('passphrase'))
    ) {
      uiSchema[key] = {
        'ui:widget': 'password',
      }
    }
  }

  return uiSchema
}

export const extractDateTimeFromId = (id: string) : string => {
  const timestampStr = id.split('-')[0]?.toString()
  if (!timestampStr) {
    return ''
  }

  const timestamp = Number.parseInt(timestampStr, 10)
  const date = new Date(timestamp * 1000)
  const formattedDate = date.toLocaleString()

  return formattedDate
}

export const svgToBase64 = (svg: string) => {
  const base64 = btoa(
    encodeURIComponent(svg).replaceAll(/%([\dA-F]{2})/g, (_, p1) =>
      String.fromCodePoint(Number.parseInt(p1, 16))
    )
  )
  return `data:image/svg+xml;base64,${base64}`
}


export const getStorageItem = (key: string) => {
  const item = sessionStorage.getItem(key)
  if (item) {
    return JSON.parse(item)
  }
  return null
}

export const setStorageItem = (key: string, value: components['schemas']['ActionRunInfo']) => {
  sessionStorage.setItem(key, JSON.stringify(value))
}
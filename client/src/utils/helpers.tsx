import { GetListResponse } from '@refinedev/core'
import type { GenericObjectType, UiSchema } from '@rjsf/utils'

export const sentenceCase = (a: string) => {
  const b = a.replaceAll(/[_-]/g, ' ')
  return b.charAt(0).toUpperCase() + b.slice(1)
}

export const splitActionId = (actionId: string) => {
  const [path, id] = actionId.split(':')
  const levels = path?.split('.') || []
  return { levels, id }
}

// Returns array of ids of duplicated actions
export const checkIfDuplicatedActions = (actions: GetListResponse) => {
  const mapCountIds = new Map()

  actions.data.forEach(({ id }) => {
    mapCountIds.set(id, (mapCountIds.get(id) || 0) + 1)
  })

  return [...mapCountIds].filter(([, value]) => value > 1).map(([id]) => id)
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

export const extractDateTimeFromId = (id: string) => {
  const timestampStr = id.split('-')[0]?.toString()
  if (!timestampStr) {
    return null
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

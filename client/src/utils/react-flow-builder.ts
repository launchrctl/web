import { GetListResponse } from '@refinedev/core'
import { FlowColor, IFlowNodeType } from '../types'
import { sentenceCase, splitActionId } from './helpers'
import { getCustomisation } from './page-customisation'
import {
  UI_SCALE,
  UI_ACTION_WIDTH,
  UI_ACTION_HEIGHT,
  UI_GROUP_PADDING,
  UI_GROUP_LABEL_HEIGHT,
  UI_GROUP_OUTER_GAP,
  UI_GROUP_GAP,
  COLOR_SCHEMES,
} from './constants'

export const buildNodeColor = ({
  index = 0,
  isFilled = false,
  isHovered = false,
  isDarker = false,
}: FlowColor) => {
  return `
    hsla(
      ${COLOR_SCHEMES[index || 0]?.[0] ?? 0}deg
      ${COLOR_SCHEMES[index || 0]?.[1] ?? 0}%
      ${isDarker ? (COLOR_SCHEMES[index || 0]?.[2] ?? 0) - 20 : (COLOR_SCHEMES[index || 0]?.[2] ?? 0)}%
      ${isFilled ? '' : `/ ${isHovered ? '40%' : '10%'}`}
    )
  `
}

interface IParams {
  width: number
  height: number
  x?: number
  y?: number
}

interface IFolder {
  id: string
  parentId?: string
  type: IFlowNodeType
  actions?: {
    [key: string]: IFolder
  }
  folders?: {
    [key: string]: IFolder
  }
  data: {
    label: string
    description?: string
    filled?: boolean
    actionsAmount?: number
    layerIndex?: number
    topLayer?: boolean
  }
  _params?: IParams
}

function setActionParams(action: IFolder) {
  action._params = {
    width: UI_ACTION_WIDTH,
    height: UI_ACTION_HEIGHT,
  }
}

function setFolderParams(
  folder: IFolder,
  currentWidth: number,
  currentHeight: number
) {
  folder._params = {
    width: currentWidth,
    height: currentHeight,
  }
}

function setActionsAndItsFolderSize(folder: IFolder) {
  let currentWidth: number | undefined = 0
  let currentHeight: number | undefined = 0

  if (folder.actions && Object.keys(folder.actions).length > 0) {
    for (const action of Object.values(folder.actions)) {
      if (action) {
        setActionParams(action)
      }
    }

    currentWidth = UI_ACTION_WIDTH
    currentHeight =
      Object.keys(folder.actions).length * UI_ACTION_HEIGHT +
      (Object.keys(folder.actions).length * UI_GROUP_GAP) / 2

    folder.actions._params = {
      width: currentWidth,
      height: currentHeight,
    }

    if (Object.keys(folder.folders).length === 0) {
      currentWidth = folder.actions._params.width
      currentHeight =
        UI_GROUP_LABEL_HEIGHT +
        (folder.actions._params.height ?? 0) +
        UI_GROUP_OUTER_GAP

      setFolderParams(folder, currentWidth, currentHeight)

      if (folder.data) {
        folder.data.filled = true
      }
    }
  }

  if (folder.folders && Object.keys(folder.folders).length > 0) {
    for (const subFolder of Object.values(folder.folders)) {
      setActionsAndItsFolderSize(subFolder)
    }
  }
}

function calculateSubfolderSize(
  subFolder,
  verticalMode,
  subfoldersWidth,
  subfoldersHeight
) {
  const { width: subWidth, height: subHeight } = setElementsSize(subFolder)
  return verticalMode
    ? {
        subfoldersWidth: Math.max(subfoldersWidth, subWidth),
        subfoldersHeight:
          subfoldersHeight +
          (subfoldersHeight === 0 ? subHeight : subHeight + UI_GROUP_PADDING),
      }
    : {
        subfoldersWidth:
          subfoldersWidth +
          (subfoldersWidth === 0 ? subWidth : subWidth + UI_GROUP_PADDING),
        subfoldersHeight: Math.max(subfoldersHeight, subHeight),
      }
}

function setElementsSize(folder: IFolder) {
  let folderWidth = 0
  let folderHeight = 0

  let actionsWidth = 0
  let actionsHeight = 0

  if (folder?.actions?._params) {
    actionsWidth = folder.actions._params.width
    actionsHeight = folder.actions._params.height
  }

  // Calculate size of subfolders recursively
  let subfoldersWidth = 0
  let subfoldersHeight = 0
  let verticalMode = false
  if (
    folder.folders &&
    Object.keys(folder.folders).length > 1 &&
    (!folder.actions ||
      (folder.actions && Object.keys(folder.actions).length === 0)) &&
    Object.values(folder.folders).every(
      (e) => !e.actions || (e.actions && Object.keys(e.actions).length === 0)
    )
  ) {
    verticalMode = true
  }
  for (const subFolder of Object.values(folder.folders)) {
    const {
      subfoldersWidth: newSubfoldersWidth,
      subfoldersHeight: newSubfoldersHeight,
    } = calculateSubfolderSize(
      subFolder,
      verticalMode,
      subfoldersWidth,
      subfoldersHeight
    )
    subfoldersWidth = newSubfoldersWidth
    subfoldersHeight = newSubfoldersHeight
  }

  // Folder width is sum of action width, subfolder width and padding
  if (actionsWidth !== 0 && subfoldersWidth !== 0) {
    folderWidth = UI_GROUP_PADDING * 3 + actionsWidth + subfoldersWidth
  } else if (actionsWidth === 0 && subfoldersWidth !== 0) {
    folderWidth = UI_GROUP_PADDING * 2 + subfoldersWidth
  } else if (actionsWidth !== 0 && subfoldersWidth === 0) {
    folderWidth = actionsWidth
  }

  // Folder height is max of action height and subfolder height
  folderHeight =
    subfoldersHeight === 0
      ? actionsHeight + UI_GROUP_LABEL_HEIGHT
      : UI_GROUP_PADDING * 2 + Math.max(actionsHeight, subfoldersHeight)

  if (folder.id !== 'start') {
    // Update folder width and height
    folder._params = { width: folderWidth, height: folderHeight }
  }

  return { width: folderWidth, height: folderHeight }
}

const setInnerBlocksCoordinates = (
  folder,
  index = false,
  parentFolder = false
) => {
  if (folder._params) {
    let verticalMode = false
    folder._params.x = 0
    folder._params.y = 0

    if (
      parentFolder.folders &&
      Object.keys(parentFolder.folders).length > 0 &&
      (!parentFolder.actions ||
        (parentFolder.actions &&
          Object.keys(parentFolder.actions).length === 0)) &&
      Object.values(parentFolder.folders).every(
        (e) => !e.actions || (e.actions && Object.keys(e.actions).length === 0)
      )
    ) {
      verticalMode = true
    }

    if (verticalMode) {
      folder._params.x = UI_GROUP_PADDING

      let heightsOfBlocksAbove = 0

      if (index > 0) {
        for (let j = 0; j < index; j++) {
          heightsOfBlocksAbove += Object.values(parentFolder.folders)[j]._params
            .height
        }
      }

      folder._params.y =
        !index || index === 0
          ? UI_GROUP_PADDING
          : heightsOfBlocksAbove + UI_GROUP_PADDING * (index + 1)
    } else {
      if (
        folder.folders &&
        Object.keys(folder.folders).length > 0 &&
        (!folder.actions ||
          (folder.actions && Object.keys(folder.actions).length === 0))
      ) {
        folder._params.x = (index + 1) * UI_GROUP_PADDING
        folder._params.y = UI_GROUP_PADDING
      }

      if (
        folder.actions &&
        Object.keys(folder.actions).length > 0 &&
        (!folder.folders ||
          (folder.folders && Object.keys(folder.folders).length === 0))
      ) {
        const prefixWidth =
          parentFolder.actions && Object.keys(parentFolder.actions).length > 0
            ? parentFolder.actions._params.width + UI_GROUP_PADDING
            : 0
        folder._params.x =
          prefixWidth +
          (index + 1) * UI_GROUP_PADDING +
          index * folder._params.width
        folder._params.y = UI_GROUP_PADDING
      }

      if (
        (!folder.actions ||
          (folder.actions && Object.keys(folder.actions).length === 0)) &&
        (!folder.folders ||
          (folder.folders && Object.keys(folder.folders).length === 0))
      ) {
        folder._params.x =
          parentFolder.folders && Object.keys(parentFolder.folders).length > 0
            ? UI_GROUP_PADDING
            : 0
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length > 0 &&
          index === 0
        ) {
          folder._params.y = UI_GROUP_PADDING
        }
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length > 0 &&
          index !== 0
        ) {
          folder._params.y =
            UI_GROUP_PADDING +
            index * UI_ACTION_HEIGHT +
            (index * UI_GROUP_GAP) / 2
        }
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length <= 0 &&
          index === 0
        ) {
          folder._params.y = UI_GROUP_LABEL_HEIGHT + UI_GROUP_GAP / 2
        }
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length <= 0 &&
          index !== 0
        ) {
          folder._params.y =
            UI_GROUP_LABEL_HEIGHT +
            ((index + 1) * UI_GROUP_GAP) / 2 +
            index * UI_ACTION_HEIGHT
        }
      }

      if (
        folder.actions &&
        Object.keys(folder.actions).length > 0 &&
        folder.folders &&
        Object.keys(folder.folders).length > 0
      ) {
        let prefixWidth =
          parentFolder.actions && Object.keys(parentFolder.actions).length > 0
            ? parentFolder.actions._params.width + UI_GROUP_PADDING
            : 0

        if (index > 0) {
          for (let k = 0; k < index; k++) {
            prefixWidth +=
              Object.values(parentFolder.folders)[k]._params.width +
              UI_GROUP_PADDING
          }
        }
        folder._params.x = prefixWidth + UI_GROUP_PADDING
        folder._params.y = UI_GROUP_PADDING
      }
    }

    if (folder.folders && Object.keys(folder.folders).length > 0) {
      for (const [i, subFolder] of Object.values(folder.folders).entries()) {
        setInnerBlocksCoordinates(subFolder, i, folder)
      }
    }

    if (folder.actions && Object.keys(folder.actions).length > 0) {
      for (const [i, action] of Object.values(folder.actions).entries()) {
        setInnerBlocksCoordinates(action, i, folder)
      }
    }
  }
}

const setFolderCoordinates = (data) => {
  let offset = UI_GROUP_PADDING * 2 * UI_SCALE
  for (const folder of Object.values(data.folders)) {
    folder._params.y = offset
    folder._params.x = UI_ACTION_WIDTH + UI_GROUP_PADDING * 2
    offset =
      folder._params.height + folder._params.y + UI_GROUP_PADDING * UI_SCALE

    for (const [i, subFolder] of Object.values(folder.folders).entries()) {
      setInnerBlocksCoordinates(subFolder, i, folder)
    }

    for (const [i, action] of Object.values(folder.actions).entries()) {
      setInnerBlocksCoordinates(action, i, folder)
    }
  }
}

function buildGraph(data) {
  // Calculate size of each folder recursively
  setActionsAndItsFolderSize(data)
  setElementsSize(data)

  // Set coordinates of each folder and file
  setFolderCoordinates(data)
}

const nodesSetCoordinates = (data) => {
  data.position = {
    x: 0,
    y: 0,
  }

  buildGraph(data)
}

const destructureNodesObj = (nodes) => {
  const arr = []

  const traverseNodes = (node) => {
    if (!node.id) return

    const { folders, actions, _params, ...rest } = node
    const obj = { ...rest }

    if (_params) {
      obj.style = {
        width: _params.width,
        height: _params.height,
      }
      obj.position = {
        x: _params.x,
        y: _params.y,
      }
    }

    arr.push(obj)

    if (folders) {
      for (const folder of Object.values(folders)) {
        traverseNodes(folder)
      }
    }

    if (actions) {
      for (const action of Object.values(actions)) {
        traverseNodes(action)
      }
    }
  }

  traverseNodes(nodes)
  return arr
}

const setLayerIndexes = (folders, index) => {
  for (const folder of Object.values(folders)) {
    if (folder.data) {
      folder.data.layerIndex = index
    }

    if (folder.actions && Object.keys(folder.actions)) {
      for (const action of Object.values(folder.actions)) {
        action.data.layerIndex = index
      }
    }

    if (folder.folders && Object.keys(folder.folders)) {
      setLayerIndexes(folder.folders, index)
    }
  }
}

const calculateAmountOfActions = (nodes, writeInto = false) => {
  if (writeInto) {
    nodes.data.actionsAmount = 0
  }

  if (
    Object.prototype.hasOwnProperty.call(nodes, 'actions') &&
    Object.keys(nodes.actions).length > 0 &&
    writeInto
  ) {
    nodes.data.actionsAmount = Object.keys(nodes.actions).filter(
      (a) => a !== '_params'
    ).length
  }

  if (
    Object.prototype.hasOwnProperty.call(nodes, 'folders') &&
    Object.keys(nodes.folders).length > 0
  ) {
    for (const folderKey in nodes.folders) {
      const subFolder = nodes.folders[folderKey]

      const subActionsAmount = calculateAmountOfActions(subFolder, true)

      if (writeInto) {
        nodes.data.actionsAmount += subActionsAmount
      }
    }
  }

  return writeInto ? nodes.data.actionsAmount : undefined
}

export const getNodes = (actions: GetListResponse | undefined) => {
  if (!actions) {
    return []
  }

  const nameText =
    getCustomisation()?.plasmactl_web_ui_platform_name ?? 'Platform'

  const nodes: IFolder = {
    id: 'start',
    data: {
      label: nameText,
    },
    type: 'node-start',
    folders: {},
    actions: {},
  }

  for (const item of actions.data) {
    if (!item.id || typeof item.id !== 'string') {
      continue
    }
    const { levels } = splitActionId(item.id)

    const idParts = item.id.split(':')
    const folders = levels

    let currentFolder = nodes.folders
    let parentId = ''
    for (const [index, folder] of folders.entries()) {
      if (currentFolder && !currentFolder[folder]) {
        currentFolder[folder] = {
          id: folder,
          data: {
            label: sentenceCase(folder),
          },
          type: 'node-wrapper',
          folders: {},
          actions: {},
        }

        if (parentId) {
          currentFolder[folder].id = `${parentId}.${folder}`
          currentFolder[folder].parentId = parentId
        }
      }
      parentId += (parentId ? '.' : '') + folder
      currentFolder =
        index + 1 === folders.length
          ? currentFolder[folder]
          : currentFolder[folder].folders
    }

    if (idParts.length === 2) {
      const fileName = idParts[1]
      if (!currentFolder.actions) {
        currentFolder.actions = {}
      }
      currentFolder.actions[fileName] = {
        id: item.id,
        data: {
          label: item.title,
          description: item.description,
          isActive: false,
        },
        type: 'node-action',
        parentId,
      }
    } else {
      const folderName = idParts[0]
      if (currentFolder[folderName]) {
        currentFolder[folderName].id = item.id
        currentFolder[folderName].data = {
          label: sentenceCase(item.title),
        }
        currentFolder[folderName].type = 'node-wrapper'
        currentFolder[folderName].parentId = parentId
      } else {
        currentFolder[folderName] = {
          id: item.id,
          data: {
            label: sentenceCase(item.title),
          },
          type: 'node-wrapper',
          folders: {},
          actions: {},
          parentId,
        }
      }
    }
  }

  if (nodes.folders) {
    // Set layer indexes
    let layerIndex = 0
    for (const folder of Object.values(nodes.folders)) {
      if (folder.data) {
        folder.data.layerIndex = layerIndex
        folder.data.topLayer = true
      }

      if (folder.actions && Object.keys(folder.actions)) {
        for (const action of Object.values(folder.actions)) {
          action.data.layerIndex = layerIndex
        }
      }

      if (folder.folders && Object.keys(folder.folders)) {
        setLayerIndexes(folder.folders, layerIndex)
      }

      layerIndex += 1
    }
  }

  nodesSetCoordinates(nodes)
  calculateAmountOfActions(nodes)

  const newNodes = new Set<string>()
  for (const item of actions.data) {
    if (!item.id || typeof item.id !== 'string') {
      continue
    }
    const { levels } = splitActionId(item.id)
    levels.reduce((acc, level) => {
      if (acc) {
        newNodes.add(`${acc}.${level}`)
        return `${acc}.${level}`
      }
      newNodes.add(level)
      return level
    }, '')

    newNodes.add(item.id)
  }
  const newNodesArray = [...newNodes]
  const newNodesArraySorted = newNodesArray.sort((a, b) => {
    const aLevels = splitActionId(a).levels.length + (a.includes(':') ? 1 : 0)
    const bLevels = splitActionId(b).levels.length + (b.includes(':') ? 1 : 0)
    return bLevels - aLevels
  })
  console.log('newNodesArraySorted', newNodesArraySorted)

  const findAllChildrenActions = (node: string) => {
    return [...newNodes].filter((n) => n.startsWith(node) && n.includes(':'))
  }

  const findDirectChild = (node: string) =>
    [...newNodes].filter((n) => {
      return (
        n.startsWith(node) &&
        n.substring(node.length + 1).length > 0 &&
        !n.substring(node.length + 1).includes('.') &&
        !n.substring(node.length + 1).includes(':')
      )
    })

  const findFolderHeight = (node: string) => {
    const children = findAllChildrenActions(node)
    return (
      children.length * UI_ACTION_HEIGHT +
      (children.length - 1) * UI_GROUP_GAP +
      UI_GROUP_LABEL_HEIGHT
    )
  }

  const newNodesResultArray = Array.from(newNodes).map((node) => {
    const { isRoot } = splitActionId(node as string)
    let type = 'node-action'
    if (!node.includes(':')) {
      type = 'node-wrapper'
    }
    if (type === 'node-wrapper') {
      const direct = findDirectChild(node)
      console.log(node, direct)
    }
    return {
      id: node,
      type,
      data: {
        actionsAmount: findAllChildrenActions(node).length,
        topLayer: isRoot,
      },
      style: {
        width: UI_ACTION_WIDTH,
        height:
          type === 'node-action' ? UI_ACTION_HEIGHT : findFolderHeight(node),
      },
    }
  })
  console.log('newNodesResultArray', newNodesResultArray)

  console.log('destructureNodesObj(nodes)', destructureNodesObj(nodes))
  return destructureNodesObj(nodes)
}

export const getEdges = (actions: GetListResponse | undefined) => {
  if (!actions) {
    return []
  }
  const edges = new Set()

  for (const item of actions.data) {
    if (!item.id || typeof item.id !== 'string') {
      continue
    }
    const { levels } = splitActionId(item.id)
    if (levels.length < 1) {
      continue
    }
    edges.add(levels[0])
  }

  return (
    Array.from(edges).map((edge) => ({
      id: `start-${edge}`,
      source: 'start',
      target: edge as string,
      type: 'smoothstep',
      style: {
        strokeWidth: 2 * UI_SCALE,
        stroke: '#000',
      },
      pathOptions: {
        borderRadius: 20 * UI_SCALE,
      },
    })) || []
  )
}

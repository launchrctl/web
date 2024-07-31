// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { GetListResponse } from '@refinedev/core'

import { IFlowNodeType } from '../types'
import { sentenceCase } from '../utils/helpers'

// Coefficient less than 0.51 behaves unpredictably.
// Use coefficient between 0.51 till endless
export const elementsScaleCoef = 1
export const actionWidth = 260 * elementsScaleCoef
export const actionHeight = 60 * elementsScaleCoef
export const grandFolderGap = 80 * elementsScaleCoef
export const folderLabelHeight = 50 * elementsScaleCoef
export const actionsGroupOuterGap = 4 * elementsScaleCoef
export const gapBetweenActions = 4 * elementsScaleCoef

const layerColorSchemesHSL = [
  [214.79, 87.25, 50.78],
  [346.93, 83.26, 57.84],
  [160.47, 68.42, 51.57],
  [252.15, 91.86, 66.27],
]

export const buildNodeColor = ({
  index = 0,
  isFilled = false,
  isHovered = false,
  isDarker = false,
}) => {
  return `
    hsla(
      ${layerColorSchemesHSL[index || 0][0]}deg
      ${layerColorSchemesHSL[index || 0][1]}%
      ${isDarker ? layerColorSchemesHSL[index || 0][2] - 20 : layerColorSchemesHSL[index || 0][2]}%
      ${isFilled ? '' : `/ ${isHovered ? '40%' : '10%'}`}
    )
  `
}

interface IParams {
  width: number
  height: number
  x: number
  y: number
}

interface IFolder {
  id: string
  parentId?: string
  type: IFlowNodeType
  actions?: {
    [key: string]: IFolder | IParams
  }
  folders?: {
    [key: string]: IFolder | IParams
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

function setActionsAndItsFolderSize(folder: IFolder) {
  let currentWidth: number | undefined = 0
  let currentHeight: number | undefined = 0

  if (folder.actions && Object.keys(folder.actions).length > 0) {
    for (const action of Object.values(folder.actions)) {
      if (action) {
        action._params = {
          width: actionWidth,
          height: actionHeight,
        }
      }
    }

    currentWidth = actionWidth
    currentHeight =
      Object.keys(folder.actions).length * actionHeight +
      (Object.keys(folder.actions).length * gapBetweenActions) / 2

    folder.actions._params = {
      width: currentWidth,
      height: currentHeight,
    }

    if (Object.keys(folder.folders).length === 0) {
      currentWidth = folder.actions._params.width
      currentHeight =
        folderLabelHeight +
        (folder.actions._params.height ?? 0) +
        actionsGroupOuterGap

      folder._params = {
        width: currentWidth,
        height: currentHeight,
      }

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
    const { width: subWidth, height: subHeight } = setElementsSize(subFolder)

    if (verticalMode) {
      subfoldersWidth = Math.max(subfoldersWidth, subWidth)
      subfoldersHeight +=
        subfoldersHeight === 0 ? subHeight : subHeight + grandFolderGap
    } else {
      subfoldersWidth +=
        subfoldersWidth === 0 ? subWidth : subWidth + grandFolderGap
      subfoldersHeight = Math.max(subfoldersHeight, subHeight)
    }
  }

  // Folder width is sum of action width, subfolder width and padding
  if (actionsWidth !== 0 && subfoldersWidth !== 0) {
    folderWidth = grandFolderGap * 3 + actionsWidth + subfoldersWidth
  } else if (actionsWidth === 0 && subfoldersWidth !== 0) {
    folderWidth = grandFolderGap * 2 + subfoldersWidth
  } else if (actionsWidth !== 0 && subfoldersWidth === 0) {
    folderWidth = actionsWidth
  }

  // Folder height is max of action height and subfolder height
  folderHeight =
    subfoldersHeight === 0
      ? actionsHeight + folderLabelHeight
      : grandFolderGap * 2 + Math.max(actionsHeight, subfoldersHeight)

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
      folder._params.x = grandFolderGap

      let heightsOfBlocksAbove = 0

      if (index > 0) {
        for (let j = 0; j < index; j++) {
          heightsOfBlocksAbove += Object.values(parentFolder.folders)[j]._params
            .height
        }
      }

      folder._params.y =
        !index || index === 0
          ? grandFolderGap
          : heightsOfBlocksAbove + grandFolderGap * (index + 1)
    } else {
      if (
        folder.folders &&
        Object.keys(folder.folders).length > 0 &&
        (!folder.actions ||
          (folder.actions && Object.keys(folder.actions).length === 0))
      ) {
        folder._params.x = (index + 1) * grandFolderGap
        folder._params.y = grandFolderGap
      }

      if (
        folder.actions &&
        Object.keys(folder.actions).length > 0 &&
        (!folder.folders ||
          (folder.folders && Object.keys(folder.folders).length === 0))
      ) {
        const prefixWidth =
          parentFolder.actions && Object.keys(parentFolder.actions).length > 0
            ? parentFolder.actions._params.width + grandFolderGap
            : 0
        folder._params.x =
          prefixWidth +
          (index + 1) * grandFolderGap +
          index * folder._params.width
        folder._params.y = grandFolderGap
      }

      if (
        (!folder.actions ||
          (folder.actions && Object.keys(folder.actions).length === 0)) &&
        (!folder.folders ||
          (folder.folders && Object.keys(folder.folders).length === 0))
      ) {
        folder._params.x =
          parentFolder.folders && Object.keys(parentFolder.folders).length > 0
            ? grandFolderGap
            : 0
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length > 0 &&
          index === 0
        ) {
          folder._params.y = grandFolderGap
        }
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length > 0 &&
          index !== 0
        ) {
          folder._params.y =
            grandFolderGap +
            index * actionHeight +
            (index * gapBetweenActions) / 2
        }
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length <= 0 &&
          index === 0
        ) {
          folder._params.y = folderLabelHeight + gapBetweenActions / 2
        }
        if (
          parentFolder.folders &&
          Object.keys(parentFolder.folders).length <= 0 &&
          index !== 0
        ) {
          folder._params.y =
            folderLabelHeight +
            ((index + 1) * gapBetweenActions) / 2 +
            index * actionHeight
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
            ? parentFolder.actions._params.width + grandFolderGap
            : 0

        if (index > 0) {
          for (let k = 0; k < index; k++) {
            prefixWidth +=
              Object.values(parentFolder.folders)[k]._params.width +
              grandFolderGap
          }
        }
        folder._params.x = prefixWidth + grandFolderGap
        folder._params.y = grandFolderGap
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
  let offset = grandFolderGap * 2 * elementsScaleCoef
  for (const folder of Object.values(data.folders)) {
    folder._params.y = offset
    folder._params.x = actionWidth + grandFolderGap * 2
    offset =
      folder._params.height +
      folder._params.y +
      grandFolderGap * elementsScaleCoef

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

const destructureThroughNodes = (arr, nodes) => {
  const obj = {}
  if (nodes.id) {
    for (const [key, value] of Object.entries(nodes)) {
      if (key && key !== 'folders' && key !== 'actions') {
        obj[key] = value
      }

      if (key === '_params') {
        obj.style = {
          width: value.width,
          height: value.height,
        }
        obj.position = {
          x: value.x,
          y: value.y,
        }
      }
    }

    arr.push(obj)

    if (nodes.folders && Object.keys(nodes.folders).length > 0) {
      for (const folder of Object.values(nodes.folders)) {
        destructureThroughNodes(arr, folder)
      }
    }

    if (nodes.actions && Object.keys(nodes.actions).length > 0) {
      for (const action of Object.values(nodes.actions)) {
        destructureThroughNodes(arr, action)
      }
    }
  }

  return arr
}

const destructureNodesObj = (nodes) => {
  return destructureThroughNodes([], nodes)
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

export const getNodesAndEdges = (
  actions: GetListResponse | undefined,
  colorMode: string
) => {
  if (!actions) {
    return []
  }

  const nodes: IFolder = {
    id: 'start',
    data: {
      label:
        sessionStorage.getItem('plasmactl_web_ui_platform_name') ||
        'Platform name',
    },
    type: 'node-start',
    folders: {},
    actions: {},
  }

  for (const item of actions.data) {
    if (!item.id || typeof item.id !== 'string') {
      continue
    }
    const idParts = item.id.split(':')
    const folders = idParts[0].split('.')

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

  const edges = []

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

    for (const folder of Object.keys(nodes.folders)) {
      edges.push({
        id: `start-${folder}`,
        source: 'start',
        target: folder,
        type: 'smoothstep',
        style: {
          strokeWidth: 2 * elementsScaleCoef,
          stroke: colorMode === 'dark' ? '#fff' : '#000',
        },
        pathOptions: {
          borderRadius: 20 * elementsScaleCoef,
        },
      })
    }
  }

  nodesSetCoordinates(nodes)
  calculateAmountOfActions(nodes)

  return [destructureNodesObj(nodes), edges.reverse()]
}

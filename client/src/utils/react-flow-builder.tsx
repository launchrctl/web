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

const generateReadableLabel = (phrase) => {
  const label = phrase.replaceAll(/[_-]/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function setActionsAndItsFolderSize(folder) {
  let currentWidth = 0
  let currentHeight = 0

  if (folder.actions && Object.keys(folder.actions).length) {
    Object.values(folder.actions).forEach((action) => {
      action._params = {
        width: actionWidth,
        height: actionHeight,
      }
    })

    currentWidth = actionWidth
    currentHeight =
      Object.keys(folder.actions).length * actionHeight +
      (Object.keys(folder.actions).length * gapBetweenActions) / 2

    folder.actions._params = {
      width: currentWidth,
      height: currentHeight,
    }

    if (!Object.keys(folder.folders).length) {
      currentWidth = folder.actions._params.width
      currentHeight =
        folderLabelHeight + folder.actions._params.height + actionsGroupOuterGap

      folder._params = {
        width: currentWidth,
        height: currentHeight,
      }

      folder.data.filled = true
    }
  }

  if (folder.folders && Object.keys(folder.folders).length) {
    Object.values(folder.folders).forEach((subFolder) => {
      setActionsAndItsFolderSize(subFolder)
    })
  }
}

function setElementsSize(folder) {
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
      (folder.actions && !Object.keys(folder.actions).length)) &&
    Object.values(folder.folders).every(
      (e) => !e.actions || (e.actions && !Object.keys(e.actions).length)
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
  if (subfoldersHeight === 0) {
    folderHeight = actionsHeight + folderLabelHeight
  } else {
    folderHeight =
      grandFolderGap * 2 + Math.max(actionsHeight, subfoldersHeight)
  }

  if (folder.id !== 'start') {
    // Update folder width and height
    folder._params = { width: folderWidth, height: folderHeight }
  }

  return { width: folderWidth, height: folderHeight }
}

const setInnerBlocksCoordinates = (
  folder,
  containerSize,
  index = false,
  parentFolder = false
) => {
  const { containerWidth, containerHeight } = containerSize
  if (folder._params) {
    let verticalMode = false
    folder._params.x = 0
    folder._params.y = 0

    if (
      parentFolder.folders &&
      Object.keys(parentFolder.folders).length &&
      (!parentFolder.actions ||
        (parentFolder.actions && !Object.keys(parentFolder.actions).length)) &&
      Object.values(parentFolder.folders).every(
        (e) => !e.actions || (e.actions && !Object.keys(e.actions).length)
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
        Object.keys(folder.folders).length &&
        (!folder.actions ||
          (folder.actions && !Object.keys(folder.actions).length))
      ) {
        folder._params.x = (index + 1) * grandFolderGap
        folder._params.y = grandFolderGap
      }

      if (
        folder.actions &&
        Object.keys(folder.actions).length &&
        (!folder.folders ||
          (folder.folders && !Object.keys(folder.folders).length))
      ) {
        const prefixWidth =
          parentFolder.actions && Object.keys(parentFolder.actions).length
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
          (folder.actions && !Object.keys(folder.actions).length)) &&
        (!folder.folders ||
          (folder.folders && !Object.keys(folder.folders).length))
      ) {
        folder._params.x =
          parentFolder.folders && Object.keys(parentFolder.folders).length
            ? grandFolderGap
            : 0
        folder._params.y =
          parentFolder.folders && Object.keys(parentFolder.folders).length
            ? index === 0
              ? grandFolderGap
              : grandFolderGap +
                index * actionHeight +
                (index * gapBetweenActions) / 2
            : index === 0
              ? folderLabelHeight + gapBetweenActions / 2
              : folderLabelHeight +
                ((index + 1) * gapBetweenActions) / 2 +
                index * actionHeight
      }

      if (
        folder.actions &&
        Object.keys(folder.actions).length &&
        folder.folders &&
        Object.keys(folder.folders).length
      ) {
        let prefixWidth =
          parentFolder.actions && Object.keys(parentFolder.actions).length
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

    if (folder.folders && Object.keys(folder.folders).length) {
      Object.values(folder.folders).forEach((subFolder, i) => {
        setInnerBlocksCoordinates(
          subFolder,
          {
            containerWidth: folder._params.width,
            containerHeight: folder._params.height,
          },
          i,
          folder
        )
      })
    }

    if (folder.actions && Object.keys(folder.actions).length) {
      Object.values(folder.actions).forEach((action, i) => {
        setInnerBlocksCoordinates(
          action,
          {
            containerWidth: folder._params.width,
            containerHeight: folder._params.height,
          },
          i,
          folder
        )
      })
    }
  }
}

const setFolderCoordinates = (data) => {
  let offset = grandFolderGap * 2 * elementsScaleCoef
  Object.values(data.folders).forEach((folder) => {
    folder._params.y = offset
    folder._params.x = actionWidth + grandFolderGap * 2
    offset =
      folder._params.height +
      folder._params.y +
      grandFolderGap * elementsScaleCoef

    Object.values(folder.folders).forEach((subFolder, i) => {
      setInnerBlocksCoordinates(
        subFolder,
        {
          containerWidth: folder._params.width,
          containerHeight: folder._params.height,
        },
        i,
        folder
      )
    })

    Object.values(folder.actions).forEach((action, i) => {
      setInnerBlocksCoordinates(
        action,
        {
          containerWidth: folder._params.width,
          containerHeight: folder._params.height,
        },
        i,
        folder
      )
    })
  })
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
      if (key)
        if (key !== 'folders' && key !== 'actions') {
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

    if (nodes.folders && Object.keys(nodes.folders).length) {
      Object.values(nodes.folders).forEach((folder) => {
        destructureThroughNodes(arr, folder)
      })
    }

    if (nodes.actions && Object.keys(nodes.actions).length) {
      Object.values(nodes.actions).forEach((action) => {
        destructureThroughNodes(arr, action)
      })
    }
  }

  return arr
}

const destructureNodesObj = (nodes) => {
  return destructureThroughNodes([], nodes)
}

const setLayerIndexes = (folders, index) => {
  Object.values(folders).forEach((folder) => {
    if (folder.data) {
      folder.data.layerIndex = index
    }

    if (folder.actions && Object.keys(folder.actions)) {
      Object.values(folder.actions).forEach((action) => {
        action.data.layerIndex = index
      })
    }

    if (folder.folders && Object.keys(folder.folders)) {
      setLayerIndexes(folder.folders, index)
    }
  })
}

const calculateAmountOfActions = (nodes, writeInto = false) => {
  if (writeInto) {
    nodes.data.actionsAmount = 0
  }

  if (
    nodes.hasOwnProperty('actions') &&
    Object.keys(nodes.actions).length > 0 &&
    writeInto
  ) {
    nodes.data.actionsAmount = Object.keys(nodes.actions).filter(
      (a) => a !== '_params'
    ).length
  }

  if (nodes.hasOwnProperty('folders') && Object.keys(nodes.folders).length) {
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

export const getNodesAndEdges = (actions, colorMode) => {
  if (!actions) {
    return []
  }

  const nodes = {
    id: 'start',
    data: { label: 'Platform name' },
    type: 'node-start',
    folders: {},
    actions: {},
  }

  actions.data.forEach((item) => {
    const idParts = item.id.split(':')
    const folders = idParts[0].split('.')

    let currentFolder = nodes.folders
    let parentId = ''
    for (const [index, folder] of folders.entries()) {
      if (!currentFolder[folder]) {
        currentFolder[folder] = {
          id: folder,
          data: {
            label: generateReadableLabel(folder),
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
          isActive: false,
        },
        type: 'node-action',
        parentId,
      }
    } else {
      const folderName = idParts[0]
      if (!currentFolder[folderName]) {
        currentFolder[folderName] = {
          id: item.id,
          data: {
            label: generateReadableLabel(item.title),
          },
          type: 'node-wrapper',
          folders: {},
          actions: {},
          parentId,
        }
      } else {
        currentFolder[folderName].id = item.id
        currentFolder[folderName].data = {
          label: generateReadableLabel(item.title),
        }
        currentFolder[folderName].type = 'node-wrapper'
        currentFolder[folderName].parentId = parentId
      }
    }
  })

  const edges = []

  if (nodes.folders) {
    // Set layer indexes

    let layerIndex = 0
    Object.values(nodes.folders).forEach((folder) => {
      if (folder.data) {
        folder.data.layerIndex = layerIndex
        folder.data.topLayer = true
      }

      if (folder.actions && Object.keys(folder.actions)) {
        Object.values(folder.actions).forEach((action) => {
          action.data.layerIndex = layerIndex
        })
      }

      if (folder.folders && Object.keys(folder.folders)) {
        setLayerIndexes(folder.folders, layerIndex)
      }

      layerIndex += 1
    })

    Object.keys(nodes.folders).forEach((folder) => {
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
    })
  }

  nodesSetCoordinates(nodes)
  calculateAmountOfActions(nodes)

  return [destructureNodesObj(nodes), edges.reverse()]
}

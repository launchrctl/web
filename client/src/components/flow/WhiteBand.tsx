import { useEffect, useState } from 'react'
import { INodeData } from '../../types'
import { Box, CircularProgress } from '@mui/material'

import {
  UI_SCALE,
  UI_ACTION_WIDTH,
  UI_ACTION_HEIGHT,
} from '../../utils/constants'
import { buildNodeColor } from '../../utils/react-flow-builder'
import ActionIcon from '/images/action.svg'
import CheckIcon from '/images/check.svg'

export default ({ data }: { data: INodeData }) => {
  const [active, setActive] = useState(false)
  // TODO: for now always false, since `data.isExecuting` is never processed.
  // Add progress indicator into each card on flow while action is executing.
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    setActive(data.isActive)
  }, [data.isActive])

  useEffect(() => {
    setExecuting(data.isExecuting)
  }, [data.isExecuting])

  return (
    <Box
      className="react-flow__node-default"
      sx={{
        width: `${UI_ACTION_WIDTH}px`,
        height: `${UI_ACTION_HEIGHT}px`,
        boxShadow: `0 ${UI_SCALE}px ${UI_SCALE}px rgba(0, 0, 0, 0.2)`,
        borderRadius: `${6 * UI_SCALE}px`,
        border: 0,
        paddingInline: `${12 * UI_SCALE}px`,
        textAlign: 'start',
        gap: `${12 * UI_SCALE}px`,
        justifyContent: 'space-between',
        backgroundColor:
          data.layerIndex === undefined
            ? ''
            : buildNodeColor({
                index: Number(data.layerIndex),
                isFilled: true,
              }),
        backgroundImage:
          data.layerIndex === undefined || (!active && !data.isHovered)
            ? 'linear-gradient(#fff, #fff)'
            : `linear-gradient(rgba(255, 255, 255, ${active ? '0.65' : '0.8'}), rgba(255, 255, 255, ${active ? '0.65' : '0.8'}))`,
        display: 'flex',
        alignItems: 'center',
        cursor: data.type === 'node-action' ? 'pointer' : 'grab',
        '&:hover': {
          backgroundImage:
            data.layerIndex === undefined
              ? 'linear-gradient(#fff, #fff)'
              : `linear-gradient(rgba(255, 255, 255, ${active ? '0.65' : '0.8'}), rgba(255, 255, 255, ${active ? '0.65' : '0.8'}))`,
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            typography: 'subtitle2',
            fontSize: `${16 * UI_SCALE}px`,
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '1',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {data?.label}
        </Box>
        {data?.description && (
          <Box
            sx={{
              typography: 'subtitle2',
              fontSize: `${11 * UI_SCALE}px`,
              color: '#667085',
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '1',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data?.description}
          </Box>
        )}
      </Box>
      {data.type === 'node-action' && (
        <Box
          sx={{
            color: '#000',
            '& img': {
              display: 'block',
              width: `${16 * UI_SCALE}px`,
              height: `${16 * UI_SCALE}px`,
            },
          }}
        >
          {executing ? (
            <CircularProgress
              variant="indeterminate"
              disableShrink
              thickness={7}
              value={70}
              size={16}
              sx={{
                display: 'block',
                'animation-duration': '0.5s',
              }}
            />
          ) : (
            <img src={active ? CheckIcon : ActionIcon} />
          )}
        </Box>
      )}
    </Box>
  )
}

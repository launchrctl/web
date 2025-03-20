import { INodeData } from "../../types"
import { useTheme } from '@mui/material/styles'
import { Box, Paper, Typography } from '@mui/material'
import { buildNodeColor } from '../../utils/react-flow-builder'
import {
  Handle,
  Position
} from 'reactflow'
import {
  UI_SCALE,
  UI_GROUP_LABEL_HEIGHT,
} from '../../utils/constants'
import ActionIcon from '/images/action.svg'

export default ({ data }: { data: INodeData }) => {
  const { palette } = useTheme()
  return (
    <Paper
      sx={{
        height: '100%',
        backgroundColor: buildNodeColor({
          index: Number(data.layerIndex),
          isFilled: data.filled,
          isDarker: data.filled && data.isHovered,
          isHovered: data.isHovered,
        }),
        backgroundImage: 'none',
        borderRadius: `${6 * UI_SCALE}px`,
        outline: `${2 * UI_SCALE}px solid ${buildNodeColor({
          index: Number(data.layerIndex),
          isFilled: true,
          isDarker: data.isHovered,
        })}`,
      }}
    >
      <Box
        sx={{
          typography: 'subtitle2',
          backgroundColor: buildNodeColor({
            index: Number(data.layerIndex),
            isFilled: true,
            isDarker: data.isHovered,
          }),
          borderBottomRightRadius: `${6 * UI_SCALE}px`,
          borderTopLeftRadius: `${6 * UI_SCALE}px`,
          display: 'inline-flex',
          verticalAlign: 'top',
          fontSize: `${16 * UI_SCALE}px`,
          gap: `${12 * UI_SCALE}px`,
          height: `${UI_GROUP_LABEL_HEIGHT}px`,
          alignItems: 'center',
          paddingInline: `${12 * UI_SCALE}px`,
          paddingBlockEnd: data.filled ? '' : `${2 * UI_SCALE}px`,
          width: data.filled ? '100%' : 'auto',
          color: '#fff',
        }}
      >
        <Typography
          sx={{
            fontSize: `${16 * UI_SCALE}px`,
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {data?.label}
        </Typography>
        {data.actionsAmount && (
          <Box
            className={'actions-pill'}
            sx={{
              backgroundColor: '#fff',
              borderRadius: `${5 * UI_SCALE}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: `${2 * UI_SCALE}px`,
              padding: `${2 * UI_SCALE}px ${11 * UI_SCALE}px ${2 * UI_SCALE}px ${7 * UI_SCALE}px`,
              color: '#000',
              marginInlineStart: data.filled ? 'auto' : '',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: `rgba(255, 255, 255, 0.8)`,
              },
              '& img': {
                display: 'block',
                width: `${16 * UI_SCALE}px`,
                height: `${16 * UI_SCALE}px`,
              },
            }}
          >
            <img src={ActionIcon} />
            {data.actionsAmount}
          </Box>
        )}
      </Box>
      {data.topLayer && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            position: 'relative',
            left: `-${5 * UI_SCALE}px`,
            transform: 'none',
            backgroundColor: palette?.mode === 'dark' ? '#000' : '#fff',
            borderColor: palette?.mode === 'dark' ? '#fff' : '#000',
            borderWidth: `${2 * UI_SCALE}px`,
            width: `${8 * UI_SCALE}px`,
            height: `${8 * UI_SCALE}px`,
            minWidth: 0,
            minHeight: 0,
            top: `-${UI_GROUP_LABEL_HEIGHT / 2 + 4 * UI_SCALE}px`,
          }}
        />
      )}
    </Paper>
  )
}
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { GetListResponse } from '@refinedev/core'
import type { FC } from 'react'
import { Fragment } from 'react'

export const SidebarActions: FC<{
  actions: GetListResponse | undefined
}> = ({ actions }) => {
  return (
    <List>
      {actions?.data
        .sort((a, b) => (a.id as string).localeCompare(b.id as string))
        .map(({ id, title, description }) => (
          <ListItem key={id}>
            <ListItemText
              primary={title}
              secondary={
                <Fragment>
                  {description}
                  <Typography variant="caption" color="purple">
                    &nbsp; #{id}
                  </Typography>
                </Fragment>
              }
            ></ListItemText>
          </ListItem>
        ))}
    </List>
  )
}

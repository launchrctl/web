import React from 'react'
import {
  useDataGrid,
  ShowButton,
  List,
} from '@refinedev/mui'
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export const ActionList = () => {
  const { dataGridProps } = useDataGrid()

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'title',
        flex: 1,
        headerName: 'Title',
        type: "string",
        sortable: false,
      },
      {
        field: 'description',
        flex: 1,
        headerName: 'Description',
        type: "string",
        sortable: false,
      },
      {
        field: 'id',
        flex: 1,
        headerName: 'Id',
        type: "string",
        sortable: false,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: function render({ row }) {
          return (
            <>
              <ShowButton hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
      },
    ],
    []
  )

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight disableColumnFilter />
    </List>
  )
}

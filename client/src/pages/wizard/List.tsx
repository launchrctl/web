import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material'
import { HttpError, useList } from '@refinedev/core'
import { useNavigate } from 'react-router-dom'

import { components } from '../../../openapi'
import WizardBanner from '../../components/layout/WizardBanner'

export const WizardList = () => {
  const { data, isLoading, isError } = useList<
    components['schemas']['WizardShort'],
    HttpError
  >({
    resource: 'wizard',
  })
  const navigate = useNavigate()

  const wizards = data?.data ?? []

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <div>Something went wrong!</div>
  }

  return (
    <>
      <WizardBanner title="Wizards List" subtitle="This is wizards list" />
      <Box sx={{ mt: 2 }}>
        <Container maxWidth="md">
          <Grid container spacing={2}>
            {wizards.map((wizard) => (
              <Grid item key={wizard.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      {wizard.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {wizard.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/wizard/${wizard.id}/show`)}
                    >
                      Go to
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  )
}

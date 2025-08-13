import { Box, Typography, Button, Container } from '@mui/material'
import { Home, ArrowBack } from '@mui/icons-material'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: '8rem', fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h4" component="h2">
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sorry, we couldn't find the page you're looking for.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            component={Link}
            href="/"
            startIcon={<Home />}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            startIcon={<ArrowBack />}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
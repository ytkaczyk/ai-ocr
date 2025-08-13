import { Box, Typography, Button, Container } from '@mui/material'
import Link from 'next/link'

export default function HomePage() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          AI OCR Dashboard
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Modern document processing with Next.js and Supabase
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/login"
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/dashboard"
          >
            Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
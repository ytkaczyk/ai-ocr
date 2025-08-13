'use client'

import { useEffect } from 'react'
import { Box, Typography, Button, Container } from '@mui/material'
import { ErrorOutline } from '@mui/icons-material'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

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
        <ErrorOutline sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h4" component="h1">
          Something went wrong!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error.message || 'An unexpected error occurred'}
        </Typography>
        <Button variant="contained" onClick={reset}>
          Try again
        </Button>
      </Box>
    </Container>
  )
}
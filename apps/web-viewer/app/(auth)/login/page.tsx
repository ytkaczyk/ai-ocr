'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  Divider,
} from '@mui/material'
import { Google, GitHub } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import NextLink from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 3,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Welcome back to AI OCR Dashboard
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleEmailLogin} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                data-testid="email"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                data-testid="password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                data-testid="sign-in-button"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }}>Or continue with</Divider>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHub />}
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
              >
                GitHub
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link component={NextLink} href="/signup">
                  Sign up
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <Link component={NextLink} href="/reset-password">
                  Forgot your password?
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
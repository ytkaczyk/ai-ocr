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

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      setMessage('Check your email for the confirmation link!')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
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
              Sign Up
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Create your AI OCR Dashboard account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            <Box component="form" onSubmit={handleEmailSignup} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
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
                helperText="Password must be at least 6 characters"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                data-testid="sign-up-button"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }}>Or continue with</Divider>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={() => handleOAuthSignup('google')}
                disabled={loading}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHub />}
                onClick={() => handleOAuthSignup('github')}
                disabled={loading}
              >
                GitHub
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={NextLink} href="/login">
                  Sign in
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
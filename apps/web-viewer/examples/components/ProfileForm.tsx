'use client'

// components/profile/ProfileForm.tsx
// Example Material-UI form component with validation and Supabase integration

import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material'
import { PhotoCamera } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/repositories/user-repository'

// Validation schema with Zod
const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: UserProfile
  onSuccess?: (updatedProfile: UserProfile) => void
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  
  const supabase = useSupabase()

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      bio: profile.bio || '',
    },
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    setError(null)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)

      setAvatarUrl(publicUrl)
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', profile.user_id)

      if (updateError) {
        throw updateError
      }

    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setError(null)

    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id)
        .select()
        .single()

      if (error) {
        throw error
      }

      onSuccess?.(updatedProfile)
      
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Edit Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={avatarUrl || undefined}
          sx={{ width: 80, height: 80, mr: 2 }}
        />
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload"
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="avatar-upload">
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="span"
              disabled={uploadingImage}
            >
              {uploadingImage ? <CircularProgress size={24} /> : <PhotoCamera />}
            </IconButton>
          </label>
          <Typography variant="body2" color="textSecondary">
            Click to change avatar
          </Typography>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <Controller
          name="full_name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Full Name"
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
              margin="normal"
              required
            />
          )}
        />

        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Bio"
              multiline
              rows={4}
              error={!!errors.bio}
              helperText={errors.bio?.message || `${field.value?.length || 0}/500 characters`}
              margin="normal"
            />
          )}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isDirty}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

// Example usage in a page:
// import { ProfileForm } from '@/components/profile/ProfileForm'
// import { getUserProfile } from '@/lib/repositories/user-repository'
//
// export default async function ProfilePage() {
//   const profile = await getUserProfile()
//   
//   return (
//     <ProfileForm 
//       profile={profile} 
//       onSuccess={() => router.refresh()} 
//     />
//   )
// }
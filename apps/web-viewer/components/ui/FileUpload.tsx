'use client'

import { useState, useCallback } from 'react'
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import { CloudUpload, Delete, InsertDriveFile, PictureAsPdf } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  onUploadComplete?: (files: Array<{ id: string; name: string; url: string }>) => void
  acceptedTypes?: string[]
  maxSize?: number
  maxFiles?: number
}

export function FileUpload({ 
  onUploadComplete, 
  acceptedTypes = ['application/pdf', 'text/markdown'],
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => 
        file.errors.map((error: any) => error.message).join(', ')
      ).join('; ')
      setError(`Some files were rejected: ${errors}`)
    }
    
    setSelectedFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles))
    setError(null)
    setSuccess(null)
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
    },
    maxSize,
    maxFiles,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    return file.type === 'application/pdf' ? (
      <PictureAsPdf color="error" />
    ) : (
      <InsertDriveFile color="info" />
    )
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setError(null)
    setSuccess(null)
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const uploadedResults = []
      const totalFiles = selectedFiles.length

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (storageError) throw storageError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(filePath)

        // Save file metadata to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            name: file.name,
            type: fileExt === 'pdf' ? 'pdf' : 'markdown',
            size: file.size,
            storage_path: filePath,
            metadata: {
              originalName: file.name,
              mimeType: file.type,
            }
          })
          .select()
          .single()

        if (dbError) throw dbError

        uploadedResults.push({
          id: fileRecord.id,
          name: file.name,
          url: urlData.publicUrl,
        })

        setUploadProgress(((i + 1) / totalFiles) * 100)
      }

      setSelectedFiles([])
      setSuccess(`Successfully uploaded ${uploadedResults.length} file(s)`)
      onUploadComplete?.(uploadedResults)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
          mb: 2,
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive 
              ? 'Drop files here...' 
              : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports PDF and Markdown files up to {formatBytes(maxSize)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Maximum {maxFiles} files at once
          </Typography>
        </Box>
      </Card>

      {selectedFiles.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({selectedFiles.length}):
          </Typography>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {getFileIcon(file)}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={formatBytes(file.size)}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          
          <Button
            variant="contained"
            onClick={uploadFiles}
            disabled={uploading}
            fullWidth
            size="large"
            sx={{ mt: 2 }}
          >
            {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : `Upload ${selectedFiles.length} file(s)`}
          </Button>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            {Math.round(uploadProgress)}% uploaded
          </Typography>
        </Box>
      )}
    </Box>
  )
}
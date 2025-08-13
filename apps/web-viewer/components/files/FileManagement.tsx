'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material'
import { 
  Search,
  Download,
  Delete,
  Visibility,
  Add,
  MoreVert,
  InsertDriveFile,
  PictureAsPdf,
  FilterList,
} from '@mui/icons-material'
import { FileUpload } from '@/components/ui/FileUpload'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type File = Database['public']['Tables']['files']['Row']

interface FileManagementProps {
  userId: string
  initialFiles: File[]
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileManagement({ userId, initialFiles }: FileManagementProps) {
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [filteredFiles, setFilteredFiles] = useState<File[]>(initialFiles)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'markdown'>('all')
  
  const supabase = createClient()

  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel('files')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newFile = payload.new as File
            setFiles(prev => [newFile, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updatedFile = payload.new as File
            setFiles(prev =>
              prev.map(f => f.id === updatedFile.id ? updatedFile : f)
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedFile = payload.old as File
            setFiles(prev => prev.filter(f => f.id !== deletedFile.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, supabase])

  useEffect(() => {
    let filtered = files

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => file.type === typeFilter)
    }

    setFilteredFiles(filtered)
  }, [files, searchQuery, typeFilter])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, file: File) => {
    setAnchorEl(event.currentTarget)
    setSelectedFile(file)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedFile(null)
  }

  const handleDelete = async (file: File) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      setLoading(true)
      
      try {
        // Delete from storage
        await supabase.storage.from('files').remove([file.storage_path])
        
        // Delete from database
        await supabase.from('files').delete().eq('id', file.id)
        
        setFiles(prev => prev.filter(f => f.id !== file.id))
      } catch (error) {
        console.error('Error deleting file:', error)
        alert('Error deleting file')
      } finally {
        setLoading(false)
        handleMenuClose()
      }
    }
  }

  const handleDownload = async (file: File) => {
    try {
      const { data } = await supabase.storage.from('files').download(file.storage_path)
      
      if (data) {
        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file')
    }
    
    handleMenuClose()
  }

  const getFileIcon = (type: string) => {
    return type === 'pdf' ? <PictureAsPdf /> : <InsertDriveFile />
  }

  const handleUploadComplete = (uploadedFiles: Array<{ id: string; name: string; url: string }>) => {
    setUploadDialogOpen(false)
    // Files will be added via real-time subscription
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        File Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearch}
          data-testid="search-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={(e) => {
            const nextFilter = typeFilter === 'all' ? 'pdf' : typeFilter === 'pdf' ? 'markdown' : 'all'
            setTypeFilter(nextFilter)
          }}
        >
          Filter: {typeFilter === 'all' ? 'All Files' : typeFilter.toUpperCase()}
        </Button>
      </Box>

      <TableContainer component={Paper} data-testid="file-list">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery || typeFilter !== 'all' 
                      ? 'No files found matching your criteria' 
                      : 'No files uploaded yet. Click the + button to upload your first file.'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(file.type)}
                      <Typography variant="body2">
                        {file.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={file.type.toUpperCase()}
                      size="small"
                      color={file.type === 'pdf' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>
                    {new Date(file.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, file)}
                      disabled={loading}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedFile && handleDownload(selectedFile)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          Download
        </MenuItem>
        <MenuItem component="a" href={`/dashboard/files/${selectedFile?.id}`}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          View
        </MenuItem>
        <MenuItem 
          onClick={() => selectedFile && handleDelete(selectedFile)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Fab
        color="primary"
        aria-label="upload"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setUploadDialogOpen(true)}
        data-testid="upload-fab"
      >
        <Add />
      </Fab>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
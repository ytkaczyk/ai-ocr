import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Button,
} from '@mui/material'
import { DescriptionIcon, PictureAsPdfIcon, VisibilityIcon } from '@mui/icons-material'
import { Database } from '@/lib/supabase/types'
import Link from 'next/link'

type File = Database['public']['Tables']['files']['Row']

interface RecentFilesProps {
  files: File[]
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (type: string) => {
  return type === 'pdf' ? (
    <PictureAsPdfIcon sx={{ color: 'error.main' }} />
  ) : (
    <DescriptionIcon sx={{ color: 'info.main' }} />
  )
}

export function RecentFiles({ files }: RecentFilesProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Recent Files
          </Typography>
          <Button component={Link} href="/dashboard/files" variant="outlined" size="small">
            View All
          </Button>
        </Box>

        {files.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No files uploaded yet. Start by uploading your first document.
          </Typography>
        ) : (
          <TableContainer>
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
                {files.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(file.type)}
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
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
                    <TableCell>
                      <Typography variant="body2">
                        {formatBytes(file.size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(file.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        component={Link}
                        href={`/dashboard/files/${file.id}`}
                        size="small"
                        startIcon={<VisibilityIcon />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
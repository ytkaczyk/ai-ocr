import { createClient } from '@/lib/supabase/server'
import { FileRepository } from '@/lib/repositories/file-repository'
import { redirect } from 'next/navigation'
import { FileManagement } from '@/components/files/FileManagement'

export default async function FilesPage() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const fileRepository = new FileRepository()
  const files = await fileRepository.getFilesByUser(user.id)

  return <FileManagement userId={user.id} initialFiles={files} />
}
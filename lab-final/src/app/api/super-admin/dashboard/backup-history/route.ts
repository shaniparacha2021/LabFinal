import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch backup history
    const { data: backups, error } = await supabaseAdmin
      .from('backup_history')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Backup history error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch backup history' },
        { status: 500 }
      )
    }

    // Format backup data
    const formattedBackups = backups?.map(backup => ({
      id: backup.id,
      type: backup.backup_type || 'Full Backup',
      status: backup.status || 'completed',
      size: formatFileSize(backup.file_size || 0),
      createdAt: backup.created_at,
      description: backup.description || `${backup.backup_type || 'Full'} backup created`
    })) || []

    return NextResponse.json({
      success: true,
      backups: formattedBackups
    })

  } catch (error) {
    console.error('Backup history error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

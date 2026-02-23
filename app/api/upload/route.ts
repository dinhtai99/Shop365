import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Check if user is admin
    try {
      await requireAdmin()
    } catch (authError: any) {
      return NextResponse.json(
        { success: false, error: authError.message || 'Unauthorized' },
        { status: authError.message.includes('Admin') ? 403 : 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File

    // Support both single file (backward compatible) and multiple files
    const filesToProcess = files.length > 0 ? files : singleFile ? [singleFile] : []

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    // Validate file sizes
    const maxImageSize = 5 * 1024 * 1024 // 5MB for images
    const maxVideoSize = 50 * 1024 * 1024 // 50MB for videos

    const uploadedFiles = []
    const errors = []

    for (const file of filesToProcess) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Loại file không được hỗ trợ. Chỉ chấp nhận ảnh và video.`)
        continue
      }

      // Validate file size
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? maxVideoSize : maxImageSize
      
      if (file.size > maxSize) {
        errors.push(`${file.name}: Kích thước file quá lớn. Tối đa ${isVideo ? '50MB' : '5MB'}`)
        continue
      }

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate unique filename
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 9)
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${random}_${originalName}`

        // Determine directory based on file type
        const isVideoFile = file.type.startsWith('video/')
        const subDir = isVideoFile ? 'videos' : 'images'
        const publicDir = join(process.cwd(), 'public', subDir, 'products')
        const filepath = join(publicDir, filename)

        // Create directory if it doesn't exist
        const fs = require('fs')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }

        await writeFile(filepath, buffer)

        // Return the public URL
        const fileUrl = `/${subDir}/products/${filename}`

        uploadedFiles.push({
          url: fileUrl,
          filename: filename,
          type: isVideoFile ? 'video' : 'image',
          originalName: file.name,
        })
      } catch (error: any) {
        errors.push(`${file.name}: ${error.message || 'Lỗi khi upload'}`)
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: errors.length > 0 ? errors.join('; ') : 'Không thể upload file' 
        },
        { status: 400 }
      )
    }

    // Return single file (backward compatible) or array of files
    return NextResponse.json({
      success: true,
      data: uploadedFiles.length === 1 ? {
        url: uploadedFiles[0].url,
        filename: uploadedFiles[0].filename,
        type: uploadedFiles[0].type,
      } : {
        files: uploadedFiles,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error uploading file' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { clearCache, clearCacheByPattern } from '@/lib/cache'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    
    // Get product with latest ChiTietSanPham record
    // Since we now ensure only ONE active record exists, simple ORDER BY DESC LIMIT 1 works
    const products = await queryNamed<any>(
      `SELECT 
        sp.id as id,
        sp.ten as name,
        sp.ma as code,
        sp.idDanhMuc as categoryId,
        dm.tenDanhMuc as category,
        COALESCE(ctsp.gia, 0) as price,
        '' as image,
        COALESCE(ctsp.ghiChu, '') as description,
        COALESCE(ctsp.soLuong, 0) as reviews,
        5 as rating,
        ctsp.id as productDetailId
      FROM SanPham sp
      LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND ctsp.trangThai = 1
      LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
      WHERE sp.id = @id
      ORDER BY COALESCE(ctsp.id, 0) DESC
      LIMIT 1`,
      { id: productId }
    )

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = products[0]
    
    console.log('🔍 GET /api/products/[id]: Product description exists:', !!product.description)
    console.log('🔍 GET /api/products/[id]: Product description length:', product.description?.length || 0)
    console.log('🔍 GET /api/products/[id]: Product description (first 500 chars):', product.description?.substring(0, 500))
    
    // Extract media URLs from description (format: [MEDIA:url1,url2,...])
    let mediaUrls: string[] = []
    if (product.description) {
      // Match [MEDIA:...] pattern (có thể có newline)
      // Use [\s\S] instead of . with 's' flag for compatibility
      const mediaMatch = product.description.match(/\[MEDIA:([\s\S]+?)\]/)
      if (mediaMatch && mediaMatch[1]) {
        console.log('✅ GET /api/products/[id]: MEDIA tag found!')
        console.log('🔍 GET /api/products/[id]: MEDIA tag content:', mediaMatch[1])
        mediaUrls = mediaMatch[1]
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url && url !== '' && url !== 'undefined' && url !== 'null')
        console.log('📸 Extracted media URLs from description:', mediaUrls.length, mediaUrls)
      } else {
        console.log('⚠️ GET /api/products/[id]: No MEDIA tag found in description')
        // Try alternative patterns
        if (product.description.includes('MEDIA:')) {
          console.log('⚠️ Found "MEDIA:" text but regex failed')
        }
      }
    }
    
    // Add single image if exists và chưa có trong mediaUrls
    if (product.image && product.image.trim() && product.image !== '' && product.image !== 'undefined') {
      if (!mediaUrls.includes(product.image)) {
        mediaUrls.unshift(product.image)
        console.log('📸 Added single image to mediaUrls:', product.image)
      }
    }
    
    console.log('📸 Final mediaUrls:', mediaUrls.length, mediaUrls)
    
    // Remove media tag from description for display
    const cleanDescription = product.description?.replace(/\[MEDIA:.+?\]/g, '').trim() || ''

    return NextResponse.json({ 
      success: true, 
      data: {
        ...product,
        description: cleanDescription,
        images: mediaUrls, // Array of all media URLs
        productDetailId: product.productDetailId || null, // ChiTietSanPham.id for cart
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // Cache ngắn hơn để update nhanh hơn
      },
    })
  } catch (error: any) {
    console.error('❌ Error fetching product:', error)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error code:', error.code)
    
    // Return a safe error response
    const errorMessage = error.message || 'Internal server error'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage.includes('Malformed') 
          ? 'Database connection error. Please try again.' 
          : errorMessage 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { name, price, image, images, rating, reviews, category, categoryId, description } = body
    
    // Support both single image (backward compatible) and multiple images/videos
    // Priority: images array > image field
    let mediaUrls: string[] = []
    if (images !== undefined) {
      // If images is explicitly provided (even if empty array), use it
      if (Array.isArray(images)) {
        mediaUrls = images.filter((url: string) => url && url.trim() && url !== 'undefined' && url !== 'null')
      } else if (typeof images === 'string' && images.trim()) {
        mediaUrls = images.split(',').map((url: string) => url.trim()).filter((url: string) => url && url !== 'undefined' && url !== 'null')
      }
    } else if (image && image.trim() && image !== 'undefined' && image !== 'null') {
      // Fallback to single image field if images array not provided
      mediaUrls = [image.trim()]
    }

    console.log('📸 PUT /api/products/[id]: Media URLs to save:', mediaUrls.length, mediaUrls)

    // Build update fields for SanPham
    const updateFields: string[] = []
    const updateParams: Record<string, any> = { id: parseInt(id) }

    if (name !== undefined) {
      updateFields.push('ten = @name')
      updateParams.name = name
    }

    if (categoryId !== undefined) {
      updateFields.push('idDanhMuc = @categoryId')
      updateParams.categoryId = categoryId
    }

    // Update SanPham table if there are fields to update
    if (updateFields.length > 0) {
      await queryNamed(
        `UPDATE SanPham 
         SET ${updateFields.join(', ')}
         WHERE id = @id`,
        updateParams
      )
    }

    // Update ChiTietSanPham if exists, or create if not
    // ChiTietSanPham: idSP, gia, ghiChu, trangThai, soLuong
    const priceValue = price ? parseFloat(price.toString().replace(/[^\d.]/g, '')) : 0
    
    // CRITICAL FIX: Ensure only ONE active record exists at a time
    // Strategy: Deactivate all old records, then create/update the latest one
    
    // First, deactivate ALL existing records for this product
    await queryNamed(
      `UPDATE ChiTietSanPham SET trangThai = 0 WHERE idSP = @id`,
      { id: parseInt(id) }
    )
    console.log(`🧹 PUT /api/products/[id]: Deactivated all old ChiTietSanPham records for product ID: ${id}`)

    // Store media URLs in description field
    // First, get existing description and remove old MEDIA tag
    let descriptionValue = description || ''
    console.log('🔍 PUT /api/products/[id]: Original description from request:', descriptionValue)
    
    if (descriptionValue) {
      // Remove existing MEDIA tag from description
      const beforeClean = descriptionValue
      descriptionValue = descriptionValue.replace(/\[MEDIA:.+?\]/g, '').trim()
      if (beforeClean !== descriptionValue) {
        console.log('🧹 PUT /api/products/[id]: Removed old MEDIA tag from description')
      }
    }
    
    // Add new MEDIA tag if we have media URLs
    const mediaInfo = mediaUrls.length > 0 ? `\n[MEDIA:${mediaUrls.join(',')}]` : ''
    const fullDescription = descriptionValue + mediaInfo
    
    console.log('🔍 PUT /api/products/[id]: After processing:')
    console.log('  - Description value:', descriptionValue)
    console.log('  - Media URLs:', mediaUrls)
    console.log('  - Media URLs length:', mediaUrls.length)
    console.log('  - Media info:', mediaInfo)
    console.log('  - Media info length:', mediaInfo.length)
    console.log('  - Full description:', fullDescription)
    console.log('  - Full description length:', fullDescription.length)
    console.log('  - Full description (first 500 chars):', fullDescription.substring(0, 500))
    console.log('  - Full description (last 200 chars):', fullDescription.substring(Math.max(0, fullDescription.length - 200)))
    
    // Validate that MEDIA tag is included
    if (mediaUrls.length > 0 && !fullDescription.includes('[MEDIA:')) {
      console.error('❌ CRITICAL: MEDIA tag not found in fullDescription!')
      console.error('  Expected MEDIA tag but fullDescription is:', fullDescription)
    }
    
    console.log('📝 PUT /api/products/[id]: Description value:', descriptionValue)
    console.log('📝 PUT /api/products/[id]: Media URLs count:', mediaUrls.length)
    console.log('📝 PUT /api/products/[id]: Media tag:', mediaInfo || '(none)')
    console.log('📝 PUT /api/products/[id]: Full description (first 300 chars):', fullDescription.substring(0, 300))
    console.log('📝 PUT /api/products/[id]: Full description length:', fullDescription.length)

    // Always INSERT a new record (since we deactivated all old ones)
    // This ensures we always have exactly ONE active record with the latest data
    console.log(`📝 PUT /api/products/[id]: Creating new ChiTietSanPham record for product ID: ${id}`)
    console.log(`📝 PUT /api/products/[id]: Description to save (full):`, fullDescription)
    console.log(`📝 PUT /api/products/[id]: Description length:`, fullDescription.length)
    
    // Log parameters before insert
    console.log('📤 PUT /api/products/[id]: Parameters for INSERT:')
    console.log('  - id:', parseInt(id))
    console.log('  - price:', priceValue)
    console.log('  - description type:', typeof fullDescription)
    console.log('  - description length:', fullDescription.length)
    console.log('  - description value:', fullDescription)
    console.log('  - description includes MEDIA:', fullDescription.includes('[MEDIA:'))
    
    await queryNamed(
      `INSERT INTO ChiTietSanPham (idSP, gia, ghiChu, trangThai, soLuong)
       VALUES (@id, @price, @description, 1, 0)`,
      { id: parseInt(id), price: priceValue, description: fullDescription }
    )
    console.log(`✅ PUT /api/products/[id]: Created ChiTietSanPham successfully`)
    
    // Verify immediately after insert - get the record we just created
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to ensure DB commit
    const verifyResult = await queryNamed(
      `SELECT id, ghiChu, LENGTH(ghiChu) as len FROM ChiTietSanPham WHERE idSP = @id AND trangThai = 1 ORDER BY id DESC LIMIT 1`,
      { id: parseInt(id) }
    )
    if (verifyResult.length > 0) {
      const savedDesc = verifyResult[0].ghiChu || ''
      console.log(`🔍 PUT /api/products/[id]: Verified saved record ID:`, verifyResult[0].id)
      console.log(`🔍 PUT /api/products/[id]: Verified saved description length:`, verifyResult[0].len)
      console.log(`🔍 PUT /api/products/[id]: Verified saved description (full):`, savedDesc)
      console.log(`🔍 PUT /api/products/[id]: Verified saved description (first 500):`, savedDesc.substring(0, 500))
      console.log(`🔍 PUT /api/products/[id]: Verified saved description (last 200):`, savedDesc.substring(Math.max(0, savedDesc.length - 200)))
      console.log(`🔍 PUT /api/products/[id]: Verified description includes MEDIA:`, savedDesc.includes('[MEDIA:'))
      
      if (mediaUrls.length > 0 && !savedDesc.includes('[MEDIA:')) {
        console.error(`❌ CRITICAL ERROR: MEDIA tag was NOT saved to database!`)
        console.error(`  Expected: ${fullDescription.substring(0, 200)}...`)
        console.error(`  Got: ${savedDesc}`)
      } else if (mediaUrls.length > 0 && savedDesc.includes('[MEDIA:')) {
        console.log(`✅ SUCCESS: MEDIA tag was correctly saved to database!`)
      }
    } else {
      console.error(`❌ CRITICAL ERROR: Could not verify saved description - no record found!`)
    }

    // Get the updated record - use same pattern as GET to ensure consistency
    const result = await queryNamed<Product>(
      `SELECT 
        sp.id as id,
        sp.ten as name,
        sp.ma as code,
        sp.idDanhMuc as categoryId,
        dm.tenDanhMuc as category,
        COALESCE(ctsp.gia, 0) as price,
        '' as image,
        COALESCE(ctsp.ghiChu, '') as description,
        COALESCE(ctsp.soLuong, 0) as reviews,
        5 as rating
      FROM SanPham sp
      LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND ctsp.trangThai = 1
      LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
      WHERE sp.id = @id
      ORDER BY COALESCE(ctsp.id, 0) DESC
      LIMIT 1`,
      { id: parseInt(id) }
    )
    
    console.log('🔍 PUT /api/products/[id]: Fetched result after update:')
    console.log('  - Result count:', result.length)
    if (result.length > 0) {
      console.log('  - Description from result:', result[0].description?.substring(0, 200))
      console.log('  - Description length:', result[0].description?.length || 0)
    }

    // Verify saved data và extract images
    const savedProduct = result[0]
    let savedMediaUrls: string[] = []
    
    // Ưu tiên dùng images từ request body (đã được gửi và lưu)
    // Nếu không có, mới extract từ description
    if (mediaUrls.length > 0) {
      // Use images from request body (what we just saved)
      savedMediaUrls = mediaUrls
      console.log('✅ PUT /api/products/[id]: Using images from request body:', savedMediaUrls.length, savedMediaUrls)
    } else {
      // Fallback: extract from description
      console.log('🔍 PUT /api/products/[id]: Checking saved product description...')
      console.log('🔍 PUT /api/products/[id]: Saved product description exists:', !!savedProduct?.description)
      console.log('🔍 PUT /api/products/[id]: Saved product description length:', savedProduct?.description?.length || 0)
      
      if (savedProduct && savedProduct.description) {
        console.log('🔍 PUT /api/products/[id]: Full saved description:', savedProduct.description)
        
        // Use [\s\S] instead of . with 's' flag for compatibility
        const mediaMatch = savedProduct.description.match(/\[MEDIA:([\s\S]+?)\]/)
        if (mediaMatch) {
          console.log('✅ PUT /api/products/[id]: MEDIA tag found!')
          console.log('🔍 PUT /api/products/[id]: MEDIA tag content:', mediaMatch[1])
          savedMediaUrls = mediaMatch[1]
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url && url !== '' && url !== 'undefined' && url !== 'null')
          console.log('✅ PUT /api/products/[id]: Verified saved media URLs:', savedMediaUrls.length, savedMediaUrls)
        } else {
          console.log('⚠️ PUT /api/products/[id]: No MEDIA tag found in saved description')
          console.log('📝 Description content (first 500 chars):', savedProduct.description?.substring(0, 500))
          console.log('📝 Description content (last 200 chars):', savedProduct.description?.substring(Math.max(0, savedProduct.description.length - 200)))
          // Try to find MEDIA tag with different regex
          const altMatch = savedProduct.description.match(/MEDIA:/)
          if (altMatch) {
            console.log('⚠️ Found "MEDIA:" text but regex failed - description might be truncated or malformed')
          }
        }
      } else {
        console.log('⚠️ PUT /api/products/[id]: No description found in saved product')
      }
    }
    
    // Clean description để trả về (remove MEDIA tag)
    const cleanDescription = savedProduct.description?.replace(/\[MEDIA:.+?\]/g, '').trim() || ''

    // Clear cache để user thấy thay đổi ngay lập tức
    clearCacheByPattern('products:') // Clear tất cả product cache
    clearCache() // Clear tất cả cache để đảm bảo
    console.log('✅ Cache cleared after product update')

    // Return product với images array từ request body hoặc extracted
    const responseData = {
      ...savedProduct,
      description: cleanDescription,
      images: savedMediaUrls, // Include images array in response
    }
    
    console.log('📤 PUT /api/products/[id]: Returning response with images:', savedMediaUrls.length, savedMediaUrls)
    console.log('📤 PUT /api/products/[id]: Response data preview:', {
      id: responseData.id,
      name: responseData.name,
      imagesCount: responseData.images?.length || 0,
      hasImages: !!responseData.images && responseData.images.length > 0,
      images: responseData.images,
    })
    
    return NextResponse.json({ 
      success: true, 
      data: responseData
    })
  } catch (error: any) {
    console.error('❌ Error updating product:', error)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error code:', error.code)
    
    // Return a safe error response
    const errorMessage = error.message || 'Internal server error'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage.includes('Malformed') 
          ? 'Database connection error. Please try again.' 
          : errorMessage 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    // Soft delete: Set trangThai = 0 instead of hard delete
    await queryNamed(
      `UPDATE ChiTietSanPham SET trangThai = 0 WHERE idSP = @id`,
      { id: parseInt(id) }
    )
    // Optionally delete from SanPham (uncomment if needed)
    // await queryNamed(`DELETE FROM SanPham WHERE id = @id`, { id: parseInt(id) })

    // Clear cache sau khi xóa
    clearCache()
    console.log('✅ Cache cleared after product deletion')

    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

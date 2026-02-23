import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { cached, clearCache, clearCacheByPattern } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'id'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereClause = 'WHERE (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)'
    const params: Record<string, any> = {}

    if (categoryId) {
      whereClause += ' AND sp.idDanhMuc = @categoryId'
      params.categoryId = parseInt(categoryId)
    }

    if (search) {
      whereClause += ' AND (sp.ten LIKE @search OR sp.ma LIKE @search OR ctsp.ghiChu LIKE @search)'
      params.search = `%${search}%`
    }

    // Build ORDER BY clause
    let orderBy = 'ORDER BY sp.id ASC'
    if (sort === 'price_asc') {
      orderBy = 'ORDER BY ctsp.gia ASC'
    } else if (sort === 'price_desc') {
      orderBy = 'ORDER BY ctsp.gia DESC'
    } else if (sort === 'name') {
      orderBy = 'ORDER BY sp.ten ASC'
    }

    // Cache key (chỉ cache khi không có search và có pagination)
    const cacheKey = search 
      ? null // Không cache khi search
      : `products:${categoryId || 'all'}:${sort}:${page}:${limit}`

    // Fetch products với pagination
    const fetchProducts = async () => {
      const products = await queryNamed<Product>(
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
        LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
        LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
        ${whereClause}
        ${orderBy}
        LIMIT @limit OFFSET @offset`,
        { ...params, limit, offset }
      )

      // Get total count (chỉ khi page 1 để optimize)
      let total = 0
      if (page === 1) {
        const countResult = await queryNamed<{ total: number }>(
          `SELECT COUNT(DISTINCT sp.id) as total
           FROM SanPham sp
           LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
           ${whereClause}`,
          params
        )
        total = countResult[0]?.total || 0
      }

      return { products, total }
    }

    // Use cache nếu có cache key và không có search
    const result = cacheKey
      ? await cached(cacheKey, fetchProducts, 300) // Cache 5 phút
      : await fetchProducts()

    // Format price và extract images từ description
    const formattedProducts = result.products.map((p: any) => {
      // Extract image từ MEDIA tag trong description
      let imageUrl = ''
      if (p.description) {
        // Use [\s\S] instead of . with 's' flag for compatibility
        const mediaMatch = p.description.match(/\[MEDIA:([\s\S]+?)\]/)
        if (mediaMatch && mediaMatch[1]) {
          const mediaUrls = mediaMatch[1]
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url && url !== '' && url !== 'undefined' && url !== 'null')
          // Lấy ảnh đầu tiên làm thumbnail
          if (mediaUrls.length > 0) {
            imageUrl = mediaUrls[0]
          }
        }
      }
      
      return {
        ...p,
        image: imageUrl || p.image || '/placeholder-product.jpg',
        price: p.price && Number(p.price) > 0 ? `${Number(p.price).toLocaleString('vi-VN')} ₫` : 'Liên hệ',
        rating: p.rating || 5,
        reviews: p.reviews || 0,
      }
    })

    // Chỉ log trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 API GET /api/products: Trả về ${formattedProducts.length} sản phẩm (page ${page})`)
    }
    
    // Cache headers - Cache 5 phút cho static data, không cache cho search
    const cacheControl = search
      ? 'no-store, no-cache, must-revalidate'
      : 'public, s-maxage=300, stale-while-revalidate=600'

    return NextResponse.json(
      { 
        success: true, 
        data: formattedProducts,
        pagination: result.total > 0 ? {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        } : undefined,
      },
      {
        headers: {
          'Cache-Control': cacheControl,
        },
      }
    )
  } catch (error: any) {
    console.error('Error fetching products:', error)
    // Fallback: chỉ lấy từ SanPham nếu join fail
    try {
      const products = await queryNamed<Product>(
        `SELECT 
          sp.id as id,
          sp.ten as name,
          sp.ma as code,
          sp.idDanhMuc as categoryId,
          dm.tenDanhMuc as category,
          'Liên hệ' as price,
          '' as image,
          COALESCE(ctsp.ghiChu, '') as description,
          5 as rating,
          0 as reviews
        FROM SanPham sp
        LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
        LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
        ORDER BY sp.id ASC`
      )
      
      // Extract images từ description cho fallback products
      const formattedFallback = products.map((p: any) => {
        let imageUrl = ''
        if (p.description) {
          // Use [\s\S] instead of . with 's' flag for compatibility
        const mediaMatch = p.description.match(/\[MEDIA:([\s\S]+?)\]/)
          if (mediaMatch && mediaMatch[1]) {
            const mediaUrls = mediaMatch[1]
              .split(',')
              .map((url: string) => url.trim())
              .filter((url: string) => url && url !== '' && url !== 'undefined' && url !== 'null')
            if (mediaUrls.length > 0) {
              imageUrl = mediaUrls[0]
            }
          }
        }
        return {
          ...p,
          image: imageUrl || '/placeholder-product.jpg',
        }
      })
      
      return NextResponse.json({ success: true, data: formattedFallback })
    } catch (fallbackError: any) {
      return NextResponse.json(
        { success: false, error: fallbackError.message },
        { status: 500 }
      )
    }
  }
}

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

    const body = await request.json()
    const { name, price, image, images, description, code, categoryId } = body
    
    // Support both single image (backward compatible) and multiple images/videos
    // images can be array of URLs or comma-separated string
    let mediaUrls = image || ''
    if (images) {
      if (Array.isArray(images)) {
        mediaUrls = images.join(',')
      } else if (typeof images === 'string') {
        mediaUrls = images
      }
    }

    console.log('📝 Creating product:', { name, code, categoryId, price })

    // Insert into SanPham
    await queryNamed(
      `INSERT INTO SanPham (ten, ma, idDanhMuc)
       VALUES (@name, @code, @categoryId)`,
      { name, code: code || `SP${Date.now()}`, categoryId: categoryId || null }
    )

    // Get the inserted ID
    const inserted = await queryNamed('SELECT LAST_INSERT_ID() as id')
    const productId = inserted[0]?.id
    console.log(`✅ Created SanPham with ID: ${productId}`)

    // Insert into ChiTietSanPham if price/description/media provided
    // ChiTietSanPham: idSP, gia, ghiChu, trangThai, soLuong, kichThuoc
    // Store media URLs in ghiChu field as JSON or comma-separated (for now, we'll use description field)
    if (price || description || mediaUrls) {
      const priceValue = price ? parseFloat(price.toString().replace(/[^\d.]/g, '')) : 0
      // Store media URLs in description field (can be enhanced later with separate table)
      const descriptionValue = description || ''
      const mediaInfo = mediaUrls ? `\n[MEDIA:${mediaUrls}]` : ''
      const fullDescription = descriptionValue + mediaInfo
      
      await queryNamed(
        `INSERT INTO ChiTietSanPham (idSP, gia, ghiChu, trangThai, soLuong)
         VALUES (@productId, @price, @description, 1, @quantity)`,
        { 
          productId, 
          price: priceValue, 
          description: fullDescription,
          quantity: 0
        }
      )
      console.log(`✅ Created ChiTietSanPham for product ID: ${productId}`)
    }

    // Get the created record
    const result = await queryNamed<Product>(
      `SELECT 
        sp.id as id,
        sp.ten as name,
        sp.ma as code,
        sp.idDanhMuc as categoryId,
        dm.tenDanhMuc as category,
        COALESCE(ctsp.gia, 0) as price,
        @image as image,
        COALESCE(ctsp.ghiChu, '') as description,
        COALESCE(ctsp.soLuong, 0) as reviews,
        5 as rating
      FROM SanPham sp
      LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
      LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
      WHERE sp.id = @productId`,
      { productId, image: image || '' }
    )

    // Clear cache sau khi thêm sản phẩm mới
    clearCacheByPattern('products:') // Clear tất cả product cache
    clearCache() // Clear tất cả cache để đảm bảo
    console.log('✅ Cache cleared after creating new product')

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

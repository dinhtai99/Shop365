import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { NewsEvent } from '@/lib/models'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // TODO: Nếu có bảng NewsEvents trong database, uncomment code sau:
    /*
    const news = await queryNamed<NewsEvent>(
      `SELECT 
        id,
        title,
        excerpt,
        image,
        content,
        date,
        createdAt
      FROM NewsEvents
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (news.length === 0) {
      return NextResponse.json(
        { success: false, error: 'News not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: news[0] })
    */

    // Tạm thời trả về mock data
    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        title: 'Tin tức mẫu',
        excerpt: 'Đây là một tin tức mẫu',
        image: '/placeholder-product.jpg',
        content: 'Nội dung tin tức sẽ được hiển thị ở đây...',
        date: new Date(),
        createdAt: new Date(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

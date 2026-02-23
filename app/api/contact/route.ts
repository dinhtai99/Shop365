import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // TODO: Lưu vào database nếu có bảng Contact
    // Hiện tại chỉ log và trả về success
    // Có thể gửi email notification ở đây
    
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString(),
    })

    // Nếu có bảng Contact trong database, uncomment code sau:
    /*
    await queryNamed(
      `INSERT INTO Contact (name, email, phone, subject, message, createdAt)
       VALUES (@name, @email, @phone, @subject, @message, NOW())`,
      { name, email, phone: phone || null, subject: subject || null, message }
    )
    */

    return NextResponse.json({
      success: true,
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
    })
  } catch (error: any) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

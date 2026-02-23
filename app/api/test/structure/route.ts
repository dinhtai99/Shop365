import { NextResponse } from 'next/server'
import { queryNamed, query } from '@/lib/db'

export async function GET() {
  try {
    const dbName = process.env.DB_DATABASE || 'shop_online'
    
    // Get table structure using array params
    const columns = await query(
      `SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
      [dbName, 'SanPham']
    )

    // Get sample data
    const sample = await query('SELECT * FROM SanPham LIMIT 1')

    return NextResponse.json({
      success: true,
      columns,
      sample: sample[0] || null,
      message: 'Check columns to see actual structure of SanPham table'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

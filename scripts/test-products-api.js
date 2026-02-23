/**
 * Test Products API để kiểm tra data có trả về không
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testProductsAPI() {
  console.log('🔍 Testing Products API\n')
  console.log('='.repeat(60))
  
  try {
    console.log('\n1️⃣ Testing GET /api/products...')
    const response = await fetch(`${BASE_URL}/api/products?limit=20&page=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    const result = await response.json()
    console.log(`   Success: ${result.success}`)
    
    if (result.success) {
      console.log(`   Data type: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`)
      console.log(`   Products count: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`)
      
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log(`\n   ✅ Found ${result.data.length} products!`)
        console.log(`   First product:`, {
          id: result.data[0].id,
          name: result.data[0].name,
          price: result.data[0].price,
        })
      } else if (Array.isArray(result.data) && result.data.length === 0) {
        console.log(`\n   ⚠️  No products found in database`)
      } else {
        console.log(`\n   ⚠️  Unexpected data format:`, result.data)
      }
      
      if (result.pagination) {
        console.log(`   Pagination:`, result.pagination)
      }
    } else {
      console.log(`   ❌ Error: ${result.error}`)
    }
    
  } catch (error) {
    console.log('\n❌ Lỗi khi test:')
    console.error('   ', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Gợi ý:')
      console.log('   - Next.js server chưa chạy')
      console.log('   - Chạy: npm run dev')
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

testProductsAPI()

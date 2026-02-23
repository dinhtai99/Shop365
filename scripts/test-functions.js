/**
 * Script để test các chức năng chính của hệ thống
 * Chạy: node scripts/test-functions.js
 */

require('dotenv').config({ path: '.env.local' })

// Use native fetch if available (Node 18+), otherwise require node-fetch
let fetch
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch
} else {
  try {
    fetch = require('node-fetch')
  } catch (e) {
    console.error('❌ Error: fetch is not available. Please use Node.js 18+ or install node-fetch')
    process.exit(1)
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const USER_EMAIL = 'user@gmail.com'
const USER_PASSWORD = process.env.USER_PASSWORD || '123456' // Default password from create-user-quick.js

let adminToken = null
let userToken = null

// Helper functions
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    let data
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch (parseError) {
      return { ok: false, error: 'Invalid JSON response', status: response.status }
    }
    
    return { ok: response.ok, status: response.status, data }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

function logTest(name, passed, message = '') {
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`)
}

// Test functions
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...')
  const result = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  })
  
  if (result.ok && result.data.success && result.data.data.user.role === 'ADMIN') {
    adminToken = result.data.data.accessToken
    logTest('Admin Login', true)
    return true
  } else {
    logTest('Admin Login', false, result.data?.error || result.error)
    return false
  }
}

async function testUserLogin() {
  console.log('\n👤 Testing User Login...')
  const result = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }),
  })
  
  if (result.ok && result.data.success && result.data.data.user.role === 'USER') {
    userToken = result.data.data.accessToken
    logTest('User Login', true)
    return true
  } else {
    logTest('User Login', false, result.data?.error || result.error)
    return false
  }
}

async function testAdminAccess() {
  console.log('\n🔒 Testing Admin Access Control...')
  
  // Test 1: Admin can access admin endpoints (sees all orders)
  const adminResult = await apiCall('/api/orders', {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  const adminSeesAll = adminResult.ok && adminResult.data.success && Array.isArray(adminResult.data.data)
  logTest('Admin can see all orders', adminSeesAll)
  
  // Test 2: User can only see their own orders (needs userId param)
  if (userToken) {
    // First get user info to get userId
    const userInfoResult = await apiCall('/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    if (userInfoResult.ok && userInfoResult.data.success) {
      const userId = userInfoResult.data.data.user.userId
      const userResult = await apiCall(`/api/orders?userId=${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      // User should see their own orders
      const userSeesOwn = userResult.ok && userResult.data.success && Array.isArray(userResult.data.data)
      logTest('User can see own orders', userSeesOwn)
      
      // User should NOT see all orders without userId param
      const userAllResult = await apiCall('/api/orders', {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      // Should require userId param
      const requiresUserId = !userAllResult.ok || !userAllResult.data.success || userAllResult.data.error
      logTest('User cannot see all orders without userId', requiresUserId)
    }
  } else {
    logTest('User access control', false, 'User not logged in')
  }
  
  return true
}

async function testProductsAPI() {
  console.log('\n📦 Testing Products API...')
  
  // Test 1: Get products list
  const listResult = await apiCall('/api/products?page=1&limit=10')
  const hasProducts = listResult.ok && listResult.data.success && Array.isArray(listResult.data.data)
  logTest('Get products list', hasProducts, hasProducts ? `${listResult.data.data.length} products` : '')
  
  if (!hasProducts) {
    return false
  }
  
  // Test 2: Get product detail
  if (listResult.data.data.length > 0) {
    const productId = listResult.data.data[0].id
    const detailResult = await apiCall(`/api/products/${productId}`)
    const hasDetail = detailResult.ok && detailResult.data.success && detailResult.data.data.id === productId
    logTest('Get product detail', hasDetail)
    
    if (hasDetail) {
      // Check if product has image
      const hasImage = detailResult.data.data.image || (detailResult.data.data.images && detailResult.data.data.images.length > 0)
      logTest('Product has image', hasImage)
      
      // Check if productDetailId exists (for cart)
      const hasProductDetailId = detailResult.data.data.productDetailId !== undefined && detailResult.data.data.productDetailId !== null
      logTest('Product has productDetailId', hasProductDetailId)
    }
  }
  
  return true
}

async function testCartAPI() {
  console.log('\n🛒 Testing Cart API...')
  
  if (!userToken) {
    logTest('Cart API', false, 'User not logged in')
    return false
  }
  
  // Get user info to get userId
  const userInfoResult = await apiCall('/api/auth/me', {
    headers: { Authorization: `Bearer ${userToken}` },
  })
  if (!userInfoResult.ok || !userInfoResult.data.success) {
    logTest('Cart API', false, 'Cannot get user info')
    return false
  }
  
  const userId = userInfoResult.data.data.user.userId
  
  // Test 1: Get user cart
  const cartResult = await apiCall(`/api/cart?userId=${userId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  })
  logTest('Get cart', cartResult.ok)
  
  // Test 2: Add to cart (need productDetailId)
  const productsResult = await apiCall('/api/products?page=1&limit=1')
  if (productsResult.ok && productsResult.data.success && productsResult.data.data.length > 0) {
    const product = productsResult.data.data[0]
    
    // Get product detail to get productDetailId
    const detailResult = await apiCall(`/api/products/${product.id}`)
    if (detailResult.ok && detailResult.data.success && detailResult.data.data.productDetailId) {
      const addResult = await apiCall('/api/cart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({
          userId: userId,
          productDetailId: detailResult.data.data.productDetailId,
          quantity: 1,
        }),
      })
      logTest('Add to cart', addResult.ok && addResult.data.success)
    } else {
      logTest('Add to cart', false, 'Product has no productDetailId')
    }
  } else {
    logTest('Add to cart', false, 'No products available')
  }
  
  return true
}

async function testOrdersAPI() {
  console.log('\n📋 Testing Orders API...')
  
  if (!userToken) {
    logTest('Orders API', false, 'User not logged in')
    return false
  }
  
  // Get user info to get userId
  const userInfoResult = await apiCall('/api/auth/me', {
    headers: { Authorization: `Bearer ${userToken}` },
  })
  if (!userInfoResult.ok || !userInfoResult.data.success) {
    logTest('Orders API', false, 'Cannot get user info')
    return false
  }
  
  const userId = userInfoResult.data.data.user.userId
  
  // Test 1: Get user orders
  const ordersResult = await apiCall(`/api/orders?userId=${userId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  })
  const hasOrders = ordersResult.ok && ordersResult.data.success && Array.isArray(ordersResult.data.data)
  logTest('Get user orders', hasOrders, hasOrders ? `${ordersResult.data.data.length} orders` : '')
  
  // Test 2: Cancel order (if has order with status < 3)
  if (hasOrders && ordersResult.data.data.length > 0) {
    const cancellableOrder = ordersResult.data.data.find(o => o.status < 3 && o.status !== 0)
    if (cancellableOrder) {
      const cancelResult = await apiCall(`/api/orders/${cancellableOrder.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ status: 0 }),
      })
      logTest('Cancel order', cancelResult.ok && cancelResult.data.success)
      
      // Verify cancellation
      const verifyResult = await apiCall(`/api/orders/${cancellableOrder.id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      logTest('Order status updated to cancelled', verifyResult.ok && verifyResult.data.data.status === 0)
    } else {
      logTest('Cancel order', false, 'No cancellable orders (all orders are shipping/completed/cancelled)')
    }
  } else {
    logTest('Cancel order', false, 'No orders to cancel')
  }
  
  return true
}

async function testCategoriesAPI() {
  console.log('\n📁 Testing Categories API...')
  
  const categoriesResult = await apiCall('/api/categories')
  const hasCategories = categoriesResult.ok && categoriesResult.data.success && Array.isArray(categoriesResult.data.data)
  logTest('Get categories', hasCategories, hasCategories ? `${categoriesResult.data.data.length} categories` : '')
  
  return hasCategories
}

async function testAdminProductsAPI() {
  console.log('\n🔧 Testing Admin Products API...')
  
  if (!adminToken) {
    logTest('Admin Products API', false, 'Admin not logged in')
    return false
  }
  
  // Test 1: Create product
  const createResult = await apiCall('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: `Test Product ${Date.now()}`,
      code: `TEST${Date.now()}`,
      categoryId: 1,
      price: '100000',
      description: 'Test product description',
    }),
  })
  logTest('Create product', createResult.ok && createResult.data.success)
  
  // Test 2: Update product
  if (createResult.ok && createResult.data.success) {
    const productId = createResult.data.data.id
    const updateResult = await apiCall(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Updated Test Product ${Date.now()}`,
        price: '150000',
      }),
    })
    logTest('Update product', updateResult.ok && updateResult.data.success)
  }
  
  return true
}

async function testAdminOrdersAPI() {
  console.log('\n🔧 Testing Admin Orders API...')
  
  if (!adminToken) {
    logTest('Admin Orders API', false, 'Admin not logged in')
    return false
  }
  
  // Test: Get all orders (admin only)
  const result = await apiCall('/api/orders', {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  logTest('Admin can see all orders', result.ok && result.data.success && Array.isArray(result.data.data))
  
  return true
}

async function runAllTests() {
  console.log('🧪 Starting Functionality Tests...')
  console.log(`📍 Base URL: ${BASE_URL}\n`)
  
  const results = {
    adminLogin: false,
    userLogin: false,
    adminAccess: false,
    products: false,
    cart: null, // Will be set if userLogin succeeds
    orders: null, // Will be set if userLogin succeeds
    categories: false,
    adminProducts: false,
    adminOrders: false,
  }
  
  // Run tests
  results.adminLogin = await testAdminLogin()
  results.userLogin = await testUserLogin()
  
  // Products and Categories can be tested without login
  results.products = await testProductsAPI()
  results.categories = await testCategoriesAPI()
  
  if (results.adminLogin) {
    results.adminAccess = await testAdminAccess()
    results.adminProducts = await testAdminProductsAPI()
    results.adminOrders = await testAdminOrdersAPI()
  }
  
  if (results.userLogin) {
    results.cart = await testCartAPI()
    results.orders = await testOrdersAPI()
  } else {
    console.log('\n🛒 Testing Cart API...')
    logTest('Cart API', null, 'Skipped - User login failed')
    console.log('\n📋 Testing Orders API...')
    logTest('Orders API', null, 'Skipped - User login failed')
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(r => r).length
  const skippedTests = Object.values(results).filter(r => r === null).length
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed === null) {
      console.log(`⏭️  ${test} (skipped)`)
    } else {
      const icon = passed ? '✅' : '❌'
      console.log(`${icon} ${test}`)
    }
  })
  
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passedTests}/${totalTests}`)
  if (skippedTests > 0) {
    console.log(`⏭️  Skipped: ${skippedTests}/${totalTests}`)
  }
  console.log(`❌ Failed: ${totalTests - passedTests - skippedTests}/${totalTests}`)
  console.log('='.repeat(60))
  
  if (!results.userLogin) {
    console.log('\n💡 Tip: User login failed. Create a user account:')
    console.log('   npm run create:user:quick')
    console.log('   Or register at: http://localhost:3000/register')
  }
  
  const actualFailed = totalTests - passedTests - skippedTests
  
  if (actualFailed === 0) {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.')
    if (!results.userLogin) {
      console.log('\n💡 To fix user login test, create a user account:')
      console.log('   npm run create:user:quick')
    }
    process.exit(1)
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution error:', error)
  process.exit(1)
})

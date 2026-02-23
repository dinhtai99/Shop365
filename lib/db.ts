import mysql from 'mysql2/promise'

interface MySQLConfig {
  host: string
  database: string
  user: string
  password: string
  port: number
  waitForConnections: boolean
  connectionLimit: number
  queueLimit: number
}

const config: MySQLConfig = {
  host: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'Shop365',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 20, // Tăng từ 10 lên 20 cho performance tốt hơn
  queueLimit: 10, // Cho phép queue requests
}

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(config)
    console.log('✅ MySQL connection pool created')
  }
  return pool
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  const pool = getPool()
  try {
    const connection = await pool.getConnection()
    console.log('✅ Connected to MySQL')
    return connection
  } catch (error) {
    console.error('❌ Database connection error:', error)
    throw error
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('🔌 Database connection closed')
  }
}

// Helper function to execute queries with array parameters
export async function query<T = any>(
  queryString: string,
  params?: (string | number | null)[]
): Promise<T[]> {
  const pool = getPool()
  
  try {
    if (params && Array.isArray(params)) {
      // If params is array, use directly
      const [results] = await pool.execute(queryString, params)
      return results as T[]
    } else {
      // No parameters
      const [results] = await pool.execute(queryString)
      return results as T[]
    }
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

// Helper function for named parameters (converts @param to ?)
export async function queryNamed<T = any>(
  queryString: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = getPool()
  
  let mysqlQuery = queryString
  const values: (string | number | null)[] = []
  
  try {
    if (params) {
      // Replace @paramName with ? for MySQL
      // Use a more robust replacement to handle multiple occurrences
      const paramNames = Array.from(new Set(queryString.match(/@(\w+)/g) || []))
      
      paramNames.forEach((paramName) => {
        const key = paramName.substring(1) // Remove @
        const value = params[key]
        values.push(value ?? null)
        // Replace all occurrences of this parameter
        mysqlQuery = mysqlQuery.replace(new RegExp(paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '?')
      })
    }
    
    // Chỉ log query trong development mode
    // Removed để tăng performance
    
    const [results] = await pool.execute(mysqlQuery, values)
    return results as T[]
  } catch (error: any) {
    console.error('Query error:', error.message)
    console.error('Query:', mysqlQuery)
    console.error('Values:', values)
    if (error.code) console.error('Error code:', error.code)
    if (error.sqlState) console.error('SQL State:', error.sqlState)
    throw error
  }
}

// Helper function to execute stored procedures
export async function executeProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = getPool()
  
  try {
    const paramNames = Object.keys(params || {})
    const placeholders = paramNames.map(() => '?').join(', ')
    const values = paramNames.map((key) => params![key])
    
    const queryString = `CALL ${procedureName}(${placeholders})`
    const [results] = await pool.execute(queryString, values)
    
    // MySQL stored procedures return results in an array
    return (results as any[])[0] as T[]
  } catch (error) {
    console.error('Stored procedure error:', error)
    throw error
  }
}

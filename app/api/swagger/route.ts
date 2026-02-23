import { NextResponse } from 'next/server'
import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GIA DUNG 365 PLUS API',
      version: '1.0.0',
      description: 'API Documentation cho hệ thống GIA DUNG 365 PLUS - E-commerce platform cho đồ gia dụng thông minh',
      contact: {
        name: 'API Support',
        email: 'support@gadung365.vn',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://gadung365.vn',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            code: { type: 'string' },
            categoryId: { type: 'integer' },
            price: { type: 'number' },
            description: { type: 'string' },
            image: { type: 'string' },
            status: { type: 'integer' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            status: { type: 'integer' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
            totalPrice: { type: 'number' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            productName: { type: 'string' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
            totalPrice: { type: 'number' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            orderCode: { type: 'string' },
            status: { type: 'integer' },
            totalPrice: { type: 'number' },
            totalPriceAfterPromotion: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Products', description: 'Product management endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      { name: 'Cart', description: 'Shopping cart endpoints' },
      { name: 'Orders', description: 'Order management endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Promotions', description: 'Promotion management endpoints' },
    ],
  },
  apis: [
    './app/api/**/*.ts',
    './app/api/**/route.ts',
  ],
}

const swaggerSpec = swaggerJsdoc(options)

export async function GET() {
  return NextResponse.json(swaggerSpec)
}

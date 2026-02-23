/**
 * Unit tests for price formatting utility
 */

function formatPrice(price: number | string): string {
  if (typeof price === 'number') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }
  return price.toString()
}

describe('formatPrice utility', () => {
  it('should format number to VND currency', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('1.000.000')
    expect(result).toContain('₫')
  })

  it('should handle zero', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
  })

  it('should handle large numbers', () => {
    const result = formatPrice(999999999)
    expect(result).toContain('999.999.999')
  })

  it('should handle string input', () => {
    const result = formatPrice('1000000')
    expect(result).toBe('1000000')
  })

  it('should format decimal numbers', () => {
    const result = formatPrice(1234567.89)
    expect(result).toContain('1.234.568')
  })
})

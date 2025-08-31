import { describe, it, expect, vi, beforeEach } from 'vitest'
import { columnExists } from '../../apps/web/lib/db/columns'

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }))
}

// Mock the createClient function
vi.mock('../../apps/web/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase))
}))

describe('columnExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when column exists', async () => {
    // Mock successful response
    const mockChain = mockSupabase.from().select().eq().eq().eq()
    mockChain.single.mockResolvedValue({
      data: { column_name: 'onboarding_completed' },
      error: null
    })

    const result = await columnExists('public', 'profiles', 'onboarding_completed')
    
    expect(result).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('information_schema.columns')
  })

  it('should return false when column does not exist', async () => {
    // Mock error response (column not found)
    const mockChain = mockSupabase.from().select().eq().eq().eq()
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned' }
    })

    const result = await columnExists('public', 'profiles', 'nonexistent_column')
    
    expect(result).toBe(false)
  })

  it('should return false when query throws an exception', async () => {
    // Mock exception
    const mockChain = mockSupabase.from().select().eq().eq().eq()
    mockChain.single.mockRejectedValue(new Error('Database connection failed'))

    const result = await columnExists('public', 'profiles', 'onboarding_completed')
    
    expect(result).toBe(false)
  })

  it('should call the correct query parameters', async () => {
    const mockChain = mockSupabase.from().select().eq().eq().eq()
    mockChain.single.mockResolvedValue({
      data: { column_name: 'test_column' },
      error: null
    })

    await columnExists('test_schema', 'test_table', 'test_column')
    
    expect(mockSupabase.from).toHaveBeenCalledWith('information_schema.columns')
    
    // Verify the chain of calls
    const selectCall = mockSupabase.from().select
    const eqCalls = mockSupabase.from().select().eq
    
    expect(selectCall).toHaveBeenCalledWith('column_name')
    expect(eqCalls).toHaveBeenCalledWith('table_schema', 'test_schema')
    expect(eqCalls).toHaveBeenCalledWith('table_name', 'test_table')
    expect(eqCalls).toHaveBeenCalledWith('column_name', 'test_column')
  })
})

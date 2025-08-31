import { createClient } from '@/lib/supabase/server'

/**
 * Check if a column exists in a table using information_schema
 * @param schema - Database schema name (e.g., 'public')
 * @param table - Table name
 * @param column - Column name
 * @returns Promise<boolean> - true if column exists, false otherwise
 */
export async function columnExists(
  schema: string, 
  table: string, 
  column: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', schema)
      .eq('table_name', table)
      .eq('column_name', column)
      .single()
    
    if (error) {
      // Column doesn't exist or query failed
      console.warn(`[columnExists] Query failed for ${schema}.${table}.${column}:`, error.message)
      return false
    }
    
    return !!data
  } catch (error) {
    console.warn(`[columnExists] Error checking ${schema}.${table}.${column}:`, error)
    return false
  }
}

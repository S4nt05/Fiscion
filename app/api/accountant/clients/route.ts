
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountantId = searchParams.get('accountantId')

    if (!accountantId) {
      return NextResponse.json({ error: 'Accountant ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('assigned_accountant_id', accountantId)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching clients' }, { status: 500 })
  }
}

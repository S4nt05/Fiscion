
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/database/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const accountantId = searchParams.get('accountantId')

    if (!accountantId) {
      return NextResponse.json({ error: 'Accountant ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('accountant_templates')
      .select('*')
      .eq('accountant_id', accountantId)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { accountant_id, template_name, template_content, template_type } = body

    const { data, error } = await supabase
      .from('accountant_templates')
      .insert({
        accountant_id,
        template_name,
        template_content,
        template_type
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating template' }, { status: 500 })
  }
}

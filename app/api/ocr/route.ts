import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/database/server'
import { GoogleDocAIProcessor } from '@/lib/ocr/google-doc-ai'

const parseMoney = (val: any) => {
  if (!val) return 0;
  const num = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(num) || 0;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { fileUrl, userId } = await request.json()
    
    // Usamos tu variable exacta de la captura
    const processorId = process.env.GOOGLE_INVOICE_PROCESSOR_ID;
    if (!processorId) throw new Error("GOOGLE_INVOICE_PROCESSOR_ID no configurada");

    // 1. Procesamiento real
    const { text, entities } = await GoogleDocAIProcessor.processInvoice(fileUrl, processorId)

    // 2. Captura de los campos que solicitaste
    const getE = (type: string) => entities.find(e => e.type === type)?.mentionText || null;

    const data = {
      invoice_number: getE('invoice_id'),       // nFactura
      vendor_name: getE('supplier_name') || 'Proveedor Desconocido', // Proveedor
      vendor_tax_id: getE('supplier_tax_id'),   // Ruc Proveedor
      receiver_name: getE('receiver_name'),     // Cliente
      receiver_tax_id: getE('receiver_tax_id'), // Ruc Cliente
      invoice_date: getE('invoice_date'),       // Fecha
      net_amount: parseMoney(getE('net_amount')), // Monto antes IVA
      tax_amount: parseMoney(getE('total_tax_amount')), // IVA
      total_amount: parseMoney(getE('total_amount')), // TOTAL
      currency: getE('currency') || 'NIO',
      has_retention: entities.some(e => e.type === 'retention_tax') // Lleva retención
    }

    // 3. Log de lo que Google devolvió (Arreglo completo)
    await supabase.from('ocr_debug_logs').insert({
      payload: entities,
      raw_text: text,
      invoice_img_url: fileUrl
    });

    // 4. Guardado en tabla Invoices (con nombres de columna corregidos)
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        file_name: 'factura_procesada.png',
        file_url: fileUrl,
        vendor_name: data.vendor_name,
        vendor_tax_id: data.vendor_tax_id,
        total_amount: data.total_amount,
        tax_amount: data.tax_amount,
        subtotal_amount: data.net_amount,
        invoice_date: data.invoice_date,
        invoice_number: data.invoice_number, // Evita error Property 'nFactura' does not exist
        currency: data.currency,
        raw_text: text,
        ocr_data: data as any
      })
      .select().single()

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, invoice })

  } catch (error: any) {
    console.error('❌ Error OCR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
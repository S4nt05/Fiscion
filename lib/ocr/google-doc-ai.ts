import { DocumentProcessorServiceClient } from '@google-cloud/documentai'

export class GoogleDocAIProcessor {
  private static client: DocumentProcessorServiceClient

  static async processInvoice(fileUrl: string, processorId: string): Promise<{ text: string, entities: any[] }> {
    // 1. Extraer credenciales desde tu variable JSON
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      throw new Error('ERROR: La variable GOOGLE_APPLICATION_CREDENTIALS_JSON no está configurada en el .env');
    }

    // 2. Inicializar el cliente usando el JSON completo
    if (!this.client) {
      try {
        const credentials = JSON.parse(credentialsJson);
        this.client = new DocumentProcessorServiceClient({
          credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key.replace(/\\n/g, '\n'),
          },
          projectId: credentials.project_id
        });
      } catch (e) {
        throw new Error('ERROR: El formato de GOOGLE_APPLICATION_CREDENTIALS_JSON es inválido');
      }
    }

    // 3. Descargar archivo y detectar tipo (Punto 3 para leer los 33,000)
    const response = await fetch(fileUrl);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const fileBuffer = Buffer.from(await response.arrayBuffer());
    
    // 4. Construir ruta usando la info del JSON y tu captura
    const credentials = JSON.parse(credentialsJson);
    const projectId = credentials.project_id;
    const location = process.env.GOOGLE_LOCATION || 'us';
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    const [result] = await this.client.processDocument({
      name: name,
      rawDocument: {
        content: fileBuffer,
        mimeType: contentType,
      }
    });

    return {
      text: result.document?.text || '',
      entities: (result.document?.entities as any[]) || []
    };
  }
}
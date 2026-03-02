import { NextRequest, NextResponse } from 'next/server';

/**
 * Sube una imagen en base64/data URL a un servicio temporal (0x0.st)
 * y devuelve la URL pública. Replicate detecta mejor caras con URLs reales.
 */
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere el campo "image" (data URL o base64)' },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    let contentType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json(
          { error: 'Formato de data URL inválido' },
          { status: 400 }
        );
      }
      contentType = matches[1].toLowerCase();
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Imagen vacía o inválida' },
        { status: 400 }
      );
    }

    // 0x0.st: subida anónima, sin API key, devuelve URL en texto plano
    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    formData.append('file', blob, `image.${ext}`);

    const uploadResponse = await fetch('https://0x0.st', {
      method: 'POST',
      body: formData,
      headers: {
        // No Content-Type: FormData lo establece con boundary
      },
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      console.error('Error 0x0.st:', uploadResponse.status, text);
      return NextResponse.json(
        {
          error: 'No se pudo subir la imagen a hosting temporal',
          details: text || uploadResponse.statusText,
        },
        { status: 502 }
      );
    }

    const publicUrl = (await uploadResponse.text()).trim();
    if (!publicUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Respuesta inválida del servicio de subida', url: publicUrl },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en upload-image:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen', details: message },
      { status: 500 }
    );
  }
}

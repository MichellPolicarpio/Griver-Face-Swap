import { NextRequest, NextResponse } from 'next/server';
import { getModelConfig, getModelEndpoint, AVAILABLE_MODELS } from './config';

// Método GET para verificar que la ruta funciona y mostrar modelos disponibles
export async function GET() {
  const currentModel = getModelConfig();
  return NextResponse.json({ 
    message: 'API Route funcionando correctamente',
    endpoint: '/api/faceswap',
    method: 'POST',
    currentModel: currentModel.name,
    availableModels: Object.keys(AVAILABLE_MODELS).map(key => ({
      name: key,
      description: AVAILABLE_MODELS[key].description,
      cost: AVAILABLE_MODELS[key].cost,
      speed: AVAILABLE_MODELS[key].speed,
    })),
    note: 'Para cambiar el modelo, configura REPLICATE_MODEL en .env.local',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { swapImage, targetImage } = await request.json();

    if (!swapImage || !targetImage) {
      return NextResponse.json(
        { error: 'swapImage y targetImage son requeridos' },
        { status: 400 }
      );
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN no está configurado' },
        { status: 500 }
      );
    }

    // Replicate detecta mejor caras con URLs públicas; las data URLs a veces fallan ("No face found")
    let swapImageUrl = swapImage;

    if (!swapImage.startsWith('http')) {
      // Extraer buffer y tipo desde data URL o base64
      let buffer: Buffer;
      let mime = 'image/jpeg';

      if (swapImage.startsWith('data:')) {
        const match = swapImage.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
          return NextResponse.json(
            { error: 'Formato de imagen inválido' },
            { status: 400 }
          );
        }
        mime = match[1].toLowerCase();
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(swapImage, 'base64');
      }

      if (buffer.length === 0) {
        return NextResponse.json(
          { error: 'Imagen vacía o inválida' },
          { status: 400 }
        );
      }

      // Subir a hosting temporal para obtener URL pública (mejora detección de caras en Replicate)
      console.log('Subiendo imagen a hosting temporal para URL pública...');
      const formData = new FormData();
      // Convertir Buffer de Node a ArrayBuffer para que TypeScript lo acepte como BlobPart
      const arrayBuffer = Uint8Array.from(buffer).buffer;
      const blob = new Blob([arrayBuffer], { type: mime });
      const ext = mime.includes('png') ? 'png' : 'jpg';
      formData.append('file', blob, `face.${ext}`);

      try {
        const uploadRes = await fetch('https://0x0.st', {
          method: 'POST',
          body: formData,
        });

        const responseText = await uploadRes.text();
        if (uploadRes.ok && responseText.trim().startsWith('http')) {
          swapImageUrl = responseText.trim();
          console.log('Imagen subida correctamente, URL:', swapImageUrl);
        } else {
          console.warn('Subida a 0x0.st falló:', uploadRes.status, responseText.slice(0, 100));
          swapImageUrl = swapImage.startsWith('data:') ? swapImage : `data:image/jpeg;base64,${swapImage}`;
        }
      } catch (uploadErr) {
        console.warn('Error en subida temporal:', uploadErr);
        swapImageUrl = swapImage.startsWith('data:') ? swapImage : `data:image/jpeg;base64,${swapImage}`;
      }
    }

    // Obtener configuración del modelo (puede cambiarse con REPLICATE_MODEL)
    const modelConfig = getModelConfig();
    const modelEndpoint = getModelEndpoint(modelConfig);

    // Crear predicción en Replicate usando la configuración del modelo
    const requestBody = {
      input: {
        [modelConfig.inputParams.swapImageKey]: swapImageUrl,
        [modelConfig.inputParams.targetImageKey]: targetImage,
      },
    };

    console.log('Enviando request a Replicate:', {
      model: modelConfig.name,
      hasSwapImage: !!swapImageUrl,
      swapImageType: swapImageUrl.startsWith('data:') ? 'data-url' : swapImageUrl.startsWith('http') ? 'url' : 'unknown',
      swapImageLength: swapImageUrl.length,
      targetImage,
      endpoint: modelEndpoint,
    });

    // Replicate API v1: usar siempre el endpoint /v1/predictions
    // Formato correcto: POST /v1/predictions con model o version en el body
    let predictionResponse;
    try {
      // Construir el body según si tenemos versión específica o no
      const predictionBody: any = {
        input: requestBody.input,
      };

      // Si tenemos versión específica, usarla (más confiable)
      if (modelConfig.version) {
        predictionBody.version = modelConfig.version;
        console.log('Usando versión específica del modelo:', modelConfig.version);
      } else {
        // Si no, usar el modelo completo en formato owner/model
        predictionBody.model = modelConfig.name;
        console.log('Usando modelo completo:', modelConfig.name);
      }

      predictionResponse = await fetch(
        'https://api.replicate.com/v1/predictions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(predictionBody),
        }
      );

      // Si falla, intentar con el endpoint alternativo de modelos (por si acaso)
      if (!predictionResponse.ok && predictionResponse.status === 404) {
        console.log('Endpoint /v1/predictions falló, intentando con endpoint de modelos...');
        const fallbackResponse = await fetch(
          modelEndpoint,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );
        
        if (fallbackResponse.ok) {
          predictionResponse = fallbackResponse;
          console.log('Fallback exitoso, usando endpoint de modelos');
        } else {
          // Si el fallback también falla, devolver el error original
          const errorText = await fallbackResponse.text();
          console.error('Fallback también falló:', {
            status: fallbackResponse.status,
            error: errorText,
          });
        }
      }
    } catch (fetchError: any) {
      console.error('Error en fetch a Replicate:', fetchError);
      return NextResponse.json(
        { 
          error: 'Error de conexión con Replicate', 
          details: fetchError.message,
          model: modelConfig.name,
        },
        { status: 500 }
      );
    }

    if (!predictionResponse.ok) {
      let errorData;
      try {
        errorData = await predictionResponse.json();
      } catch {
        errorData = await predictionResponse.text();
      }
      
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : JSON.stringify(errorData);
      
      console.error('Error de Replicate:', {
        status: predictionResponse.status,
        statusText: predictionResponse.statusText,
        error: errorData,
        model: modelConfig.name,
        swapImageType: swapImageUrl.startsWith('data:') ? 'data-url' : 'url',
      });
      
      // Si el error es 422 (Unprocessable Entity), probablemente es por el formato de imagen
      let userFriendlyError = 'Error al crear predicción en Replicate';
      if (predictionResponse.status === 422) {
        userFriendlyError = 'Replicate rechazó la imagen. Puede que necesites usar una URL pública en lugar de data URL.';
      } else if (predictionResponse.status === 401 || predictionResponse.status === 403) {
        userFriendlyError = 'Error de autenticación. Verifica tu REPLICATE_API_TOKEN.';
      } else if (predictionResponse.status === 402) {
        userFriendlyError = 'Sin créditos suficientes en tu cuenta de Replicate.';
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError,
          details: errorMessage,
          status: predictionResponse.status,
          model: modelConfig.name,
          suggestion: swapImageUrl.startsWith('data:') 
            ? 'Replicate puede requerir URLs públicas. Considera usar otro modelo o subir la imagen a un servicio de hosting.'
            : undefined,
        },
        { status: predictionResponse.status }
      );
    }

    const prediction = await predictionResponse.json();
    console.log('Respuesta inicial de Replicate:', {
      id: prediction.id,
      status: prediction.status,
      urls: prediction.urls,
    });

    // Replicate puede devolver la predicción directamente si está lista, o URLs para polling
    let result = null;
    
    // Si ya está completa, devolver resultado directamente
    if (prediction.status === 'succeeded' && prediction.output) {
      result = prediction.output;
      console.log('Predicción completada inmediatamente');
    } else {
      // Necesitamos hacer polling
      const statusUrl = prediction.urls?.get || prediction.urls?.status || prediction.id 
        ? `https://api.replicate.com/v1/predictions/${prediction.id}` 
        : null;

      if (!statusUrl) {
        console.error('No se pudo determinar URL de estado:', prediction);
        return NextResponse.json(
          { 
            error: 'No se recibió URL de estado de Replicate',
            predictionResponse: prediction,
          },
          { status: 500 }
        );
      }

      console.log('Iniciando polling en:', statusUrl);

      // Polling del estado hasta que termine
      let attempts = 0;
      const maxAttempts = 90; // máximo 3 minutos (90 * 2 segundos)
      const pollInterval = 2000; // 2 segundos

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(statusUrl, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error('Error al consultar estado:', {
            status: statusResponse.status,
            error: errorText,
          });
          return NextResponse.json(
            { 
              error: 'Error al consultar estado de Replicate',
              details: errorText,
              status: statusResponse.status,
            },
            { status: statusResponse.status }
          );
        }

        const statusData = await statusResponse.json();
        console.log(`Polling intento ${attempts + 1}/${maxAttempts}:`, {
          status: statusData.status,
          id: statusData.id,
          hasOutput: !!statusData.output,
          output: statusData.output,
        });
        
        if (statusData.status === 'succeeded') {
          // Verificar si hay errores en los logs (como "No face found")
          const logs = statusData.logs || '';
          const hasErrorInLogs = logs.includes('No face found') || 
                                 logs.includes('no face') || 
                                 logs.includes('face not found') ||
                                 logs.toLowerCase().includes('error');
          
          if (hasErrorInLogs && !statusData.output) {
            console.error('Modelo reportó error en logs:', logs);
            let errorMessage = 'No se pudo detectar una cara';
            const suggestions = [
              'Tu foto: que tu cara se vea clara, bien iluminada y de frente',
              'El escenario: debe tener una persona con cara visible (los escenarios por defecto ya la incluyen)',
              'Prueba con otro escenario o con otra foto tuya',
            ];
            
            if (logs.includes('No face found')) {
              errorMessage = 'No se encontró una cara: revisa tu foto y que el escenario tenga una persona visible';
            }
            
            return NextResponse.json(
              { 
                error: errorMessage,
                details: logs.substring(0, 500), // Limitar longitud de logs
                suggestions: suggestions,
                logs: logs,
              },
              { status: 400 }
            );
          }
          
          // El output puede ser una URL string o un array de URLs
          let outputResult = statusData.output;
          
          console.log('Estado succeeded detectado, procesando output:', {
            output: outputResult,
            outputType: typeof outputResult,
            isArray: Array.isArray(outputResult),
            outputLength: Array.isArray(outputResult) ? outputResult.length : 'N/A',
            hasLogs: !!logs,
          });
          
          // Si el output es un array, tomar el primer elemento
          if (Array.isArray(outputResult)) {
            if (outputResult.length > 0) {
              outputResult = outputResult[0];
              console.log('Output es array, usando primer elemento:', outputResult);
            } else {
              console.error('Output es array vacío');
              return NextResponse.json(
                { 
                  error: 'Predicción completada pero output es array vacío',
                  details: logs || 'No hay información adicional',
                  suggestions: ['Intenta con otra imagen donde tu cara sea más visible'],
                },
                { status: 500 }
              );
            }
          }
          
          // Verificar que tenemos un resultado válido
          if (!outputResult || outputResult === null || outputResult === undefined) {
            console.error('Estado succeeded pero output es inválido:', {
              output: outputResult,
              logs: logs.substring(0, 200),
            });
            
            // Si hay logs con errores, incluirlos en el mensaje
            if (logs.includes('No face found')) {
              return NextResponse.json(
                { 
                  error: 'No se encontró una cara en la imagen',
                  details: 'El modelo no pudo detectar una cara para intercambiar',
                  suggestions: [
                    'Asegúrate de que tu cara esté claramente visible en la imagen',
                    'Mejora la iluminación',
                    'Acércate más a la cámara',
                    'Intenta con otra foto'
                  ],
                },
                { status: 400 }
              );
            }
            
            return NextResponse.json(
              { 
                error: 'Predicción completada pero sin resultado válido',
                details: logs || 'No hay información adicional',
                suggestions: ['Intenta con otra imagen o verifica la calidad de la foto'],
              },
              { status: 500 }
            );
          }
          
          result = outputResult;
          console.log('✅ Resultado asignado correctamente:', {
            result: result,
            resultType: typeof result,
            resultLength: typeof result === 'string' ? result.length : 'N/A',
          });
          break; // Salir del while loop
        }

        if (statusData.status === 'failed' || statusData.status === 'canceled') {
          console.error('Predicción falló:', statusData);
          return NextResponse.json(
            { 
              error: `Predicción falló: ${statusData.error || 'Estado: ' + statusData.status}`,
              details: statusData.error || JSON.stringify(statusData),
            },
            { status: 500 }
          );
        }

        // Incrementar intentos para cualquier otro estado (starting, processing, etc.)
        attempts++;
      }

      // Verificar si obtuvimos resultado después del polling
      if (!result) {
        console.error('❌ Timeout después de', attempts, 'intentos. Result es:', result);
        return NextResponse.json(
          { 
            error: 'Timeout: La predicción tardó demasiado',
            details: `Se intentó ${attempts} veces durante ${(attempts * pollInterval / 1000).toFixed(0)} segundos`,
            suggestion: 'Intenta con otro modelo o verifica que tengas créditos en Replicate',
          },
          { status: 504 }
        );
      }
    }

    // Verificar resultado final antes de devolver
    console.log('📤 Devolviendo resultado final:', {
      hasResult: !!result,
      resultType: typeof result,
      result: result,
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error en API Route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

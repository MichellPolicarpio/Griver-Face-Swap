'use client';

import { useState, useRef, useEffect } from 'react';
import './globals.css';

type Scenario = {
  id: string;
  name: string;
  imageUrl: string;
  icon: string;
};

// IMPORTANTE: Las imágenes de escenario deben mostrar UNA PERSONA con la cara visible.
// El modelo reemplaza la cara de esa persona por la tuya. Sin persona en la imagen → "No face found".
const scenarios: Scenario[] = [
  {
    id: 'woman-a1',
    name: 'Mujer A1',
    imageUrl: 'https://i.ibb.co/m5Cb2ZS6/Image-9.jpg',
    icon: 'A1',
  },
  {
    id: 'woman-a2',
    name: 'Mujer A2',
    imageUrl: 'https://i.ibb.co/RfjX1dh/Image-5.jpg',
    icon: 'A2',
  },
  {
    id: 'woman-b1',
    name: 'Mujer B1',
    imageUrl: 'https://i.ibb.co/gZy7R3pz/Image-7.jpg',
    icon: 'B1',
  },
  {
    id: 'woman-b2',
    name: 'Mujer B2',
    imageUrl: 'https://i.ibb.co/WWZJPH4M/Image-4.jpg',
    icon: 'B2',
  },
  {
    id: 'man-a1',
    name: 'Hombre A1',
    imageUrl: 'https://i.ibb.co/bg5dmJ5w/Image-3-1.jpg',
    icon: 'A1',
  },
  {
    id: 'man-a2',
    name: 'Hombre A2',
    imageUrl: 'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?w=800',
    icon: 'A2',
  },
  {
    id: 'man-b1',
    name: 'Hombre B1',
    imageUrl: 'https://i.ibb.co/qLdfryKK/Image-8.jpg',
    icon: 'B1',
  },
  {
    id: 'man-b2',
    name: 'Hombre B2',
    imageUrl: 'https://i.ibb.co/7dMHSkWd/Image-6.jpg',
    icon: 'B2',
  },
];

// Mensajes de estado dinámicos mientras procesa (creativos, logísticos)
const LOADING_STATUS_MESSAGES = [
  'Escaneando y analizando tu rostro...',
  'Ajustando proporciones faciales al escenario...',
  'Importando herramientas aduanales...',
  'Verificando permisos de comercio exterior...',
  'Sincronizando con el Puerto de Veracruz...',
  'Aplicando equipo de seguridad industrial...',
  'Procesando coordenadas del contenedor...',
  'Calibrando iluminación del escenario...',
  'Confirmando acceso al área restringida...',
  'Integrando al escenario logístico...',
  'Ajustando ángulo de cámara portuaria...',
  'Ejecutando protocolo de identificación...',
  'Generando credencial de acceso logístico...',
  'Finalizando detalles del escenario...',
];

// Datos curiosos de Griver (Grupo Inversor Veracruzano) para mostrar mientras carga
const GRIVER_FACTS = [
  'GRIVER tiene su origen en 1925, en el gremio de Agentes Aduanales del Puerto de Veracruz.',
  'Es la agrupación de negocios aduanales más antigua de México.',
  'Los accionistas actuales son la tercera y cuarta generación de los fundadores de la Aduana de Veracruz.',
  'Algunos fundadores crearon la primera Cámara Española de Comercio e Industria de Veracruz.',
  'RICSA, del grupo, se fundó en 1995 y está certificada en ISO 9001:2015 y HACCP.',
  'Friopuerto Veracruz fue el primer frigorífico del Golfo de México, inaugurado en 2015.',
  'El frigorífico tiene capacidad para 3,500 toneladas y cámaras hasta -21°C.',
  'GRIVER tiene un terreno de 20,000 m² en el Puerto de Veracruz.',
  'El grupo ofrece HS Coder, clasificación arancelaria con inteligencia artificial.',
  'RECO es la división especializada en soluciones tecnológicas para comercio exterior.',
  'Además de Veracruz, GRIVER opera en Manzanillo, Colima y Boca del Río.',
  'POLARPORT tiene más de 18,200 m² para cadena de frío en el puerto.',
];

export default function Home() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null);
  const [useUpload, setUseUpload] = useState(true);
  const [customTargetUrl, setCustomTargetUrl] = useState('');
  const [curiousFactIndex, setCuriousFactIndex] = useState(0);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animaciones del modal de carga
  useEffect(() => {
    if (!isProcessing) return;

    // Mensaje de estado cada 2.5 s
    const statusInterval = setInterval(() => {
      setStatusMessageIndex((i) => (i + 1) % LOADING_STATUS_MESSAGES.length);
    }, 2500);

    // Dato curioso cada 5 s
    const factInterval = setInterval(() => {
      setCuriousFactIndex((i) => (i + 1) % GRIVER_FACTS.length);
    }, 5000);

    // Progreso: ~1 minuto + 10 segundos para llegar al 100% (1% cada 700 ms)
    const progressInterval = setInterval(() => {
      setFakeProgress((prev) => Math.min(100, prev + 1));
    }, 700);

    return () => {
      clearInterval(statusInterval);
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, [isProcessing]);

  useEffect(() => {
    // Comprobar soporte básico de cámara en el navegador,
    // pero NO llamar a getUserMedia automáticamente (iOS requiere gesto del usuario).
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setHasWebcam(true);
    } else {
      setHasWebcam(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    // Intentar primero con facingMode (más compatible con móviles/iPad),
    // y si falla hacer fallback a constraints básicas.
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: 'user' } },
      { video: true },
    ];

    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // En iOS el video necesita llamar a play() explícitamente
          videoRef.current.play().catch(() => {});
          streamRef.current = stream;
          setHasWebcam(true);
          setIsCapturing(true);
          setUseUpload(false);
          setUploadedImage(null);
        }
        return; // éxito, salir del loop
      } catch (err) {
        console.warn('getUserMedia falló con constraint:', constraint, err);
      }
    }

    // Si todos los intentos fallaron, no hay cámara disponible
    console.error('No se pudo acceder a la webcam en ningún modo');
    setHasWebcam(false);
    setError('No se pudo acceder a la webcam. Puedes subir una imagen en su lugar.');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Si la imagen no es JPEG, convertirla usando canvas
      if (!result.startsWith('data:image/jpeg')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setUploadedImage(result); // Fallback a imagen original
            setUseUpload(true);
            setError(null);
            return;
          }
          
          // Asegurar tamaño mínimo para mejor detección
          const minWidth = 640;
          const minHeight = 480;
          let width = img.width;
          let height = img.height;
          
          if (width < minWidth || height < minHeight) {
            const scale = Math.max(minWidth / width, minHeight / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a JPEG con alta calidad
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          setUploadedImage(jpegDataUrl);
          setUseUpload(true);
          setError(null);
        };
        img.onerror = () => {
          setUploadedImage(result); // Fallback
          setUseUpload(true);
          setError(null);
        };
        img.src = result;
      } else {
        setUploadedImage(result);
        setUseUpload(true);
        setError(null);
      }
      
      // Detener webcam si está activa
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const switchToWebcam = () => {
    setUseUpload(false);
    setUploadedImage(null);
    startWebcam();
  };

  const switchToUpload = () => {
    // Detener webcam si está activa
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setUseUpload(true);
    setError(null);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Asegurar tamaño mínimo para mejor detección de caras
    const minWidth = 640;
    const minHeight = 480;
    
    // Calcular dimensiones manteniendo aspect ratio
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width < minWidth || height < minHeight) {
      const scale = Math.max(minWidth / width, minHeight / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Mejorar la calidad de renderizado
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, width, height);

    // Convertir a base64 en formato JPEG con alta calidad
    // Usar calidad 0.95 para mejor detección de caras
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleTransform = async () => {
    const targetImageUrl = customTargetUrl.trim() || selectedScenario?.imageUrl;
    if (!targetImageUrl) {
      setError('Selecciona un escenario o pega la URL de una imagen (con una persona visible)');
      return;
    }

    let photoBase64: string | null = null;

    if (useUpload && uploadedImage) {
      // Usar imagen subida
      photoBase64 = uploadedImage;
    } else if (isCapturing) {
      // Usar webcam
      photoBase64 = capturePhoto();
    }

    if (!photoBase64) {
      setError(useUpload 
        ? 'Por favor, sube una imagen primero' 
        : 'No se pudo capturar la foto. Intenta subir una imagen.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultImage(null);
    setCuriousFactIndex(0);
    setStatusMessageIndex(0);
    setFakeProgress(0);

    try {
      const response = await fetch('/api/faceswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swapImage: photoBase64,
          targetImage: targetImageUrl,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Error HTTP ${response.status}: ${response.statusText}` };
        }
        const errorMessage = errorData.error || 'Error al procesar la imagen';
        const errorDetails = errorData.details ? `\nDetalles: ${errorData.details}` : '';
        const suggestions = errorData.suggestions ? `\n\nSugerencias:\n${errorData.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` : '';
        throw new Error(`${errorMessage}${errorDetails}${suggestions}`);
      }

      const data = await response.json();
      
      if (data.result) {
        setResultImage(data.result);
      } else {
        throw new Error('No se recibió resultado de Replicate');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `face-swap-${selectedScenario?.id || 'custom'}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="container">
      <header className="header">
        <img src="/griver-logo.png" alt="Griver" className="header-logo" />
        <div className="header-titles">
          <h1>Griver</h1>
          <p>Simula cómo te verías en cada escenario</p>
        </div>
      </header>

      <div className="content">
        {/* Sección izquierda: Webcam o Imagen Subida */}
        <div className="webcam-section">
          <div className="input-mode-toggle">
            {hasWebcam !== false && (
              <button
                className={`mode-button ${!useUpload ? 'active' : ''}`}
                onClick={switchToWebcam}
                disabled={isProcessing}
              >
                Webcam
              </button>
            )}
            <button
              className={`mode-button ${useUpload ? 'active' : ''}`}
              onClick={() => {
                switchToUpload();
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
            >
              Subir Imagen
            </button>
          </div>
          
          <div className="webcam-container">
            {useUpload ? (
              uploadedImage ? (
                <div className="uploaded-image-container">
                  <img src={uploadedImage} alt="Imagen subida" className="uploaded-image" />
                  <button
                    className="change-image-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    Cambiar Imagen
                  </button>
                </div>
              ) : (
                <div className="webcam-placeholder">
                  <p>Sube una imagen para continuar</p>
                  <button
                    className="change-image-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    Seleccionar Imagen
                  </button>
                </div>
              )
            ) : isCapturing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="webcam-video"
              />
            ) : (
              <div className="webcam-placeholder">
                {hasWebcam === false ? (
                  <>
                    <p>📷 No hay webcam disponible</p>
                    <p>Sube una imagen para continuar</p>
                  </>
                ) : (
                  <>
                    <p>Presiona para iniciar la webcam</p>
                    <button
                      className="change-image-button"
                      onClick={startWebcam}
                      disabled={isProcessing}
                    >
                      Iniciar Webcam
                    </button>
                  </>
                )}
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Sección derecha: Selector de personas/escenarios */}
        <div className="scenarios-section">
          <h2>Selecciona una Persona</h2>
          <p className="scenario-hint">Elige una persona de referencia (Mujer A1/A2/B1/B2, Hombre A1/A2/B1/B2); verás cómo te verías tú en su lugar.</p>
          <div className="scenarios-grid">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`scenario-button ${
                  selectedScenario?.id === scenario.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedScenario(scenario)}
                disabled={isProcessing}
              >
                <span className="scenario-icon">{scenario.icon}</span>
                <span className="scenario-name">{scenario.name}</span>
              </button>
            ))}
          </div>

          <div className="custom-url-section">
            <label htmlFor="custom-target-url">O pega la URL de cualquier imagen (debe tener una persona visible):</label>
            <input
              id="custom-target-url"
              type="url"
              className="custom-url-input"
              placeholder="https://ejemplo.com/imagen-con-persona.jpg"
              value={customTargetUrl}
              onChange={(e) => setCustomTargetUrl(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <button
            className="transform-button"
            onClick={handleTransform}
            disabled={!(selectedScenario || customTargetUrl.trim()) || isProcessing || (!isCapturing && !uploadedImage)}
          >
            {isProcessing ? 'PROCESANDO...' : useUpload ? 'TRANSFORMAR IMAGEN' : 'CAPTURAR Y TRANSFORMAR'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          <span>!</span> 
          <div className="error-content">
            {error.split('\n').map((line, index) => (
              <div key={index} className={line.startsWith('Sugerencias:') || /^\d+\./.test(line.trim()) ? 'error-suggestion' : ''}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal único: carga con datos curiosos → resultado en el mismo popup */}
      {(isProcessing || resultImage) && (
        <div
          className="result-popup-overlay"
          onClick={() => !isProcessing && setResultImage(null)}
        >
          <div
            className={`result-popup result-popup-unified${isProcessing ? '' : ' result-popup-wide'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {isProcessing ? (
              <div className="modal-loading-content">
                {/* Logo */}
                <img src="/griver-logo.png" alt="Griver" className="modal-loading-logo" />

                {/* Título */}
                <div>
                  <h2 className="modal-loading-title">Estamos creando tu simulación</h2>
                  <p className="modal-loading-subtitle">Esto puede tardar hasta un minuto — ¡vale la pena!</p>
                </div>

                {/* Barra de progreso */}
                <div className="modal-progress-wrapper">
                  <div className="modal-progress-track">
                    <div
                      className="modal-progress-fill"
                      style={{ width: `${fakeProgress}%` }}
                    />
                  </div>
                  <span className="modal-progress-pct">{Math.round(fakeProgress)}%</span>
                </div>

                {/* Mensaje de estado dinámico */}
                <div className="modal-status-row">
                  <span className="modal-status-dots">
                    <span /><span /><span />
                  </span>
                  <p className="modal-status-text">{LOADING_STATUS_MESSAGES[statusMessageIndex]}</p>
                </div>

                {/* Divisor + dato curioso */}
                <div className="modal-facts-divider">
                  <span className="modal-facts-divider-line" />
                  <span className="modal-facts-divider-label">¿Sabías que...?</span>
                  <span className="modal-facts-divider-line" />
                </div>
                <p className="modal-fact-text">{GRIVER_FACTS[curiousFactIndex]}</p>
              </div>
            ) : (
              <>
                <button type="button" className="result-popup-close" onClick={() => setResultImage(null)} aria-label="Cerrar">
                  ×
                </button>
                <h2>Así te verías en el escenario</h2>
                <div className="result-image-container">
                  <img src={resultImage!} alt="Simulación Griver" className="result-image" />
                </div>
                <div className="result-popup-actions">
                  <button className="download-button" onClick={downloadResult}>DESCARGAR IMAGEN</button>
                  <button type="button" className="result-popup-close-button" onClick={() => setResultImage(null)}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

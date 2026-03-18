'use client';

import { useState, useRef, useEffect } from 'react';
import './globals.css';

type Scenario = {
  id: string;
  name: string;
  imageUrl: string;
  icon: string;
};

type InfoSection = 'acerca' | 'ayuda' | 'privacidad' | 'griver';

const scenarios: Scenario[] = [
  {
    id: 'woman-a1',
    name: 'Mujer A1',
    imageUrl: 'https://i.ibb.co/3m4K3DCm/Gemini-Generated-Image-lc7yw0lc7yw0lc7y.png',
    icon: 'A1',
  },
  {
    id: 'woman-a2',
    name: 'Mujer A2',
    imageUrl: 'https://i.ibb.co/tptNL6NP/Gemini-Generated-Image-qxpkz9qxpkz9qxpk.png',
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
    imageUrl: 'https://i.ibb.co/wZ81sPsN/Gemini-Generated-Image-vmzik5vmzik5vmzi-1.png',
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

const EXTENDED_LOADING_MESSAGES = [
  'Esto está tardando más de lo normal... seguimos trabajando.',
  'Estamos generando tu imagen a partir de las métricas de tu cara.',
  'Optimizando detalles finos (iluminación, textura y contorno).',
  'Haciendo un segundo pase para mejorar la calidad.',
  'Estamos teniendo problemas de procesar un rostro tan estético.',
];

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
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
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
  const [isExtendedLoading, setIsExtendedLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [infoSection, setInfoSection] = useState<InfoSection | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeInfo = () => setInfoSection(null);

  const openSection = (section: InfoSection) => {
    setInfoSection(section);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isMenuOpen) setIsMenuOpen(false);
      if (infoSection) closeInfo();
      if (resultImage && !isProcessing) setResultImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen, infoSection, resultImage, isProcessing]);

  useEffect(() => {
    if (!isProcessing) return;
    const statusInterval = setInterval(() => {
      setStatusMessageIndex((i) => (i + 1) % LOADING_STATUS_MESSAGES.length);
    }, 2500);
    const factInterval = setInterval(() => {
      setCuriousFactIndex((i) => (i + 1) % GRIVER_FACTS.length);
    }, 5000);
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
    if (!isProcessing) {
      setIsExtendedLoading(false);
      return;
    }
    if (fakeProgress < 100) {
      setIsExtendedLoading(false);
      return;
    }
    const t = setTimeout(() => setIsExtendedLoading(true), 1200);
    return () => clearTimeout(t);
  }, [isProcessing, fakeProgress]);

  useEffect(() => {
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
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: 'user' } },
      { video: true },
    ];
    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        streamRef.current = stream;
        setHasWebcam(true);
        setUseUpload(false);
        setUploadedImage(null);
        setIsCapturing(true);

        // Esperar a que el <video> esté montado y asignar stream
        setTimeout(() => {
          if (!videoRef.current) return;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }, 0);
        return;
      } catch (err) {
        console.warn('getUserMedia falló con constraint:', constraint, err);
      }
    }
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
      if (!result.startsWith('data:image/jpeg')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setUploadedImage(result);
            setUseUpload(true);
            setError(null);
            return;
          }
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
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          setUploadedImage(jpegDataUrl);
          setUseUpload(true);
          setError(null);
        };
        img.onerror = () => {
          setUploadedImage(result);
          setUseUpload(true);
          setError(null);
        };
        img.src = result;
      } else {
        setUploadedImage(result);
        setUseUpload(true);
        setError(null);
      }
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
    setCapturedPhoto(null);
    startWebcam();
  };

  const switchToUpload = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setCapturedPhoto(null);
    setUseUpload(true);
    setError(null);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setError(null);
    startWebcam();
  };

  const snapPhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const minWidth = 640;
    const minHeight = 480;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (!width || !height) {
      setError('La cámara se está iniciando. Espera un momento e intenta de nuevo.');
      return null;
    }

    if (width < minWidth || height < minHeight) {
      const scale = Math.max(minWidth / width, minHeight / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleCapture = () => {
    const photo = snapPhoto();
    if (!photo) return;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturing(false);
    setCapturedPhoto(photo);
    setError(null);
  };

  const handleTransform = async () => {
    const targetImageUrl = customTargetUrl.trim() || selectedScenario?.imageUrl;
    if (!targetImageUrl) {
      setError('Selecciona un escenario o pega la URL de una imagen (con una persona visible)');
      return;
    }
    const photoBase64 = useUpload ? uploadedImage : capturedPhoto;
    if (!photoBase64) {
      setError(useUpload
        ? 'Por favor, sube una imagen primero'
        : 'Primero captura tu foto con la webcam');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapImage: photoBase64, targetImage: targetImageUrl }),
      });
      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch { errorData = { error: `Error HTTP ${response.status}: ${response.statusText}` }; }
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

  const hasSourceImage = useUpload ? !!uploadedImage : !!capturedPhoto;
  const isTransformDisabled = isProcessing || !hasSourceImage;
  const transformLabel = isProcessing ? 'PROCESANDO...' : 'TRANSFORMAR IMAGEN';
  const statusMessages = isExtendedLoading ? EXTENDED_LOADING_MESSAGES : LOADING_STATUS_MESSAGES;
  const statusMessage = statusMessages[statusMessageIndex % statusMessages.length];

  return (
    <main className="container">
      {/* ── Drawer overlay ── */}
      <div
        className={`drawer-overlay${isMenuOpen ? ' drawer-overlay--visible' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Drawer lateral ── */}
      <nav className={`drawer${isMenuOpen ? ' drawer--open' : ''}`} aria-label="Menú principal">
        <div className="drawer-header">
          <img src="/griver-logo.png" alt="Griver" className="drawer-logo" />
          <span className="drawer-brand">GRIVER</span>
          <button type="button" className="drawer-close" onClick={() => setIsMenuOpen(false)} aria-label="Cerrar menú">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="drawer-items">
          <button type="button" className="drawer-item" onClick={() => openSection('acerca')}>
            <svg className="drawer-item-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <span>Acerca de</span>
          </button>
          <button type="button" className="drawer-item" onClick={() => openSection('ayuda')}>
            <svg className="drawer-item-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.01 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Ayuda</span>
          </button>
          <button type="button" className="drawer-item" onClick={() => openSection('privacidad')}>
            <svg className="drawer-item-icon" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
            <span>Aviso de Privacidad</span>
          </button>
          <button type="button" className="drawer-item" onClick={() => openSection('griver')}>
            <svg className="drawer-item-icon" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Sobre GRIVER</span>
          </button>
        </div>

        <div className="drawer-footer">
          <span>&copy; {new Date().getFullYear()} Grupo Inversor Veracruzano</span>
        </div>
      </nav>

      <header className="header">
        <button
          type="button"
          className="hamburger-button"
          aria-label="Abrir menú"
          onClick={() => setIsMenuOpen(true)}
          disabled={isProcessing}
        >
          <span className="hamburger-lines" aria-hidden="true"><span /><span /><span /></span>
        </button>
        <img src="/griver-logo.png" alt="Griver" className="header-logo" />
        <div className="header-titles">
          <h1>Griver</h1>
          <p>Simula cómo te verías en cada escenario</p>
        </div>
      </header>

      {/* ── Modal informativo premium ── */}
      {infoSection && (
        <div className="info-overlay" onClick={closeInfo} role="presentation">
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="info-modal-close" onClick={closeInfo} aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>

            {infoSection === 'acerca' && (
              <div className="info-body">
                <div className="info-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <h2>Acerca de esta plataforma</h2>
                <div className="info-divider" />
                <p>
                  Esta experiencia interactiva fue creada por el <strong>área de Marketing de GRIVER</strong> con el
                  objetivo de acercar a colaboradores, clientes y visitantes al mundo de la logística internacional de
                  una manera innovadora y entretenida.
                </p>
                <p>
                  El proyecto nace bajo la dirección de <strong>Aracelly Morales</strong> y <strong>Samantha Audirac</strong>,
                  quienes impulsaron la idea de combinar inteligencia artificial con la identidad corporativa del grupo
                  para crear simulaciones visuales únicas.
                </p>
                <p>
                  Mediante tecnología de intercambio facial, los usuarios pueden visualizarse dentro de escenarios
                  reales del sector, mostrando cómo se verían en un entorno de logística, fortaleciendo el sentido de
                  pertenencia y la conexión emocional con la industria logística.
                </p>
              </div>
            )}

            {infoSection === 'ayuda' && (
              <div className="info-body">
                <div className="info-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.01 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2>Cómo usar la plataforma</h2>
                <div className="info-divider" />

                <div className="info-step-card">
                  <span className="info-step-num">1</span>
                  <div>
                    <strong>Elige tu método de captura</strong>
                    <p>Selecciona <em>Webcam</em> para tomar una foto en vivo, o <em>Subir Imagen</em> para usar una
                    fotografía que ya tengas en tu dispositivo. Ambos métodos funcionan igual de bien.</p>
                  </div>
                </div>
                <div className="info-step-card">
                  <span className="info-step-num">2</span>
                  <div>
                    <strong>Selecciona un escenario</strong>
                    <p>Elige entre los perfiles de Hombre o Mujer disponibles. Cada uno representa un escenario
                    logístico diferente. También puedes pegar la URL de cualquier imagen que contenga a una persona
                    con el rostro visible.</p>
                  </div>
                </div>
                <div className="info-step-card">
                  <span className="info-step-num">3</span>
                  <div>
                    <strong>Genera tu simulación</strong>
                    <p>Presiona el botón &ldquo;Capturar y Transformar&rdquo; o &ldquo;Transformar
                    Imagen&rdquo;. La inteligencia artificial procesará tu fotografía y la integrará al
                    escenario seleccionado. El proceso toma aproximadamente un minuto.</p>
                  </div>
                </div>
                <div className="info-step-card">
                  <span className="info-step-num">4</span>
                  <div>
                    <strong>Descarga y comparte</strong>
                    <p>Una vez lista la imagen, podrás verla en pantalla y descargarla a tu dispositivo para
                    compartirla con quien desees.</p>
                  </div>
                </div>

                <div className="info-highlight">
                  <strong>Tip para mejores resultados:</strong> Usa una foto con buena iluminación, rostro de frente,
                  sin lentes de sol y con el encuadre centrado en tu cara. Esto ayuda a la IA a detectar tu rostro con
                  mayor precisión.
                </div>
              </div>
            )}

            {infoSection === 'privacidad' && (
              <div className="info-body">
                <div className="info-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                </div>
                <h2>Aviso de Privacidad</h2>
                <div className="info-divider" />
                <p>
                  En GRIVER nos tomamos muy en serio la privacidad de nuestros usuarios. A continuación, te
                  informamos cómo se manejan tus datos al utilizar esta plataforma:
                </p>
                <ul className="info-privacy-list">
                  <li>
                    <strong>Las imágenes NO se almacenan.</strong> Ni GRIVER, ni esta plataforma, ni ningún tercero
                    guarda, almacena o retiene las fotografías que subas o captures con la webcam.
                  </li>
                  <li>
                    <strong>Uso exclusivo para el evento.</strong> Las imágenes se procesan en tiempo real únicamente
                    para generar la simulación visual y se descartan inmediatamente después.
                  </li>
                  <li>
                    <strong>Sin recopilación de datos personales.</strong> No se solicita nombre, correo electrónico ni
                    ningún otro dato personal para utilizar la plataforma.
                  </li>
                  <li>
                    <strong>Procesamiento seguro.</strong> El intercambio facial se realiza a través de una API externa
                    cifrada (Replicate) que no conserva las imágenes una vez procesadas.
                  </li>
                  <li>
                    <strong>Descarga voluntaria.</strong> Solo tú decides si descargas o compartes la imagen generada.
                    GRIVER no tiene acceso a la imagen resultante.
                  </li>
                </ul>
                <div className="info-highlight">
                  Si tienes dudas o inquietudes sobre el manejo de tu información, puedes contactarnos a través de
                  los canales oficiales de GRIVER.
                </div>
              </div>
            )}

            {infoSection === 'griver' && (
              <div className="info-body">
                <div className="info-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2>Sobre GRIVER</h2>
                <div className="info-divider" />
                <p>
                  <strong>GRIVER (Grupo Inversor Veracruzano)</strong> es uno de los consorcios logísticos más
                  importantes del Golfo de México, con raíces que se remontan a <strong>1925</strong> en el gremio de
                  Agentes Aduanales del Puerto de Veracruz.
                </p>
                <p>
                  Es la agrupación de negocios aduanales <strong>más antigua de México</strong>. Sus accionistas
                  actuales representan la tercera y cuarta generación de los fundadores originales de la Aduana de
                  Veracruz, algunos de los cuales también fundaron la primera Cámara Española de Comercio e Industria
                  de Veracruz.
                </p>

                <h3 className="info-subtitle">Empresas del Grupo</h3>
                <div className="info-companies-grid">
                  <div className="info-company-card">
                    <strong>RICSA</strong>
                    <p>Fundada en 1995. Certificada en ISO 9001:2015 y HACCP. Especialista en agencia aduanal y
                    comercio exterior.</p>
                  </div>
                  <div className="info-company-card">
                    <strong>Friopuerto Veracruz</strong>
                    <p>Primer frigorífico del Golfo de México (2015). Capacidad de 3,500 toneladas con cámaras
                    hasta &minus;21&deg;C.</p>
                  </div>
                  <div className="info-company-card">
                    <strong>POLARPORT</strong>
                    <p>Más de 18,200 m² dedicados a cadena de frío en el puerto, garantizando la integridad de
                    productos perecederos.</p>
                  </div>
                  <div className="info-company-card">
                    <strong>RECO</strong>
                    <p>División de soluciones tecnológicas para comercio exterior, incluyendo HS Coder
                    (clasificación arancelaria con IA).</p>
                  </div>
                </div>

                <h3 className="info-subtitle">Presencia</h3>
                <p>
                  GRIVER opera desde <strong>Veracruz</strong>, <strong>Manzanillo</strong>, <strong>Colima</strong> y
                  <strong> Boca del Río</strong>, con un terreno de más de 20,000 m² en el Puerto de Veracruz.
                </p>
                <div className="info-highlight">
                  Casi un siglo de historia, innovación y compromiso con el comercio exterior de México.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            {/* Video siempre montado para que videoRef esté disponible */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="webcam-video"
              style={{ display: !useUpload && isCapturing ? 'block' : 'none' }}
            />

            {!useUpload && isCapturing && (
              <button
                className="capture-button"
                onClick={handleCapture}
                disabled={isProcessing}
                aria-label="Capturar foto"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                  <path d="M9 3H5a2 2 0 00-2 2v3m0 6v3a2 2 0 002 2h4m6 0h3a2 2 0 002-2v-3m0-6V5a2 2 0 00-2-2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                CAPTURAR FOTO
              </button>
            )}

            {!useUpload && capturedPhoto && (
              <div className="uploaded-image-container">
                <img src={capturedPhoto} alt="Foto capturada" className="uploaded-image" />
                <button
                  className="change-image-button"
                  onClick={retakePhoto}
                  disabled={isProcessing}
                >
                  Volver a tomar
                </button>
              </div>
            )}

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
            ) : !isCapturing && !capturedPhoto ? (
              <div className="webcam-placeholder">
                {hasWebcam === false ? (
                  <>
                    <p>No hay webcam disponible</p>
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
            ) : null}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          <button
            className="transform-button transform-button--left"
            onClick={handleTransform}
            disabled={isTransformDisabled}
          >
            {transformLabel}
          </button>
        </div>

        {/* Sección derecha: Selector de personas/escenarios */}
        <div className="scenarios-section">
          <h2>Selecciona una Persona</h2>
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
            className="transform-button transform-button--right"
            onClick={handleTransform}
            disabled={isTransformDisabled}
          >
            {transformLabel}
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

      {/* Modal único: carga con datos curiosos / resultado */}
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
                <img
                  src="/griver-logo.png"
                  alt="Griver"
                  className={`modal-loading-logo${isExtendedLoading ? ' modal-loading-logo--extended' : ''}`}
                />
                <div>
                  <h2 className="modal-loading-title">
                    {isExtendedLoading ? 'Afinando los últimos detalles...' : 'Estamos creando tu simulación'}
                  </h2>
                  <p className="modal-loading-subtitle">
                    {isExtendedLoading ? 'Gracias por tu paciencia: a veces tarda un poco más.' : 'Esto puede tardar hasta un minuto'}
                  </p>
                </div>
                <div className="modal-progress-wrapper">
                  <div className="modal-progress-track">
                    <div className="modal-progress-fill" style={{ width: `${fakeProgress}%` }} />
                  </div>
                  <span className="modal-progress-pct">{Math.round(fakeProgress)}%</span>
                </div>
                <div className="modal-status-row">
                  <span className="modal-status-dots"><span /><span /><span /></span>
                  <p className="modal-status-text">{statusMessage}</p>
                </div>
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

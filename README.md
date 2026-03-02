# 🛡️ Face Swap Logístico

Aplicación Next.js 14 con App Router para realizar face swap en escenarios logísticos usando la API de Replicate.

## 🚀 Características

- Captura de webcam en tiempo real
- 4 escenarios logísticos predefinidos (Bodega, Puerto, Aduana, Aeropuerto)
- Integración con Replicate API para face swap
- UI con diseño industrial/logístico
- Descarga de resultados

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Replicate con API Token

## 🛠️ Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Configura tu API Token de Replicate:
   - Edita `.env.local`
   - Agrega tu token: `REPLICATE_API_TOKEN=tu_token_aqui`
   - (Opcional) Cambia el modelo: `REPLICATE_MODEL=easel/advanced-face-swap`
   - Ver `MODELOS.md` para ver todos los modelos disponibles

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 📁 Estructura del Proyecto

```
├── src/
│   └── app/
│       ├── api/
│       │   └── faceswap/
│       │       └── route.ts      # API Route para Replicate
│       ├── page.tsx               # Página principal
│       └── globals.css            # Estilos globales
├── .env.local                     # Variables de entorno
├── package.json
└── README.md
```

## 🎯 Uso

1. Permite el acceso a tu webcam cuando el navegador lo solicite
2. Selecciona uno de los 4 escenarios logísticos
3. Haz clic en "CAPTURAR Y TRANSFORMAR"
4. Espera a que se procese la imagen (puede tardar unos segundos)
5. Descarga el resultado cuando esté listo

## 🔧 Tecnologías

- Next.js 14 (App Router)
- React 18
- TypeScript
- Replicate API
- MediaDevices API (Webcam)

## 📝 Notas

- Las imágenes de fondo son de Unsplash y se cargan desde URLs públicas
- El procesamiento puede tardar entre 10-30 segundos dependiendo del modelo y la carga de Replicate
- Asegúrate de tener buena iluminación para mejores resultados
- Puedes cambiar entre diferentes modelos de Replicate editando `REPLICATE_MODEL` en `.env.local`
- Ver `MODELOS.md` para información detallada sobre cada modelo y sus costos

## 🔄 Cambiar de Modelo

Si un modelo no funciona o quieres probar otro:

1. Edita `.env.local`:
   ```env
   REPLICATE_MODEL=easel/advanced-face-swap
   ```

2. Reinicia el servidor:
   ```bash
   npm run dev
   ```

3. Verifica el modelo actual visitando: `http://localhost:3000/api/faceswap`

Ver `MODELOS.md` para la lista completa de modelos disponibles y sus características.

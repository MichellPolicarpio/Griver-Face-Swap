// Configuración de modelos de Face Swap disponibles en Replicate
// Puedes cambiar el modelo usando la variable de entorno REPLICATE_MODEL

export interface ModelConfig {
  name: string;
  owner: string;
  model: string;
  version?: string; // Versión específica del modelo (opcional)
  inputParams: {
    swapImageKey: string; // Nombre del parámetro para la imagen a intercambiar
    targetImageKey: string; // Nombre del parámetro para la imagen objetivo
  };
  description: string;
  cost?: string; // Costo aproximado por ejecución
  speed?: string; // Velocidad aproximada
}

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  // Modelo por defecto - más económico y rápido
  'codeplugtech/face-swap': {
    name: 'codeplugtech/face-swap',
    owner: 'codeplugtech',
    model: 'face-swap',
    version: '278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
    inputParams: {
      swapImageKey: 'swap_image',
      targetImageKey: 'input_image',
    },
    description: 'Más rápido y económico. Ideal para intercambios simples de retratos.',
    cost: '$0.0028',
    speed: '~28 segundos',
  },

  // Modelo avanzado - mejor calidad
  'easel/advanced-face-swap': {
    name: 'easel/advanced-face-swap',
    owner: 'easel',
    model: 'advanced-face-swap',
    version: '96a4f90597cc439aa85bdbf9abcae15c4f6c4ec3d3b8d8aa59be6276d444d0fe',
    inputParams: {
      swapImageKey: 'swap_image',
      targetImageKey: 'input_image',
    },
    description: 'Optimizado para calidad profesional. Preserva iluminación y textura de piel.',
    cost: 'Variable',
    speed: 'Variable',
  },

  // Modelo estilizado
  'fofr/face-swap-with-ideogram': {
    name: 'fofr/face-swap-with-ideogram',
    owner: 'fofr',
    model: 'face-swap-with-ideogram',
    inputParams: {
      swapImageKey: 'swap_image',
      targetImageKey: 'input_image',
    },
    description: 'Mejor para resultados estilizados o con personajes.',
    cost: 'Variable',
    speed: 'Variable',
  },

  // Alternativa - Removido temporalmente ya que puede no estar disponible
  // Si quieres agregarlo, necesitarías obtener su versión específica desde Replicate
};

// Obtener el modelo configurado o usar el por defecto
export function getModelConfig(): ModelConfig {
  const modelName = process.env.REPLICATE_MODEL || 'codeplugtech/face-swap';
  const config = AVAILABLE_MODELS[modelName];
  
  if (!config) {
    console.warn(`Modelo ${modelName} no encontrado, usando modelo por defecto`);
    return AVAILABLE_MODELS['codeplugtech/face-swap'];
  }
  
  return config;
}

// Obtener la URL del endpoint del modelo
export function getModelEndpoint(config: ModelConfig): string {
  return `https://api.replicate.com/v1/models/${config.owner}/${config.model}/predictions`;
}

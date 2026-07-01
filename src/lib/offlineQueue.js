import { registrarEvaluacion } from './trackEvento';

const STORAGE_KEY = 'comif_offline_queue';

export function getOfflineQueue() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Error al leer cola offline:', err);
    return [];
  }
}

export function addToOfflineQueue(item) {
  try {
    const queue = getOfflineQueue();
    // Si ya existe un elemento con el mismo DPI en la cola offline, lo reemplazamos por el más reciente
    const existingIndex = queue.findIndex(q => q.payload?.aspiranteDpi === item.payload?.aspiranteDpi);
    if (existingIndex >= 0) {
      queue[existingIndex] = { ...item, timestamp: new Date().toISOString() };
    } else {
      queue.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...item
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return queue;
  } catch (err) {
    console.error('Error al guardar en cola offline:', err);
    return getOfflineQueue();
  }
}

export function removeFromOfflineQueue(id) {
  try {
    const queue = getOfflineQueue().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return queue;
  } catch (err) {
    console.error('Error al eliminar de cola offline:', err);
    return getOfflineQueue();
  }
}

export async function syncOfflineQueue(onProgress) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0, remaining: [] };

  let syncedCount = 0;
  let failedCount = 0;
  let currentQueue = [...queue];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (onProgress) {
      onProgress({ total: queue.length, current: i + 1, item });
    }
    try {
      // Intentar subir a Supabase
      let res = await registrarEvaluacion(item.payload);
      if (res && res.requiresConfirmation) {
        // Si hay conflicto de analista durante la sincronización automática en segundo plano,
        // lo guardamos como nuevo expediente ('insert') para asegurar que nunca se pierda el trabajo de campo.
        res = await registrarEvaluacion({ ...item.payload, accion: 'insert' });
      }
      
      if (res && res.success) {
        currentQueue = removeFromOfflineQueue(item.id);
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      console.error('Error al sincronizar ítem offline:', err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount, remaining: currentQueue };
}

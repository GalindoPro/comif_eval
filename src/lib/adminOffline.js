import { actualizarEstado } from './evaluaciones';

const CACHE_KEY = 'comif_admin_cache';
const QUEUE_KEY = 'comif_admin_queue';

export function getAdminCache() {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Error al leer caché de administrador:', err);
    return [];
  }
}

export function setAdminCache(data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.error('Error al guardar caché de administrador:', err);
  }
}

export function updateItemInAdminCache(id, nuevoEstado) {
  try {
    const cache = getAdminCache();
    const index = cache.findIndex(item => item.id === id);
    if (index >= 0) {
      cache[index] = {
        ...cache[index],
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      };
      setAdminCache(cache);
    }
    return cache;
  } catch (err) {
    console.error('Error al actualizar ítem en caché del admin:', err);
    return getAdminCache();
  }
}

export function getAdminQueue() {
  try {
    const saved = localStorage.getItem(QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Error al leer cola de administrador:', err);
    return [];
  }
}

export function addToAdminQueue(id, nuevoEstado) {
  try {
    const queue = getAdminQueue();
    const existingIndex = queue.findIndex(q => q.id === id);
    if (existingIndex >= 0) {
      queue[existingIndex] = { id, nuevoEstado, timestamp: new Date().toISOString() };
    } else {
      queue.push({ id, nuevoEstado, timestamp: new Date().toISOString() });
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queue;
  } catch (err) {
    console.error('Error al guardar en cola de administrador:', err);
    return getAdminQueue();
  }
}

export function removeFromAdminQueue(id) {
  try {
    const queue = getAdminQueue().filter(q => q.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queue;
  } catch (err) {
    console.error('Error al eliminar de cola de administrador:', err);
    return getAdminQueue();
  }
}

export async function syncAdminQueue(onProgress) {
  const queue = getAdminQueue();
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
      await actualizarEstado(item.id, item.nuevoEstado);
      currentQueue = removeFromAdminQueue(item.id);
      syncedCount++;
    } catch (err) {
      console.error('Error al sincronizar resolución offline:', err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount, remaining: currentQueue };
}

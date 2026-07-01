import { supabase } from './supabaseClient'

// Generar un ID de sesión único por cada vez que se abre la app
const sesionId = crypto.randomUUID()

export async function trackEvento(tipoEvento) {
  try {
    const { error } = await supabase
      .from('eventos')
      .insert([
        {
          tipo: tipoEvento,
          sesion_id: sesionId,
        }
      ])
    if (error) console.error('Error al registrar evento:', error.message)
  } catch (err) {
    console.error('trackEvento falló:', err)
  }
}

export async function verificarDpiExistente(dpi) {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('id, estado, analista_nombre, detalles')
      .eq('aspirante_dpi', dpi)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('verificarDpiExistente falló:', err);
    return null;
  }
}

export async function registrarEvaluacion({ aspiranteNombre, aspiranteDpi, analistaNombre, indiceIdoneidad, zona, detalles = {}, accion = 'auto', evalId = null }) {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { isOffline: true, error: 'Sin conexión a internet.' };
    }
    if (accion === 'auto') {
      // 1. Buscar si ya existe una evaluación con ese DPI
      const { data: existentes, error: selectError } = await supabase
        .from('evaluaciones')
        .select('id, estado, analista_nombre')
        .eq('aspirante_dpi', aspiranteDpi)
        .order('created_at', { ascending: false })
        .limit(1);

      if (selectError) throw selectError;

      if (existentes && existentes.length > 0) {
        const evalExistente = existentes[0];
        
        // 3. Verificamos el analista
        if (evalExistente.analista_nombre?.toUpperCase() !== analistaNombre?.toUpperCase()) {
           // Diferente analista -> Requiere confirmación
           return { requiresConfirmation: true, existente: evalExistente };
        } else {
           // Mismo analista -> Actualización automática
           accion = 'update';
           evalId = evalExistente.id;
        }
      } else {
        // No existe -> Inserción
        accion = 'insert';
      }
    }

    if (accion === 'update' && evalId) {
      const { error: updateError } = await supabase
        .from('evaluaciones')
        .update({
           aspirante_nombre: aspiranteNombre,
           analista_nombre: analistaNombre,
           indice_idoneidad: indiceIdoneidad,
           zona: zona,
           detalles: detalles,
           estado: 'pendiente'
        })
        .eq('id', evalId);
        
      if (updateError) throw updateError;
      return { success: true, action: 'updated', message: 'Actualizada exitosamente.' };
    } 
    
    if (accion === 'insert') {
      const { error: insertError } = await supabase
        .from('evaluaciones')
        .insert([{
          aspirante_nombre: aspiranteNombre,
          aspirante_dpi: aspiranteDpi,
          analista_nombre: analistaNombre,
          indice_idoneidad: indiceIdoneidad,
          zona: zona,
          sesion_id: sesionId,
          detalles: detalles
        }]);
        
      if (insertError) throw insertError;
      return { success: true, action: 'inserted', message: 'Guardada exitosamente.' };
    }
  } catch (err) {
    console.error('registrarEvaluacion falló:', err);
    const msg = err.message || '';
    const isNetwork = (typeof navigator !== 'undefined' && !navigator.onLine) || 
                      msg.toLowerCase().includes('fetch') || 
                      msg.toLowerCase().includes('network') || 
                      msg.toLowerCase().includes('connection') || 
                      msg.toLowerCase().includes('load failed');
    return { 
      error: msg || 'Error de conexión al guardar.',
      isOffline: isNetwork
    };
  }
}

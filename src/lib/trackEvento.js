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

export async function registrarEvaluacion({ aspiranteNombre, aspiranteDpi, analistaNombre, indiceIdoneidad, zona, detalles = {} }) {
  try {
    // 1. Buscar si ya existe una evaluación con ese DPI
    const { data: existentes, error: selectError } = await supabase
      .from('evaluaciones')
      .select('id, estado')
      .eq('aspirante_dpi', aspiranteDpi)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) throw selectError;

    if (existentes && existentes.length > 0) {
      const evalExistente = existentes[0];
      
      // 2. Si ya fue procesada, bloquear
      if (evalExistente.estado !== 'pendiente') {
         return { error: 'El administrador ya evaluó esta solicitud (Aceptada/Rechazada). No se puede modificar.' };
      }
      
      // 3. Si sigue en espera, actualizarla
      const { error: updateError } = await supabase
        .from('evaluaciones')
        .update({
           aspirante_nombre: aspiranteNombre,
           analista_nombre: analistaNombre,
           indice_idoneidad: indiceIdoneidad,
           zona: zona,
           detalles: detalles
        })
        .eq('id', evalExistente.id);
        
      if (updateError) throw updateError;
      return { success: true, action: 'updated' };
    } else {
      // 4. Si no existe, insertar nueva
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
      return { success: true, action: 'inserted' };
    }
  } catch (err) {
    console.error('registrarEvaluacion falló:', err);
    return { error: err.message || 'Error de conexión al guardar.' };
  }
}

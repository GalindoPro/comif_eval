import { supabase } from './supabaseClient'

export async function obtenerEvaluaciones() {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function actualizarEstado(id, nuevoEstado) {
  const { data, error } = await supabase
    .from('evaluaciones')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
  if (error) throw error
  return data
}

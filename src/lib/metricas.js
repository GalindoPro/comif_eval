import { supabase } from './supabaseClient'

export async function obtenerMetricasPorHora() {
  const { data, error } = await supabase.rpc('metricas_por_hora')
  if (error) throw error
  return data
}

export async function obtenerMetricasPorDia() {
  const { data, error } = await supabase.rpc('metricas_por_dia')
  if (error) throw error
  return data
}

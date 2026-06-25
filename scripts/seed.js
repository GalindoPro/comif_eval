import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://mlgztmunavqiigiqytmi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6OwGnGbt2fkp4JDZTe6gTg_kzLV-q8m';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const data = [];
const analistas = ['María', 'Diego', 'Walter', 'Jose'];

// 10 rechazados
for (let i = 0; i < 10; i++) {
  data.push({
    aspirante_nombre: `Aspirante Rechazado ${i + 1}`,
    aspirante_dpi: `10000000000${10+i}`,
    analista_nombre: analistas[Math.floor(Math.random() * analistas.length)],
    estado: 'rechazada',
    indice_idoneidad: (Math.random() * 1.5).toFixed(2), // 0 to 1.5
    zona: 'ZONA DE ALTO RIESGO',
    sesion_id: crypto.randomUUID()
  });
}

// 20 en espera (pendiente)
for (let i = 0; i < 20; i++) {
  data.push({
    aspirante_nombre: `Aspirante En Espera ${i + 1}`,
    aspirante_dpi: `20000000000${10+i}`,
    analista_nombre: analistas[Math.floor(Math.random() * analistas.length)],
    estado: 'pendiente',
    indice_idoneidad: (Math.random() * 2 + 3).toFixed(2), // 3 to 5
    zona: 'ZONA DE REVISIÓN CUIDADOSA',
    sesion_id: crypto.randomUUID()
  });
}

// 20 aceptados
for (let i = 0; i < 20; i++) {
  data.push({
    aspirante_nombre: `Aspirante Aceptado ${i + 1}`,
    aspirante_dpi: `30000000000${10+i}`,
    analista_nombre: analistas[Math.floor(Math.random() * analistas.length)],
    estado: 'aceptada',
    indice_idoneidad: (Math.random() * 3 + 7).toFixed(2), // 7 to 10
    zona: 'ZONA DE OPORTUNIDAD IDEAL',
    sesion_id: crypto.randomUUID()
  });
}

async function seed() {
  console.log('🚀 Iniciando inyección de 50 registros de prueba...');
  
  // Como bono, inyectamos 60 eventos de "inicio_evaluacion" para que la Tasa de Conversión no pase del 100%
  const eventos = Array.from({ length: 60 }).map(() => ({ tipo: 'inicio_evaluacion', sesion_id: crypto.randomUUID() }));
  await supabase.from('eventos').insert(eventos);

  const { error } = await supabase.from('evaluaciones').insert(data);
  if (error) {
    console.error('❌ Error al insertar:', error);
  } else {
    console.log('✅ ¡50 registros insertados correctamente en Supabase!');
    console.log('   - 10 Rechazados');
    console.log('   - 20 En Espera (Pendientes)');
    console.log('   - 20 Aceptados');
    console.log('Ve a tu aplicación y recarga la página para ver la magia.');
  }
}

seed();

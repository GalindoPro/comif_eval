import { useState, useEffect } from 'react';
import { obtenerMetricasPorHora, obtenerMetricasPorDia } from '../lib/metricas';
import { obtenerEvaluaciones, actualizarEstado } from '../lib/evaluaciones';
import { ShieldCheck, RefreshCcw, ChevronRight, CheckCircle, Clock, XCircle, FileText, BarChart3, Search, PlayCircle } from 'lucide-react';
import ActaImprimible from './ActaImprimible';

const ETIQUETAS_EVENTO = {
  'inicio_evaluacion': 'Evaluaciones iniciadas',
  'evaluacion_completada': 'Evaluaciones completadas',
};

const PanelMetricas = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [claveIngresada, setClaveIngresada] = useState('');
  
  // Vistas: 'evaluaciones' | 'metricas'
  const [vistaPrincipal, setVistaPrincipal] = useState('evaluaciones');
  // Sub-vistas de métricas: 'hora' | 'dia'
  const [vistaMetricas, setVistaMetricas] = useState('hora');
  // Filtro de estado: 'total' | 'pendiente' | 'aceptada' | 'rechazada'
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [metricas, setMetricas] = useState([]);
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [claveError, setClaveError] = useState(false);
  const [actaSeleccionada, setActaSeleccionada] = useState(null);

  const verificarClave = () => {
    if (claveIngresada === import.meta.env.VITE_ADMIN_KEY) {
      setAutenticado(true);
      setClaveError(false);
    } else {
      setClaveError(true);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      if (vistaPrincipal === 'evaluaciones') {
        const data = await obtenerEvaluaciones();
        setEvaluaciones(data || []);
      } else {
        const resultado = vistaMetricas === 'hora'
          ? await obtenerMetricasPorHora()
          : await obtenerMetricasPorDia();
        setMetricas(resultado || []);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, vistaPrincipal, vistaMetricas]);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      setCargando(true);
      await actualizarEstado(id, nuevoEstado);
      await cargarDatos(); // Recargar para ver los cambios
    } catch (err) {
      setError('Error al actualizar estado: ' + err.message);
      setCargando(false);
    }
  };

  // ── Pantalla de login ──
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#0B1C2D] text-white p-4 flex justify-between items-center border-b-4 border-[#FFD400]">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter">
                COMIF <span className="text-[#FFD400]">Admin</span>
              </h1>
              <p className="text-[#FFD400] font-mono text-[9px] tracking-[0.1em] uppercase">
                Panel Administrativo
              </p>
            </div>
            <ShieldCheck className="text-[#FFD400]" size={18} />
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Acceso restringido
              </p>
              <p className="text-xs text-slate-500">
                Ingrese la clave de administrador para continuar.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                Contraseña
              </label>
              <input
                type="password"
                value={claveIngresada}
                onChange={e => { setClaveIngresada(e.target.value); setClaveError(false); }}
                onKeyDown={e => e.key === 'Enter' && verificarClave()}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-[#0B1C2D] focus:ring-2 focus:ring-[#FFD400]"
                placeholder="••••••••"
              />
              {claveError && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-tight ml-2 animate-pulse">
                  Clave incorrecta
                </p>
              )}
            </div>
            <button
              onClick={verificarClave}
              className="w-full py-4 bg-[#FFD400] hover:bg-[#ffe040] text-[#0B1C2D] rounded-2xl font-black uppercase text-sm flex justify-center items-center gap-3 active:scale-95 transition-all shadow-lg shadow-[#FFD400]/25"
            >
              Entrar <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Helpers para UI ---
  const conteos = {
    total: evaluaciones.length,
    pendientes: evaluaciones.filter(e => e.estado === 'pendiente').length,
    aceptadas: evaluaciones.filter(e => e.estado === 'aceptada').length,
    rechazadas: evaluaciones.filter(e => e.estado === 'rechazada').length,
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'aceptada': return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1 rounded-full"><CheckCircle size={10}/> Aceptada</span>;
      case 'rechazada': return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-100 px-2 py-1 rounded-full"><XCircle size={10}/> Rechazada</span>;
      default: return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full"><Clock size={10}/> Pendiente</span>;
    }
  };

  const getZonaColor = (zona) => {
    if(zona.includes('EXCELENCIA')) return 'text-green-700 bg-green-50 border-green-200';
    if(zona.includes('RECHAZO')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  // ── Panel Administrativo ──
  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans text-slate-900 flex flex-col">
      <div className="max-w-6xl mx-auto w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-[#0B1C2D] text-white p-4 flex justify-between items-center border-b-4 border-[#FFD400] shrink-0">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">
              COMIF <span className="text-[#FFD400]">Admin</span>
            </h1>
            <p className="text-[#FFD400] font-mono text-[9px] tracking-[0.1em] uppercase">
              Panel Administrativo de Resoluciones
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setVistaPrincipal('evaluaciones')} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${vistaPrincipal === 'evaluaciones' ? 'bg-[#FFD400] text-[#0B1C2D]' : 'hover:bg-white/10 text-slate-300'}`}>
              <FileText size={14}/> Solicitudes
            </button>
            <button onClick={() => setVistaPrincipal('metricas')} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${vistaPrincipal === 'metricas' ? 'bg-[#FFD400] text-[#0B1C2D]' : 'hover:bg-white/10 text-slate-300'}`}>
              <BarChart3 size={14}/> Tráfico
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black uppercase tracking-tight text-[#0B1C2D]">
              {vistaPrincipal === 'evaluaciones' ? 'Gestión de Evaluaciones' : 'Dashboard de Eventos de Uso'}
            </h2>
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCcw size={14} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {error && !cargando && (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          {/* VISTA: EVALUACIONES */}
          {vistaPrincipal === 'evaluaciones' && (
            <div className="space-y-6">
              {/* Contadores / Filtros */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setFiltroEstado('total')}
                  className={`border rounded-2xl p-4 text-center transition-all ${filtroEstado === 'total' ? 'bg-[#0B1C2D] border-[#0B1C2D] shadow-lg text-white scale-105' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                >
                  <p className={`text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'total' ? 'text-slate-300' : 'text-slate-400'}`}>Total Solicitudes</p>
                  <p className={`text-3xl font-black ${filtroEstado === 'total' ? 'text-white' : 'text-[#0B1C2D]'}`}>{conteos.total}</p>
                </button>
                <button 
                  onClick={() => setFiltroEstado('pendiente')}
                  className={`border rounded-2xl p-4 text-center transition-all ${filtroEstado === 'pendiente' ? 'bg-yellow-400 border-yellow-500 shadow-lg text-[#0B1C2D] scale-105' : 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100'}`}
                >
                  <p className={`text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'pendiente' ? 'text-yellow-900' : 'text-yellow-600'}`}>En Espera</p>
                  <p className={`text-3xl font-black ${filtroEstado === 'pendiente' ? 'text-[#0B1C2D]' : 'text-yellow-700'}`}>{conteos.pendientes}</p>
                </button>
                <button 
                  onClick={() => setFiltroEstado('aceptada')}
                  className={`border rounded-2xl p-4 text-center transition-all ${filtroEstado === 'aceptada' ? 'bg-green-500 border-green-600 shadow-lg text-white scale-105' : 'bg-green-50 border-green-100 hover:bg-green-100'}`}
                >
                  <p className={`text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'aceptada' ? 'text-green-100' : 'text-green-600'}`}>Aceptadas</p>
                  <p className={`text-3xl font-black ${filtroEstado === 'aceptada' ? 'text-white' : 'text-green-700'}`}>{conteos.aceptadas}</p>
                </button>
                <button 
                  onClick={() => setFiltroEstado('rechazada')}
                  className={`border rounded-2xl p-4 text-center transition-all ${filtroEstado === 'rechazada' ? 'bg-red-500 border-red-600 shadow-lg text-white scale-105' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}
                >
                  <p className={`text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'rechazada' ? 'text-red-100' : 'text-red-600'}`}>Rechazadas</p>
                  <p className={`text-3xl font-black ${filtroEstado === 'rechazada' ? 'text-white' : 'text-red-700'}`}>{conteos.rechazadas}</p>
                </button>
              </div>

              {/* Lógica de filtrado */}
              {(() => {
                let evaluacionesFiltradas = evaluaciones;
                if (filtroEstado !== 'total') {
                  evaluacionesFiltradas = evaluacionesFiltradas.filter(e => e.estado === filtroEstado);
                }
                
                // Si estamos en la pestaña "pendiente", mostramos solo las primeras 5
                if (filtroEstado === 'pendiente') {
                  evaluacionesFiltradas = evaluacionesFiltradas.slice(0, 5);
                }

                return (
                  <>
                    {/* Lista de tarjetas */}
                    {cargando && evaluacionesFiltradas.length === 0 ? (
                      <div className="text-center py-12"><p className="text-xs font-black uppercase text-slate-400">Cargando...</p></div>
                    ) : evaluacionesFiltradas.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <p className="text-xs font-black uppercase text-slate-400">
                          {filtroEstado === 'total' ? 'No hay evaluaciones registradas' : `No hay evaluaciones en estado: ${filtroEstado}`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filtroEstado === 'pendiente' && conteos.pendientes > 5 && (
                          <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold px-4 py-2 rounded-lg text-center uppercase tracking-wide">
                            Mostrando las 5 solicitudes más recientes (de {conteos.pendientes} en espera)
                          </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {evaluacionesFiltradas.map(ev => (
                            <div key={ev.id} className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-sm uppercase">{ev.aspirante_nombre}</h3>
                            {getEstadoBadge(ev.estado)}
                          </div>
                          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">DPI: {ev.aspirante_dpi || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">IS Obtenido</p>
                          <p className="text-xl font-black text-[#0B1C2D] leading-none">{Number(ev.indice_idoneidad).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Zona de Resolución</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${getZonaColor(ev.zona)}`}>
                            {ev.zona}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Auditor / Analista</p>
                          <p className="text-[11px] font-bold text-slate-700 uppercase">{ev.analista_nombre}</p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Fecha de Ingreso</p>
                           <p className="text-[10px] font-mono text-slate-500">{new Date(ev.created_at).toLocaleString('es-ES')}</p>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 mt-auto">
                        <button 
                          disabled={cargando || ev.estado === 'aceptada'}
                          onClick={() => handleCambiarEstado(ev.id, 'aceptada')}
                          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${ev.estado === 'aceptada' ? 'bg-green-100 text-green-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-green-500 hover:text-white text-slate-600'}`}
                        >
                          <CheckCircle size={12}/> Aceptar
                        </button>
                        <button 
                          disabled={cargando || ev.estado === 'pendiente'}
                          onClick={() => handleCambiarEstado(ev.id, 'pendiente')}
                          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${ev.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-yellow-500 hover:text-white text-slate-600'}`}
                        >
                          <Clock size={12}/> En Espera
                        </button>
                        <button 
                          disabled={cargando || ev.estado === 'rechazada'}
                          onClick={() => handleCambiarEstado(ev.id, 'rechazada')}
                          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${ev.estado === 'rechazada' ? 'bg-red-100 text-red-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600'}`}
                        >
                          <XCircle size={12}/> Rechazar
                        </button>
                        <button
                          disabled={!ev.detalles || Object.keys(ev.detalles).length === 0}
                          onClick={() => setActaSeleccionada(ev)}
                          className="col-span-3 py-2 mt-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 bg-[#0B1C2D] text-white hover:bg-[#1a2e3f] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          <FileText size={12}/> {ev.detalles && Object.keys(ev.detalles).length > 0 ? 'Ver Acta Completa' : 'Acta no disponible'}
                        </button>
                      </div>
                    </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* VISTA: METRICAS (TRÁFICO) */}
          {vistaPrincipal === 'metricas' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-full">
                  <button
                    onClick={() => setVistaMetricas('hora')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                      vistaMetricas === 'hora'
                        ? 'bg-[#0B1C2D] text-white shadow-md'
                        : 'text-slate-500 hover:text-[#0B1C2D]'
                    }`}
                  >
                    Por hora
                  </button>
                  <button
                    onClick={() => setVistaMetricas('dia')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                      vistaMetricas === 'dia'
                        ? 'bg-[#0B1C2D] text-white shadow-md'
                        : 'text-slate-500 hover:text-[#0B1C2D]'
                    }`}
                  >
                    Por día
                  </button>
                </div>
              </div>

              {/* Lógica y Resumen de Tráfico */}
              {(() => {
                const iniciadas = metricas.filter(m => m.tipo === 'inicio_evaluacion').reduce((acc, curr) => acc + Number(curr.total), 0);
                const completadas = metricas.filter(m => m.tipo === 'evaluacion_completada').reduce((acc, curr) => acc + Number(curr.total), 0);
                const tasaConversion = iniciadas > 0 ? Math.round((completadas / iniciadas) * 100) : 0;
                const maxTotal = metricas.length > 0 ? Math.max(...metricas.map(m => Number(m.total))) : 1;

                return (
                  <div className="space-y-6">
                    {/* Tarjetas de Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Evaluaciones Iniciadas</p>
                          <p className="text-3xl font-black text-blue-900">{iniciadas}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                          <PlayCircle size={24} />
                        </div>
                      </div>
                      <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-1">Evaluaciones Completadas</p>
                          <p className="text-3xl font-black text-green-900">{completadas}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                          <CheckCircle size={24} />
                        </div>
                      </div>
                      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Tasa de Conversión</p>
                          <p className="text-3xl font-black text-[#0B1C2D]">{tasaConversion}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                          <BarChart3 size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Lista Moderna de Tráfico */}
                    {!cargando && !error && (
                      <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-[#0B1C2D] text-white px-6 py-4 flex justify-between items-center">
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Desglose Cronológico</h3>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">({metricas.length} registros)</span>
                        </div>
                        
                        <div className="divide-y divide-slate-100">
                          {metricas.length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin datos disponibles en este periodo</p>
                            </div>
                          ) : (
                            metricas.map((fila, idx) => {
                              const fechaStr = fila.hora || fila.dia;
                              let fechaFormateada = fechaStr;
                              try {
                                const fechaObj = new Date(fechaStr);
                                fechaFormateada = new Intl.DateTimeFormat('es-ES', { 
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  ...(fila.hora ? { hour: '2-digit', minute: '2-digit' } : {})
                                }).format(fechaObj);
                              } catch(e) {}
                              
                              const porcentaje = Math.round((Number(fila.total) / maxTotal) * 100);
                              const esCompletada = fila.tipo === 'evaluacion_completada';

                              return (
                                <div key={idx} className="p-4 md:px-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                                  {/* Fecha y Tipo */}
                                  <div className="flex-shrink-0 w-48">
                                    <p className="text-xs font-mono font-bold text-slate-700 mb-1">{fechaFormateada}</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wide border ${
                                      esCompletada
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {esCompletada ? <CheckCircle size={10} /> : <PlayCircle size={10} />}
                                      {ETIQUETAS_EVENTO[fila.tipo] || fila.tipo}
                                    </span>
                                  </div>

                                  {/* Barra Visual */}
                                  <div className="flex-1 flex items-center gap-4">
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${esCompletada ? 'bg-green-400' : 'bg-blue-400'}`}
                                        style={{ width: `${porcentaje}%` }}
                                      ></div>
                                    </div>
                                    <div className="w-12 text-right">
                                      <span className="text-xl font-black tabular-nums text-[#0B1C2D]">{fila.total}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </main>

        <footer className="bg-slate-50 p-3 border-t border-slate-100 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] shrink-0">
          PANEL ADMINISTRATIVO COMIF • SISTEMA DE RESOLUCIONES
        </footer>
      </div>

      {/* MODAL PARA VER ACTA */}
      {actaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl my-8">
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white border-b border-slate-200 rounded-t-xl shadow-sm">
              <div>
                <h3 className="font-black uppercase text-sm text-[#0B1C2D]">Acta de Resolución</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{actaSeleccionada.aspirante_nombre}</p>
              </div>
              <button 
                onClick={() => setActaSeleccionada(null)}
                className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-4 md:p-8 overflow-x-auto overflow-y-visible" style={{ minHeight: '80vh' }}>
              <div className="scale-[0.85] sm:scale-100 transform origin-top mx-auto" style={{ width: 'fit-content' }}>
                <ActaImprimible 
                  aspirant={actaSeleccionada.detalles?.aspirant || {}}
                  finalIS={actaSeleccionada.detalles?.finalIS || 0}
                  autoReport={actaSeleccionada.detalles?.autoReport || ''}
                  refs={actaSeleccionada.detalles?.refs || {}}
                  noConsta={actaSeleccionada.detalles?.noConsta || {}}
                  auditorAppreciation={actaSeleccionada.detalles?.auditorAppreciation || ''}
                  zone={actaSeleccionada.detalles?.zone || {}}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelMetricas;

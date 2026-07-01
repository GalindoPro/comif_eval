import { useState, useEffect } from 'react';
import { obtenerMetricasPorHora, obtenerMetricasPorDia } from '../lib/metricas';
import { obtenerEvaluaciones, actualizarEstado } from '../lib/evaluaciones';
import { getAdminCache, setAdminCache, updateItemInAdminCache, getAdminQueue, addToAdminQueue, syncAdminQueue } from '../lib/adminOffline';
import { ShieldCheck, RefreshCcw, ChevronRight, CheckCircle, Clock, XCircle, FileText, BarChart3, Search, PlayCircle, Printer } from 'lucide-react';
import ActaImprimible from './ActaImprimible';
import { supabase } from '../lib/supabaseClient';

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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [adminQueue, setAdminQueue] = useState(() => getAdminQueue());
  const [modoOfflineCache, setModoOfflineCache] = useState(() => getAdminCache().length > 0 && typeof navigator !== 'undefined' && !navigator.onLine);
  const [syncingAdmin, setSyncingAdmin] = useState(false);
  const [adminSyncMessage, setAdminSyncMessage] = useState('');
  
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
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('offline');
      }
      if (vistaPrincipal === 'evaluaciones') {
        const data = await obtenerEvaluaciones();
        setEvaluaciones(data || []);
        setAdminCache(data || []);
        setModoOfflineCache(false);
      } else {
        const resultado = vistaMetricas === 'hora'
          ? await obtenerMetricasPorHora()
          : await obtenerMetricasPorDia();
        setMetricas(resultado || []);
      }
    } catch (err) {
      const isNetwork = (typeof navigator !== 'undefined' && !navigator.onLine) || err.message === 'offline' || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('connection') || err.message?.toLowerCase().includes('load failed');
      if (vistaPrincipal === 'evaluaciones' && (isNetwork || getAdminCache().length > 0)) {
        const cache = getAdminCache();
        if (cache.length > 0) {
          setEvaluaciones(cache);
          setModoOfflineCache(true);
          setError(null);
        } else {
          setError('Sin conexión a internet y no hay datos en caché local.');
        }
      } else {
        setError(err.message || 'Error al cargar los datos.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarDatos();

      // Suscripción en tiempo real a Supabase
      const canal = supabase.channel('realtime-evaluaciones')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluaciones' }, () => {
          cargarDatos();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(canal);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, vistaPrincipal, vistaMetricas]);

  useEffect(() => {
    const handleOnline = () => {
      if (getAdminQueue().length > 0 && !syncingAdmin) {
        handleSyncAdmin();
      } else if (modoOfflineCache) {
        cargarDatos();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncingAdmin, modoOfflineCache]);

  const handleSyncAdmin = async () => {
    if (syncingAdmin || getAdminQueue().length === 0) return;
    setSyncingAdmin(true);
    setAdminSyncMessage('Sincronizando resoluciones pendientes...');
    const result = await syncAdminQueue();
    setAdminQueue(result.remaining);
    setSyncingAdmin(false);
    if (result.syncedCount > 0) {
      setAdminSyncMessage(`✅ ¡Se subieron ${result.syncedCount} resoluciones a Supabase!`);
      await cargarDatos();
      setTimeout(() => setAdminSyncMessage(''), 6000);
    } else if (result.failedCount > 0) {
      setAdminSyncMessage(`⚠️ No se pudieron sincronizar ${result.failedCount} resoluciones.`);
      setTimeout(() => setAdminSyncMessage(''), 6000);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('offline');
      }
      Promise.resolve().then(() => setCargando(true));
      await actualizarEstado(id, nuevoEstado);
      await cargarDatos(); // Recargar para ver los cambios
    } catch (err) {
      const isNetwork = (typeof navigator !== 'undefined' && !navigator.onLine) || err.message === 'offline' || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('connection') || err.message?.toLowerCase().includes('load failed');
      if (isNetwork) {
        const updatedQueue = addToAdminQueue(id, nuevoEstado);
        const updatedCache = updateItemInAdminCache(id, nuevoEstado);
        setEvaluaciones(updatedCache);
        setAdminQueue(updatedQueue);
        setModoOfflineCache(true);
        setCargando(false);
      } else {
        setError('Error al actualizar estado: ' + err.message);
        setCargando(false);
      }
    }
  };

  // ── Pantalla de login ──
  if (!autenticado) {
    return (
      <div className="h-[100dvh] w-full bg-slate-100 flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="max-w-sm w-full bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-[#0B1C2D] text-white p-4 flex justify-between items-center border-b-4 border-[#FFD400] shrink-0">
            <button 
              onClick={() => window.location.href = '?admin=false'}
              className="text-left hover:opacity-80 transition-opacity cursor-pointer flex flex-col focus:outline-none"
              title="Volver al Evaluador"
            >
              <h1 className="text-xl font-black uppercase tracking-tighter">
                COMIF <span className="text-[#FFD400]">Admin</span>
              </h1>
              <p className="text-[#FFD400] font-mono text-[9px] tracking-[0.1em] uppercase">
                Panel Administrativo
              </p>
            </button>
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
    <div className="h-[100dvh] w-full max-w-[100vw] bg-slate-100 p-2 md:p-6 font-sans text-slate-900 flex flex-col overflow-hidden box-border">
      <div className="max-w-6xl mx-auto w-full h-full bg-white rounded-xl md:rounded-[2rem] shadow-xl border border-slate-200 flex flex-col overflow-hidden box-border">
        {/* Header */}
        <header className="bg-[#0B1C2D] text-white p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 border-b-4 border-[#FFD400] shrink-0 box-border">
          <button 
            onClick={() => window.location.href = '?admin=false'}
            className="text-left hover:opacity-80 transition-opacity cursor-pointer flex flex-col focus:outline-none max-w-full overflow-hidden"
            title="Volver al Evaluador"
          >
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none truncate max-w-full">
              COMIF <span className="text-[#FFD400]">Admin</span>
            </h1>
            <p className="text-[#FFD400] font-mono text-[9px] sm:text-[10px] tracking-normal sm:tracking-[0.1em] uppercase mt-1 truncate max-w-full">
              Panel Administrativo de Resoluciones
            </p>
          </button>
          <div className="flex gap-2 sm:gap-4 items-center w-full sm:w-auto mt-2 sm:mt-0">
            <button onClick={() => setVistaPrincipal('evaluaciones')} className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-2 sm:py-1.5 rounded-lg transition-colors ${vistaPrincipal === 'evaluaciones' ? 'bg-[#FFD400] text-[#0B1C2D]' : 'hover:bg-white/10 text-slate-300 bg-white/5 sm:bg-transparent'}`}>
              <FileText size={14}/> Solicitudes
            </button>
            <button onClick={() => setVistaPrincipal('metricas')} className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-2 sm:py-1.5 rounded-lg transition-colors ${vistaPrincipal === 'metricas' ? 'bg-[#FFD400] text-[#0B1C2D]' : 'hover:bg-white/10 text-slate-300 bg-white/5 sm:bg-transparent'}`}>
              <BarChart3 size={14}/> Tráfico
            </button>
          </div>
        </header>

        {/* Banner de Modo Caché / Cola Offline Admin */}
        {(modoOfflineCache || adminQueue.length > 0 || adminSyncMessage) && (
          <div className="bg-amber-400 text-[#0B1C2D] px-4 py-2.5 flex flex-col sm:flex-row justify-between items-center gap-2 font-bold text-xs shadow-inner animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="text-base">☁️</span>
              <div>
                {adminSyncMessage ? (
                  <span>{adminSyncMessage}</span>
                ) : (
                  <span>
                    <strong>{modoOfflineCache ? 'Modo Caché Offline:' : 'Bandeja de Resoluciones:'}</strong> {modoOfflineCache ? 'Mostrando historial local guardado en tu equipo.' : ''} {adminQueue.length > 0 ? `Tienes ${adminQueue.length} ${adminQueue.length === 1 ? 'resolución pendiente' : 'resoluciones pendientes'} de subir.` : ''}
                  </span>
                )}
              </div>
            </div>
            {adminQueue.length > 0 && !syncingAdmin && (
              <button
                onClick={handleSyncAdmin}
                className="bg-[#0B1C2D] text-[#FFD400] hover:bg-slate-800 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all shadow active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCcw size={12} className={syncingAdmin ? 'animate-spin' : ''} /> Sincronizar Ahora
              </button>
            )}
          </div>
        )}

        <main className="p-3 sm:p-4 md:p-6 flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 sm:pb-4 gap-2 sm:gap-0">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0B1C2D]">
              {vistaPrincipal === 'evaluaciones' ? 'Gestión de Evaluaciones' : 'Dashboard de Eventos de Uso'}
            </h2>
            {cargando && (
              <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400 bg-slate-50 px-2 py-1.5 rounded-md">
                <RefreshCcw size={12} className="animate-spin" /> Sincronizando...
              </span>
            )}
          </div>

          {error && !cargando && (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          {/* VISTA: EVALUACIONES */}
          {vistaPrincipal === 'evaluaciones' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Contadores / Filtros */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <button 
                  onClick={() => setFiltroEstado('total')}
                  className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transition-all ${filtroEstado === 'total' ? 'bg-[#0B1C2D] border-[#0B1C2D] shadow-md text-white scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                >
                  <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'total' ? 'text-slate-300' : 'text-slate-400'}`}>Total Solicitudes</p>
                  <p className={`text-2xl sm:text-3xl font-black ${filtroEstado === 'total' ? 'text-white' : 'text-[#0B1C2D]'}`}>{conteos.total}</p>
                </button>
                <button 
                  onClick={() => setFiltroEstado('pendiente')}
                  className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transition-all ${filtroEstado === 'pendiente' ? 'bg-yellow-400 border-yellow-500 shadow-md text-[#0B1C2D] scale-[1.02]' : 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100'}`}
                >
                  <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'pendiente' ? 'text-yellow-900' : 'text-yellow-600'}`}>En Espera</p>
                  <p className={`text-2xl sm:text-3xl font-black ${filtroEstado === 'pendiente' ? 'text-[#0B1C2D]' : 'text-yellow-700'}`}>{conteos.pendientes}</p>
                </button>
                <button 
                  onClick={() => setFiltroEstado('aceptada')}
                  className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transition-all ${filtroEstado === 'aceptada' ? 'bg-green-500 border-green-600 shadow-md text-white scale-[1.02]' : 'bg-green-50 border-green-100 hover:bg-green-100'}`}
                >
                  <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'aceptada' ? 'text-green-100' : 'text-green-600'}`}>Aceptadas</p>
                  <p className={`text-2xl sm:text-3xl font-black ${filtroEstado === 'aceptada' ? 'text-white' : 'text-green-700'}`}>{conteos.aceptadas}</p>
                </button>
                <button 
                  onClick={() => setFiltroEstado('rechazada')}
                  className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transition-all ${filtroEstado === 'rechazada' ? 'bg-red-500 border-red-600 shadow-md text-white scale-[1.02]' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}
                >
                  <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${filtroEstado === 'rechazada' ? 'text-red-100' : 'text-red-600'}`}>Rechazadas</p>
                  <p className={`text-2xl sm:text-3xl font-black ${filtroEstado === 'rechazada' ? 'text-white' : 'text-red-700'}`}>{conteos.rechazadas}</p>
                </button>
              </div>

              {/* Buscador */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="BUSCAR EXPEDIENTE POR NOMBRE O NÚMERO DE DPI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 sm:py-4 border-2 border-slate-200 rounded-2xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0B1C2D] focus:ring-4 focus:ring-[#FFD400]/20 text-[10px] sm:text-xs transition-all font-black uppercase tracking-widest text-[#0B1C2D] shadow-sm"
                />
              </div>

              {/* Lógica de filtrado */}
              {(() => {
                let evaluacionesFiltradas = evaluaciones;
                
                // 1. Filtrar por Búsqueda (Nombre o DPI)
                if (searchQuery.trim() !== '') {
                  const query = searchQuery.toLowerCase().trim();
                  evaluacionesFiltradas = evaluacionesFiltradas.filter(e => 
                    (e.aspirante_nombre && e.aspirante_nombre.toLowerCase().includes(query)) ||
                    (e.aspirante_dpi && e.aspirante_dpi.includes(query))
                  );
                }

                // 2. Filtrar por Estado
                if (filtroEstado !== 'total') {
                  evaluacionesFiltradas = evaluacionesFiltradas.filter(e => e.estado === filtroEstado);
                }
                
                // Si estamos en la pestaña "pendiente", mostramos solo las primeras 5 (a menos que estén buscando alguien en específico)
                if (filtroEstado === 'pendiente' && searchQuery.trim() === '') {
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
                        {filtroEstado === 'pendiente' && conteos.pendientes > 5 && searchQuery.trim() === '' && (
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
                              } catch {
                                // Ignorar error si la fecha es inválida
                              }
                              
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl h-full max-h-[95vh] bg-slate-100 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="shrink-0 flex justify-between items-center p-4 bg-white border-b border-slate-200 z-10 print:hidden">
              <div>
                <h3 className="font-black uppercase text-sm text-[#0B1C2D]">Acta de Resolución</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{actaSeleccionada.aspirante_nombre}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold uppercase transition-colors">
                  <Printer size={14} /> Imprimir
                </button>
                <button 
                  onClick={() => setActaSeleccionada(null)}
                  className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex justify-center">
              <div className="w-full max-w-[210mm]">
                <ActaImprimible 
                  aspirant={actaSeleccionada.detalles?.aspirant || {}}
                  finalIS={actaSeleccionada.detalles?.finalIS || 0}
                  autoReport={actaSeleccionada.detalles?.autoReport || ''}
                  refs={actaSeleccionada.detalles?.refs || {}}
                  noConsta={actaSeleccionada.detalles?.noConsta || {}}
                  auditorAppreciation={actaSeleccionada.detalles?.auditorAppreciation || ''}
                  zone={actaSeleccionada.detalles?.zone || {}}
                  adminStatus={actaSeleccionada.estado}
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

import { useState, useMemo, useEffect } from 'react';
import PanelMetricas from './components/PanelMetricas';
import ActaImprimible from './components/ActaImprimible';
import { trackEvento, registrarEvaluacion, verificarDpiExistente } from './lib/trackEvento';
import {
  UserCheck, FileText, AlertTriangle, CheckCircle, ShieldCheck,
  Printer, ChevronRight, ChevronLeft, Search, ArrowRight,
  RefreshCcw, Plus, Trash2, XCircle, Undo2, MessageSquareQuote,
  Save
} from 'lucide-react';

import { CATEGORIES, QUESTIONS_DB } from './lib/constants';

const App = () => {
  const esModoAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  const [step, setStep] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [aspirant, setAspirant] = useState({
    name: '', id: '', evaluator: '', date: new Date().toLocaleDateString('es-ES')
  });
  
  const getInitialDraft = () => {
    if (!esModoAdmin) {
      const saved = localStorage.getItem('comif_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.step !== undefined) {
            return parsed;
          }
        } catch {
          // Handled in the cleanup effect
        }
      }
    }
    return null;
  };

  const [draftData, setDraftData] = useState(getInitialDraft);
  const [showRecoveryModal, setShowRecoveryModal] = useState(() => !!getInitialDraft());
  const [showConfirmNewEval, setShowConfirmNewEval] = useState(false);
  const [showDpiConflictModal, setShowDpiConflictModal] = useState(false);
  const [dpiConflictData, setDpiConflictData] = useState(null);

  const [showStartConflictModal, setShowStartConflictModal] = useState(false);
  const [startConflictData, setStartConflictData] = useState(null);
  const [evalIdToUpdate, setEvalIdToUpdate] = useState(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);


  const handleIdChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, ''); // Keep only digits
    if (rawVal.length <= 13) {
      setAspirant(prev => ({ ...prev, id: rawVal }));
    }
  };

  const formattedId = useMemo(() => {
    if (!aspirant.id) return '';
    const match = aspirant.id.match(/^(\d{0,4})(\d{0,5})(\d{0,4})$/);
    if (!match) return aspirant.id;
    const [, g1, g2, g3] = match;
    if (g3) return `${g1} ${g2} ${g3}`;
    if (g2) return `${g1} ${g2}`;
    return g1;
  }, [aspirant.id]);
  const [scores, setScores] = useState(
    QUESTIONS_DB.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );
  const [noConsta, setNoConsta] = useState(
    QUESTIONS_DB.reduce((acc, q) => q.refLabel ? ({ ...acc, [q.id]: false }) : acc, {})
  );
  const [auditorAppreciation, setAuditorAppreciation] = useState('');

  const getInitialRefValue = (q) => {
    if (q.refType === 'empresa')  return { empresa: '', contacto: '', cargo: '', telefono: '' };
    if (q.refType === 'contacto') return { nombre: '', relacion: '', telefono: '' };
    return '';
  };

  const [refs, setRefs] = useState(
    QUESTIONS_DB.reduce((acc, q) => {
      if (!q.refLabel) return acc;
      const initial = getInitialRefValue(q);
      return { ...acc, [q.id]: q.isMultiple ? [initial] : initial };
    }, {})
  );
  const [autoReport, setAutoReport] = useState('');

  // 1. Initial Load: Clean up draft if corrupted
  useEffect(() => {
    if (!esModoAdmin) {
      const saved = localStorage.getItem('comif_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed || parsed.step === undefined) {
            localStorage.removeItem('comif_draft');
          }
        } catch {
          localStorage.removeItem('comif_draft');
        }
      }
    }
  }, [esModoAdmin]);

  // 2. Save draft whenever state changes
  useEffect(() => {
    if (!esModoAdmin && !showRecoveryModal) {
      // Don't save if step 0 is completely empty
      if (guardado || (step === 0 && !aspirant.name && !aspirant.id)) {
        localStorage.removeItem('comif_draft');
      } else {
        const draft = { step, aspirant, scores, noConsta, auditorAppreciation, refs, currentQIndex, autoReport };
        localStorage.setItem('comif_draft', JSON.stringify(draft));
      }
    }
  }, [esModoAdmin, showRecoveryModal, step, aspirant, scores, noConsta, auditorAppreciation, refs, currentQIndex, autoReport, guardado]);

  // 3. Recovery Actions
  const handleRecover = () => {
    if (draftData) {
      setStep(draftData.step || 0);
      setAspirant(draftData.aspirant || { name: '', id: '', evaluator: '', date: new Date().toLocaleDateString('es-ES') });
      setScores(draftData.scores || QUESTIONS_DB.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {}));
      setNoConsta(draftData.noConsta || QUESTIONS_DB.reduce((acc, q) => q.refLabel ? ({ ...acc, [q.id]: false }) : acc, {}));
      setAuditorAppreciation(draftData.auditorAppreciation || '');
      setRefs(draftData.refs || QUESTIONS_DB.reduce((acc, q) => {
        if (!q.refLabel) return acc;
        const initial = getInitialRefValue(q);
        return { ...acc, [q.id]: q.isMultiple ? [initial] : initial };
      }, {}));
      setCurrentQIndex(draftData.currentQIndex || 0);
      setAutoReport(draftData.autoReport || '');
    }
    setShowRecoveryModal(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('comif_draft');
    setDraftData(null);
    setShowRecoveryModal(false);
  };

  const categoryScores = useMemo(() => {
    const results = {};
    CATEGORIES.forEach(cat => {
      const catQuestions = QUESTIONS_DB.filter(q => q.cat === cat.id);
      const answered = catQuestions.filter(q => scores[q.id] > 0);
      const sum = answered.reduce((acc, q) => acc + scores[q.id], 0);
      results[cat.id] = catQuestions.length > 0 ? sum / catQuestions.length : 0;
    });
    return results;
  }, [scores]);

  const finalIS = useMemo(() => {
    return CATEGORIES.reduce((acc, cat) => acc + (categoryScores[cat.id] * cat.weight), 0);
  }, [categoryScores]);

  const zone = useMemo(() => {
    if (finalIS < 3.0) return { label: 'ZONA DE RECHAZO',     color: 'bg-red-100 text-red-800 border-red-300',     action: 'Denegación inmediata.',           icon: <AlertTriangle /> };
    if (finalIS < 4.0) return { label: 'ZONA DE OBSERVACIÓN', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', action: 'Admisión en Periodo de Prueba.', icon: <Search /> };
    return                    { label: 'ZONA DE EXCELENCIA',  color: 'bg-green-100 text-green-800 border-green-300',   action: 'Admisión plena.',                icon: <CheckCircle /> };
  }, [finalIS]);


  const formatRef = (q, data, isMissing) => {
    if (isMissing) return 'NO CONSTA / INFORMACIÓN NO DISPONIBLE.';
    if (!data) return 'Sin datos.';
    const formatSingle = (item) => {
      if (q.refType === 'empresa')  return `${item.empresa || '?'} (Contacto: ${item.contacto || '?'}, ${item.cargo || '?'}) Tel: ${item.telefono || '?'}`;
      if (q.refType === 'contacto') return `${item.nombre || '?'} [Relación: ${item.relacion || '?'}] Tel: ${item.telefono || '?'}`;
      return item;
    };
    if (Array.isArray(data)) return data.map((d, i) => `[Ref ${i + 1}] ${formatSingle(d)}`).join(' | ');
    return formatSingle(data);
  };

  useEffect(() => {
    if (step === 2) {
      let report = `ANÁLISIS DE RIESGO OBJETIVO:\n\n`;
      report += `El aspirante ${aspirant.name || 'en evaluación'} presenta un Índice de Idoneidad Social (IS) de ${finalIS.toFixed(2)}/5.00.\n\n`;
      const refList = QUESTIONS_DB
        .filter(q => q.refLabel)
        .map(q => `• ${q.refLabel.toUpperCase()}: ${formatRef(q, refs[q.id], noConsta[q.id])}`)
        .join('\n');
      if (refList) report += `DILIGENCIA DE DATOS RECOPILADOS:\n${refList}\n\n`;
      const etico   = categoryScores['etico'];
      const arraigo = categoryScores['arraigo'];
      if (etico >= 4)   report += `Se destaca una estructura de control financiero manual y una alta prioridad ética ante la deuda según los reactivos proyectivos. `;
      else if (etico < 3) report += `Se identifica una preocupante falta de métodos formales de registro y una percepción flexible del compromiso financiero. `;
      if (arraigo >= 4) report += `El arraigo comunitario se considera sólido, contando con referencias territoriales que garantizan el control social. `;
      report += `\n\nCONCLUSIÓN TÉCNICA: ${zone.action}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoReport(report);
    }
  }, [step, finalIS, categoryScores, zone.action, refs, aspirant.name, noConsta]);
  useEffect(() => {
    if (step === 3 && aspirant.name) {
      const sanitizedName = aspirant.name.trim().toLowerCase().replace(/\s+/g, '_');
      document.title = `Acta_Resolucion_${sanitizedName}_`;
    } else {
      document.title = 'COMIF - Sistema de Evaluación';
    }
  }, [step, aspirant.name]);

  const resetEvaluation = () => {
    localStorage.removeItem('comif_draft');
    setAspirant({ name: '', id: '', evaluator: '', date: new Date().toLocaleDateString('es-ES') });
    setScores(QUESTIONS_DB.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {}));
    setNoConsta(QUESTIONS_DB.reduce((acc, q) => q.refLabel ? ({ ...acc, [q.id]: false }) : acc, {}));
    setAuditorAppreciation('');
    setRefs(QUESTIONS_DB.reduce((acc, q) => {
      if (!q.refLabel) return acc;
      const initial = getInitialRefValue(q);
      return { ...acc, [q.id]: q.isMultiple ? [initial] : initial };
    }, {}));
    setCurrentQIndex(0);
    setAutoReport('');
    setGuardado(false);
    setGuardando(false);
    setSaveError('');
    setShowConfirmNewEval(false);
    setShowDpiConflictModal(false);
    setShowStartConflictModal(false);
    setDpiConflictData(null);
    setStartConflictData(null);
    setEvalIdToUpdate(null);
    setStep(0);
  };

  const handleStartEval = async () => {
    if (aspirant.id.length < 13) return;
    setVerificandoDpi(true);
    const existente = await verificarDpiExistente(aspirant.id);
    setVerificandoDpi(false);

    if (existente) {
      setStartConflictData(existente);
      setShowStartConflictModal(true);
    } else {
      setEvalIdToUpdate(null);
      setStep(1);
    }
  };

  const loadExistingDataAndStart = () => {
    if (startConflictData?.detalles) {
      const d = startConflictData.detalles;
      if (d.scores) setScores(d.scores);
      if (d.refs) setRefs(d.refs);
      if (d.noConsta) setNoConsta(d.noConsta);
      if (d.auditorAppreciation) setAuditorAppreciation(d.auditorAppreciation);
    }
    setEvalIdToUpdate(startConflictData.id);
    setShowStartConflictModal(false);
    setStep(1);
  };

  const performSave = async (accion = 'auto', evalId = null) => {
    if (guardado || guardando) return;
    setGuardando(true);
    setSaveError('');
    
    // Si ya sabíamos que íbamos a actualizar un ID desde el principio, forzamos la acción.
    let finalAccion = accion;
    let finalEvalId = evalId;
    if (finalAccion === 'auto' && evalIdToUpdate) {
        finalAccion = 'update';
        finalEvalId = evalIdToUpdate;
    }

    await trackEvento('evaluacion_completada');
    const res = await registrarEvaluacion({ 
      aspiranteNombre: aspirant.name, 
      aspiranteDpi: aspirant.id, 
      analistaNombre: aspirant.evaluator, 
      indiceIdoneidad: parseFloat(finalIS.toFixed(2)), 
      zona: zone.label,
      detalles: { scores, refs, noConsta, finalIS, autoReport, auditorAppreciation, zone: { label: zone.label, color: zone.color, action: zone.action }, aspirant },
      accion: finalAccion,
      evalId: finalEvalId
    });

    if (res && res.requiresConfirmation) {
      setDpiConflictData(res.existente);
      setShowDpiConflictModal(true);
      // Mantener guardando activo en falso para que puedan elegir
      setGuardando(false);
      return;
    }

    if (res && res.error) {
      setSaveError(res.error);
      setGuardando(false);
      return;
    }

    // Opcional: mostrar el res.message en algún lado, aquí solo marcamos guardado
    setGuardando(false);
    setGuardado(true);
  };

  const progress = (Object.values(scores).filter(s => s > 0).length / 30) * 100;
  const currentQuestion = QUESTIONS_DB.sort((a, b) => a.id - b.id)[currentQIndex];
  const currentCategory = CATEGORIES.find(c => c.id === currentQuestion.cat);

  const canAdvance = useMemo(() => {
    const scorePicked = scores[currentQuestion.id] > 0;
    if (!currentQuestion.refLabel) return scorePicked;
    if (noConsta[currentQuestion.id]) return scorePicked;
    const data = refs[currentQuestion.id];
    const validateItem = (item) => {
      if (currentQuestion.refType === 'empresa')  return item.empresa && item.contacto && item.cargo && item.telefono;
      if (currentQuestion.refType === 'contacto') return item.nombre && item.relacion && item.telefono;
      return typeof item === 'string' && item.trim().length > 0;
    };
    if (Array.isArray(data)) return scorePicked && data.every(validateItem);
    return scorePicked && validateItem(data);
  }, [scores, refs, currentQuestion, noConsta]);

  const handleNext = () => {
    if (currentQIndex < 29) setCurrentQIndex(prev => prev + 1);
    else setStep(2);
  };

  const updateRefField = (qId, field, value, index = null) => {
    setRefs(prev => {
      if (index !== null) {
        const newList = [...prev[qId]];
        newList[index] = { ...newList[index], [field]: value };
        return { ...prev, [qId]: newList };
      }
      return { ...prev, [qId]: typeof prev[qId] === 'object' ? { ...prev[qId], [field]: value } : value };
    });
  };

  const addRef = (qId) => {
    const q = QUESTIONS_DB.find(x => x.id === qId);
    const initial = getInitialRefValue(q);
    setRefs(prev => ({ ...prev, [qId]: [...prev[qId], initial] }));
  };

  const removeRef = (qId, index) => {
    setRefs(prev => {
      if (prev[qId].length <= 1) return prev;
      const newList = prev[qId].filter((_, i) => i !== index);
      return { ...prev, [qId]: newList };
    });
  };



  if (esModoAdmin) {
    return <PanelMetricas />;
  }

  return (
    <div className="h-[100dvh] w-full bg-slate-100 p-2 md:p-6 font-sans text-slate-900 flex flex-col overflow-hidden">
      
      {/* Modal de Recuperación de Borrador */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-50 text-yellow-500 rounded-full shadow-inner border border-yellow-100">
                <RefreshCcw size={36} />
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-[#0B1C2D] mb-2 uppercase tracking-tight">Evaluación Pendiente</h2>
            <p className="text-xs text-center text-slate-500 mb-6 font-medium leading-relaxed">
              Hemos detectado un borrador sin guardar de <strong className="text-slate-700 uppercase">{draftData?.aspirant?.name || 'un aspirante'}</strong>. ¿Deseas continuar donde te quedaste o empezar una evaluación nueva?
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleRecover} className="w-full py-3.5 bg-[#FFD400] text-[#0B1C2D] font-black uppercase text-xs tracking-wider rounded-xl hover:bg-[#ffe040] hover:scale-[1.02] transition-all shadow-md">
                Continuar Evaluación
              </button>
              <button onClick={handleDiscardDraft} className="w-full py-3.5 bg-slate-50 border-2 border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">
                Empezar de cero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Nueva Evaluación */}
      {showConfirmNewEval && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-xl font-black text-center text-[#0B1C2D] mb-2 uppercase tracking-tight">¿Qué deseas hacer?</h2>
            <p className="text-xs text-center text-slate-500 mb-6 font-medium leading-relaxed">
              Antes de empezar una nueva evaluación, asegúrate de guardar o imprimir los datos del aspirante actual.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { window.print(); setShowConfirmNewEval(false); }} className="w-full py-3.5 bg-blue-50 border-2 border-blue-100 text-blue-600 font-black uppercase text-xs tracking-wider rounded-xl hover:bg-blue-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <Printer size={16} /> Imprimir Acta
              </button>
              {!guardado && (
                <button onClick={() => { setShowConfirmNewEval(false); document.getElementById('btn-guardar-principal')?.click(); }} className="w-full py-3.5 bg-[#0B1C2D] border-2 border-[#0B1C2D] text-[#FFD400] font-black uppercase text-xs tracking-wider rounded-xl hover:bg-[#1a2e3f] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-md">
                  <Save size={16} /> Guardar Evaluación
                </button>
              )}
              <div className="h-px w-full bg-slate-100 my-2"></div>
              <button onClick={resetEvaluation} className="w-full py-3.5 bg-red-50 border-2 border-red-100 text-red-600 font-black uppercase text-xs tracking-wider rounded-xl hover:bg-red-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <RefreshCcw size={16} /> Sí, Empezar de Cero
              </button>
              <button onClick={() => setShowConfirmNewEval(false)} className="w-full mt-2 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">
                Cancelar y Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflicto de DPI */}
      {showDpiConflictModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-xl font-black text-center text-[#0B1C2D] mb-2 uppercase tracking-tight">DPI ya registrado</h2>
            <p className="text-xs text-center text-slate-500 mb-6 font-medium leading-relaxed">
              El asociado ya está en el sistema. Evaluado anteriormente por <strong className="text-[#0B1C2D]">{dpiConflictData?.analista_nombre || 'otro analista'}</strong>. ¿Deseas actualizar la evaluación existente o registrar una nueva paralela?
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowDpiConflictModal(false); performSave('update', dpiConflictData?.id); }} className="w-full py-3.5 bg-[#FFD400] text-[#0B1C2D] font-black uppercase text-xs tracking-wider rounded-xl hover:bg-[#ffe040] hover:scale-[1.02] transition-all shadow-md">
                Actualizar Existente
              </button>
              <button onClick={() => { setShowDpiConflictModal(false); performSave('insert', null); }} className="w-full py-3.5 bg-blue-50 border-2 border-blue-100 text-blue-600 font-black uppercase text-xs tracking-wider rounded-xl hover:bg-blue-100 hover:scale-[1.02] transition-all">
                Guardar como Nueva
              </button>
              <button onClick={() => { setShowDpiConflictModal(false); setGuardando(false); }} className="w-full mt-2 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">
                Cancelar y Revisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflicto de DPI AL INICIO */}
      {showStartConflictModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-xl font-black text-center text-[#0B1C2D] mb-2 uppercase tracking-tight">DPI ya registrado</h2>
            <p className="text-xs text-center text-slate-500 mb-6 font-medium leading-relaxed">
              Hemos encontrado este DPI en el sistema. Fue evaluado previamente por <strong className="text-[#0B1C2D]">{startConflictData?.analista_nombre || 'otro analista'}</strong>. 
              {startConflictData?.estado !== 'pendiente' ? (
                <span className="block mt-4 text-red-600 font-bold uppercase text-[9px] tracking-widest bg-red-50 border border-red-100 p-3 rounded-xl shadow-sm">
                  Solo se puede actualizar porque este expediente ya fue Rechazado/Aceptado por el administrador.
                </span>
              ) : (
                <span className="block mt-4">¿Qué deseas hacer?</span>
              )}
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={loadExistingDataAndStart} 
                className="w-full py-3.5 bg-[#FFD400] text-[#0B1C2D] font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl hover:bg-[#ffe040] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCcw size={16} /> Cargar para Actualizar
              </button>
              {startConflictData?.estado === 'pendiente' && (
                <button 
                  onClick={() => { setShowStartConflictModal(false); setEvalIdToUpdate(null); setStep(1); }} 
                  className="w-full py-3.5 bg-blue-50 border-2 border-blue-100 text-blue-600 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Iniciar Expediente Nuevo
                </button>
              )}
              <button onClick={() => setShowStartConflictModal(false)} className="w-full mt-2 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full h-full bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">

        {/* Header */}
        <header className="bg-[#0B1C2D] text-white p-4 flex justify-between items-center border-b-4 border-[#FFD400] shrink-0">
          <button 
            onClick={() => window.location.href = '?admin=true'}
            className="text-left hover:opacity-80 transition-opacity cursor-pointer flex flex-col focus:outline-none"
            title="Ir al Panel de Administración"
          >
            <h1 className="text-xl font-black uppercase tracking-tighter">
              Cooperativa COMIF <span className="text-[#FFD400]">R.L.</span>
            </h1>
            <p className="text-[#FFD400] font-mono text-[9px] tracking-[0.1em] uppercase">
              Control de Riesgos de Morosidad • v19.0
            </p>
          </button>
          <ShieldCheck className="text-[#FFD400]" size={18} />
        </header>

        {/* Progress bar */}
        <div className="bg-slate-200 h-1 w-full shrink-0">
          <div className="h-full bg-[#10B981] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <main className="p-4 md:p-6 flex-1 overflow-y-auto">

          {/* STEP 0 — Datos aspirante */}
          {step === 0 && (
            <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#0B1C2D] uppercase tracking-tight">Expediente de Admisión</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Matriz de Inteligencia Social</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-4 shadow-inner">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Aspirante</label>
                  <input type="text" value={aspirant.name}
                    onChange={e => setAspirant({ ...aspirant, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-[#0B1C2D] focus:ring-2 focus:ring-[#FFD400]"
                    placeholder="NOMBRE COMPLETO" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">ID/Cédula (DPI)</label>
                    <input type="text" value={formattedId}
                      onChange={handleIdChange}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 font-mono text-sm outline-none focus:border-[#0B1C2D] focus:ring-2 focus:ring-[#FFD400]"
                      placeholder="13 DÍGITOS" />
                    {aspirant.id && aspirant.id.length < 13 && (
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight ml-2 block">
                        Faltan {13 - aspirant.id.length} dígitos
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fecha</label>
                    <input type="text" value={aspirant.date}
                      onChange={e => setAspirant({ ...aspirant, date: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-[#0B1C2D] focus:ring-2 focus:ring-[#FFD400]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Auditor</label>
                  <input type="text" value={aspirant.evaluator}
                    onChange={e => setAspirant({ ...aspirant, evaluator: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-[#0B1C2D] focus:ring-2 focus:ring-[#FFD400]"
                    placeholder="FIRMA EVALUADOR" />
                </div>
              </div>
              <button
                onClick={handleStartEval}
                disabled={!aspirant.name || aspirant.id.length < 13 || !aspirant.evaluator || verificandoDpi}
                className="w-full py-4 bg-[#FFD400] hover:bg-[#ffe040] text-[#0B1C2D] rounded-2xl font-black uppercase text-sm flex justify-center items-center gap-3 disabled:opacity-50 disabled:hover:bg-[#FFD400] active:scale-95 transition-all shadow-lg shadow-[#FFD400]/25 mt-6"
              >
                {verificandoDpi ? (
                  <><RefreshCcw className="animate-spin" size={18} /> Verificando...</>
                ) : (
                  <>Comenzar Evaluación <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}

          {/* STEP 1 — Cuestionario */}
          {step === 1 && (
            <div className="space-y-2 h-full flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden pb-1">
              {/* Categoría actual */}
              <div className="flex items-center gap-2 bg-[#0B1C2D] text-white p-2 sm:p-3 rounded-xl shrink-0 shadow-md border-b-2 border-[#FFD400]">
                <div className="p-1.5 sm:p-2 bg-[#10B981] rounded-lg text-white">{currentCategory.icon}</div>
                <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight">{currentCategory.title}</h3>
                <div className="ml-auto font-mono text-[9px] sm:text-[10px] text-[#FFD400] font-bold">{currentQIndex + 1}/30</div>
              </div>

              <div className="bg-white border-2 border-slate-50 rounded-2xl p-2 sm:p-4 flex-1 flex flex-col justify-center gap-2 sm:gap-4 overflow-y-auto">
                <div className="space-y-2">
                  <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 leading-tight">{currentQuestion.text}</p>

                  {/* Panel de referencia */}
                  {currentQuestion.refLabel && (
                    <div className="bg-[#0B1C2D]/5 p-2 sm:p-3 rounded-xl border border-[#0B1C2D]/10 animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase text-[#0B1C2D] flex items-center gap-1.5 leading-none">
                          <FileText size={10} className="text-[#10B981] shrink-0" /> <span className="line-clamp-1">{currentQuestion.refLabel}</span>
                        </label>
                        <button
                          onClick={() => setNoConsta(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all border-2 shrink-0 ${noConsta[currentQuestion.id] ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-red-200'}`}>
                          {noConsta[currentQuestion.id] ? <Undo2 size={10} /> : <XCircle size={10} />}
                          {noConsta[currentQuestion.id] ? 'Deshacer' : 'No Consta'}
                        </button>
                      </div>

                      {noConsta[currentQuestion.id] ? (
                        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-100 animate-in slide-in-from-top-2 duration-300">
                          <AlertTriangle className="text-red-500 shrink-0" size={14} />
                          <p className="text-[9px] sm:text-[10px] font-bold text-red-800 leading-tight">
                            Información <span className="uppercase underline">No disponible</span>.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in fade-in duration-500">
                          {currentQuestion.isMultiple ? (
                            <div className="space-y-2">
                              {(refs[currentQuestion.id] || []).map((item, idx) => (
                                <div key={idx} className="relative bg-white/50 p-2 rounded-lg border border-[#0B1C2D]/10">
                                  {refs[currentQuestion.id].length > 1 && (
                                    <button onClick={() => removeRef(currentQuestion.id, idx)}
                                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full shadow-sm hover:scale-110 transition-transform">
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <input placeholder="Nombre"   className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={item.nombre}   onChange={e => updateRefField(currentQuestion.id, 'nombre',   e.target.value, idx)} />
                                    <input placeholder="Relación" className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={item.relacion} onChange={e => updateRefField(currentQuestion.id, 'relacion', e.target.value, idx)} />
                                    <input placeholder="Teléfono" className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={item.telefono} onChange={e => updateRefField(currentQuestion.id, 'telefono', e.target.value, idx)} />
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => addRef(currentQuestion.id)}
                                className="w-full py-1.5 bg-[#0B1C2D]/10 text-[#0B1C2D] rounded-md text-[9px] font-black uppercase flex items-center justify-center gap-1 hover:bg-[#0B1C2D]/20 transition-colors">
                                <Plus size={12} /> Añadir otro
                              </button>
                            </div>
                          ) : (
                            <>
                              {currentQuestion.refType === 'empresa' && (
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input placeholder="Empresa"  className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].empresa}   onChange={e => updateRefField(currentQuestion.id, 'empresa',   e.target.value)} />
                                  <input placeholder="Contacto" className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].contacto}  onChange={e => updateRefField(currentQuestion.id, 'contacto',  e.target.value)} />
                                  <input placeholder="Cargo"    className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].cargo}     onChange={e => updateRefField(currentQuestion.id, 'cargo',     e.target.value)} />
                                  <input placeholder="Teléfono" className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].telefono}  onChange={e => updateRefField(currentQuestion.id, 'telefono',  e.target.value)} />
                                </div>
                              )}
                              {currentQuestion.refType === 'contacto' && (
                                <div className="grid grid-cols-3 gap-1.5">
                                  <input placeholder="Nombre"   className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].nombre}   onChange={e => updateRefField(currentQuestion.id, 'nombre',   e.target.value)} />
                                  <input placeholder="Relación" className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].relacion} onChange={e => updateRefField(currentQuestion.id, 'relacion', e.target.value)} />
                                  <input placeholder="Teléfono" className="p-1.5 rounded-md border text-[10px] sm:text-xs focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].telefono} onChange={e => updateRefField(currentQuestion.id, 'telefono', e.target.value)} />
                                </div>
                              )}
                              {currentQuestion.refType === 'texto' && (
                                <textarea
                                  value={refs[currentQuestion.id] || ''}
                                  onChange={e => updateRefField(currentQuestion.id, null, e.target.value)}
                                  className="w-full p-2 rounded-lg bg-white border border-[#0B1C2D]/20 text-[10px] sm:text-xs font-medium outline-none focus:ring-1 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] min-h-[40px] resize-none"
                                  placeholder="Escriba aquí..." />
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Opciones de respuesta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {currentQuestion.options.map(opt => (
                    <button key={opt.val}
                      onClick={() => {
                        setScores({ ...scores, [currentQuestion.id]: opt.val });
                        if (!currentQuestion.refLabel) {
                          if (currentQIndex < 29) setCurrentQIndex(prev => prev + 1);
                          else setStep(2);
                        }
                      }}
                      className={`text-left p-2 sm:p-3 rounded-xl text-[10px] sm:text-xs font-semibold border flex items-center gap-2 transition-all ${scores[currentQuestion.id] === opt.val ? 'bg-[#0B1C2D] border-[#0B1C2D] text-white scale-[1.01] shadow-md z-10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-[#FFD400] hover:ring-1 hover:ring-[#FFD400]'}`}>
                      <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-black text-[9px] border ${scores[currentQuestion.id] === opt.val ? 'border-white text-[#FFD400]' : 'border-slate-300 text-slate-400'}`}>
                        {opt.val}
                      </span>
                      <span className="leading-tight">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navegación */}
              <div className="flex justify-between items-center px-1 sm:px-2 shrink-0 pt-1">
                <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className={`text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-0.5 sm:gap-1 ${currentQIndex === 0 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}>
                  <ChevronLeft size={12} /> ANTERIOR
                </button>
                <div className="flex gap-0.5 sm:gap-1">
                  {CATEGORIES.map(c => (
                    <div key={c.id} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${currentCategory.id === c.id ? 'bg-[#0B1C2D] scale-125' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <button disabled={!canAdvance} onClick={handleNext}
                  className={`py-2 px-3 sm:px-4 rounded-lg font-black uppercase text-[9px] sm:text-[10px] flex items-center gap-1 sm:gap-2 transition-all ${canAdvance ? 'bg-[#0B1C2D] text-white shadow-md shadow-[#0B1C2D]/20 hover:bg-[#1a2e3f]' : 'bg-slate-100 text-slate-300'}`}>
                  {currentQIndex < 29 ? 'Siguiente' : 'Finalizar'} <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Informe */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-500 max-w-5xl mx-auto pb-2 h-full flex flex-col overflow-y-auto px-1 sm:px-0">
              <div className="flex flex-col md:flex-row gap-2 sm:gap-3 shrink-0">
                {/* Score card */}
                <div className="flex-[0.4] bg-[#0B1C2D] rounded-2xl p-4 text-white text-center shadow-md border-b-4 border-[#FFD400] flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IS</p>
                  <p className="text-5xl md:text-6xl font-black text-[#FFD400] tabular-nums leading-none my-1">{finalIS.toFixed(2)}</p>
                  <div className={`px-2 py-1 mx-auto rounded-md font-black uppercase text-[8px] border ${zone.color} border-current inline-block`}>
                    {zone.label}
                  </div>
                </div>
                {/* Barras por categoría */}
                <div className="flex-[0.6] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 items-center">
                  {CATEGORIES.map(cat => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase">
                        <span className="text-slate-500">{cat.id}</span>
                        <span className="text-slate-900">{categoryScores[cat.id].toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#10B981] transition-all duration-1000" style={{ width: `${(categoryScores[cat.id] / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-2 gap-2 sm:gap-3 shrink-0 sm:flex-1 sm:min-h-0">
                {/* Análisis técnico auto-generado */}
                <div className="space-y-1 flex flex-col h-full">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Análisis de Riesgo Factual:</label>
                  <textarea value={autoReport} onChange={e => setAutoReport(e.target.value)}
                    className="w-full flex-1 min-h-[100px] resize-none bg-white border-2 border-slate-100 rounded-xl p-3 text-slate-700 text-[10px] font-medium leading-relaxed outline-none focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] shadow-inner" />
                </div>

                {/* Apreciación del auditor */}
                <div className="space-y-1 bg-[#0B1C2D]/5 p-3 rounded-xl border-2 border-[#0B1C2D]/10 shadow-sm relative flex flex-col h-full">
                  <div className="absolute top-2 right-4 opacity-5 text-[#0B1C2D]"><MessageSquareQuote size={40} /></div>
                  <label className="text-[9px] font-black uppercase text-[#0B1C2D] ml-1 flex items-center gap-1">
                    <UserCheck size={12} className="text-[#10B981]" /> Apreciación General del Auditor
                  </label>
                  <textarea value={auditorAppreciation} onChange={e => setAuditorAppreciation(e.target.value)}
                    placeholder="Redacte aquí conclusiones, observaciones o motivos..."
                    className="w-full flex-1 min-h-[100px] resize-none bg-white border-2 border-[#0B1C2D]/20 rounded-lg p-3 text-slate-800 text-[11px] font-semibold leading-relaxed outline-none focus:ring-4 focus:ring-[#0B1C2D]/5 focus:border-[#0B1C2D] transition-all" />
                  {!auditorAppreciation.trim() && (
                    <p className="text-[8px] font-black text-red-500 mt-1 animate-pulse uppercase tracking-widest text-right">
                      *** Obligatorio para consolidar ***
                    </p>
                  )}
                </div>
              </div>

              <button disabled={!auditorAppreciation.trim()} onClick={() => setStep(3)}
                className={`w-full py-3 shrink-0 rounded-xl font-black uppercase text-xs shadow-md flex justify-center items-center gap-2 transition-all ${auditorAppreciation.trim() ? 'bg-[#0B1C2D] text-white hover:bg-[#1a2e3f] shadow-lg shadow-[#0B1C2D]/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                CONSOLIDAR ACTA OFICIAL <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 3 — Acta final */}
          {step === 3 && (
            <div className="animate-in zoom-in duration-300 h-full flex flex-col overflow-hidden pb-2">
              <div className="flex-1 overflow-auto p-1 sm:p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-inner mb-2 flex justify-center">
                <div className="w-full max-w-[210mm]">
                  <ActaImprimible 
                    aspirant={aspirant}
                    finalIS={finalIS}
                    autoReport={autoReport}
                    refs={refs}
                    noConsta={noConsta}
                    auditorAppreciation={auditorAppreciation}
                    zone={zone}
                  />
                </div>
              </div>

              <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 px-1 print:hidden">
                <button onClick={() => { setStep(2); setGuardado(false); }} className="py-2.5 text-slate-500 font-black uppercase text-[9px] sm:text-[10px] hover:bg-slate-100 rounded-lg border-2 border-slate-200 hover:border-[#FFD400] hover:text-[#0B1C2D] transition-all disabled:opacity-50 flex items-center justify-center gap-1" disabled={guardando}>
                  <Undo2 size={14} /> Editar
                </button>
                <button onClick={() => window.print()} className="py-2.5 text-slate-500 font-black uppercase text-[9px] sm:text-[10px] hover:bg-slate-100 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-1" disabled={guardando}>
                  <Printer size={14} /> Imprimir
                </button>
                <button 
                  id="btn-guardar-principal"
                  onClick={() => performSave('auto')}
                  disabled={guardado || guardando}
                  className={`py-2.5 rounded-lg font-black uppercase text-[9px] shadow-sm flex items-center justify-center gap-1 transition-all ${guardado ? 'bg-[#10B981] text-white border-2 border-[#10B981]' : 'bg-[#0B1C2D] text-white hover:bg-[#1a2e3f] shadow-[#0B1C2D]/20 border-2 border-[#0B1C2D]'}`}
                >
                  {guardando ? (
                    <><RefreshCcw size={14} className="text-[#FFD400] animate-spin" /> Guardando</>
                  ) : guardado ? (
                    <><CheckCircle size={14} /> Guardado</>
                  ) : (
                    <><Save size={14} className="text-[#FFD400]" /> Guardar</>
                  )}
                </button>
                <button onClick={() => setShowConfirmNewEval(true)} className="py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-lg font-black uppercase text-[9px] sm:text-[10px] shadow-sm flex items-center justify-center gap-1 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 group">
                  <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                  Nueva Eval.
                </button>
              </div>

              {saveError && (
                <div className="mx-2 mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wide rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  {saveError}
                </div>
              )}
            </div>
          )}

        </main>

        <footer className="bg-slate-50 p-3 border-t border-slate-100 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] shrink-0">
          SISTEMA DE FILTRO ANALÓGICO COMIF • MATRIZ OBJETIVA DE RIESGOS • 2026
        </footer>
      </div>


    </div>
  );
};

export default App;

import { useState, useMemo, useEffect } from 'react';
import PanelMetricas from './components/PanelMetricas';
import ActaImprimible from './components/ActaImprimible';
import { trackEvento, registrarEvaluacion } from './lib/trackEvento';
import {
  UserCheck, FileText, AlertTriangle, CheckCircle, TrendingUp, ShieldCheck,
  Printer, ChevronRight, ChevronLeft, Search, Users, ArrowRight, BrainCircuit,
  RefreshCcw, Plus, Trash2, XCircle, Undo2, MessageSquareQuote,
  Phone, Briefcase, Save
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
    setStep(0);
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
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans text-slate-900 flex flex-col">
      <div className="max-w-5xl mx-auto w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header */}
        <header className="bg-[#0B1C2D] text-white p-4 flex justify-between items-center border-b-4 border-[#FFD400] shrink-0">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">
              Cooperativa COMIF <span className="text-[#FFD400]">R.L.</span>
            </h1>
            <p className="text-[#FFD400] font-mono text-[9px] tracking-[0.1em] uppercase">
              Control de Riesgos de Morosidad • v19.0
            </p>
          </div>
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
              <button disabled={!aspirant.name.trim() || aspirant.id.length !== 13 || !aspirant.evaluator.trim()} onClick={() => { trackEvento('inicio_evaluacion'); setStep(1); }}
                className="w-full py-4 bg-[#FFD400] hover:bg-[#ffe040] text-[#0B1C2D] rounded-2xl font-black uppercase text-sm flex justify-center items-center gap-3 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-[#FFD400]/25">
                COMENZAR ENTREVISTA <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 1 — Cuestionario */}
          {step === 1 && (
            <div className="space-y-4 h-full flex flex-col animate-in slide-in-from-right duration-300">
              {/* Categoría actual */}
              <div className="flex items-center gap-3 bg-[#0B1C2D] text-white p-3 rounded-2xl shrink-0 shadow-lg border-b-2 border-[#FFD400]">
                <div className="p-2 bg-[#10B981] rounded-xl text-white">{currentCategory.icon}</div>
                <h3 className="text-[11px] font-black uppercase tracking-tight">{currentCategory.title}</h3>
                <div className="ml-auto font-mono text-[10px] text-[#FFD400] font-bold">{currentQIndex + 1}/30</div>
              </div>

              <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-4 flex-1 flex flex-col justify-center gap-4">
                <div className="space-y-3">
                  <p className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{currentQuestion.text}</p>

                  {/* Panel de referencia */}
                  {currentQuestion.refLabel && (
                    <div className="bg-[#0B1C2D]/5 p-4 rounded-2xl border border-[#0B1C2D]/10 animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black uppercase text-[#0B1C2D] flex items-center gap-2">
                          <FileText size={12} className="text-[#10B981]" /> {currentQuestion.refLabel}
                        </label>
                        <button
                          onClick={() => setNoConsta(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border-2 ${noConsta[currentQuestion.id] ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-red-200'}`}>
                          {noConsta[currentQuestion.id] ? <Undo2 size={12} /> : <XCircle size={12} />}
                          {noConsta[currentQuestion.id] ? 'Deshacer: Volver a rellenar' : 'Marcar No Consta'}
                        </button>
                      </div>

                      {noConsta[currentQuestion.id] ? (
                        <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-2 duration-300">
                          <AlertTriangle className="text-red-500 shrink-0" size={20} />
                          <p className="text-[11px] font-bold text-red-800 leading-tight">
                            Información marcada como <span className="uppercase underline">No disponible</span>.
                            Puede continuar con la evaluación o pulsar &quot;Deshacer&quot; para editar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 animate-in fade-in duration-500">
                          {currentQuestion.isMultiple ? (
                            <div className="space-y-3">
                              {(refs[currentQuestion.id] || []).map((item, idx) => (
                                <div key={idx} className="relative bg-white/50 p-3 rounded-xl border border-[#0B1C2D]/10">
                                  {refs[currentQuestion.id].length > 1 && (
                                    <button onClick={() => removeRef(currentQuestion.id, idx)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform">
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                  <div className="grid grid-cols-3 gap-2">
                                    <input placeholder="Nombre"   className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={item.nombre}   onChange={e => updateRefField(currentQuestion.id, 'nombre',   e.target.value, idx)} />
                                    <input placeholder="Relación" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={item.relacion} onChange={e => updateRefField(currentQuestion.id, 'relacion', e.target.value, idx)} />
                                    <input placeholder="Teléfono" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={item.telefono} onChange={e => updateRefField(currentQuestion.id, 'telefono', e.target.value, idx)} />
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => addRef(currentQuestion.id)}
                                className="w-full py-2 bg-[#0B1C2D]/10 text-[#0B1C2D] rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#0B1C2D]/20 transition-colors">
                                <Plus size={14} /> Añadir otro contacto
                              </button>
                            </div>
                          ) : (
                            <>
                              {currentQuestion.refType === 'empresa' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <input placeholder="Empresa"  className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].empresa}   onChange={e => updateRefField(currentQuestion.id, 'empresa',   e.target.value)} />
                                  <input placeholder="Contacto" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].contacto}  onChange={e => updateRefField(currentQuestion.id, 'contacto',  e.target.value)} />
                                  <input placeholder="Cargo"    className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].cargo}     onChange={e => updateRefField(currentQuestion.id, 'cargo',     e.target.value)} />
                                  <input placeholder="Teléfono" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].telefono}  onChange={e => updateRefField(currentQuestion.id, 'telefono',  e.target.value)} />
                                </div>
                              )}
                              {currentQuestion.refType === 'contacto' && (
                                <div className="grid grid-cols-3 gap-2">
                                  <input placeholder="Nombre"   className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].nombre}   onChange={e => updateRefField(currentQuestion.id, 'nombre',   e.target.value)} />
                                  <input placeholder="Relación" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].relacion} onChange={e => updateRefField(currentQuestion.id, 'relacion', e.target.value)} />
                                  <input placeholder="Teléfono" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] outline-none" value={refs[currentQuestion.id].telefono} onChange={e => updateRefField(currentQuestion.id, 'telefono', e.target.value)} />
                                </div>
                              )}
                              {currentQuestion.refType === 'texto' && (
                                <textarea
                                  value={refs[currentQuestion.id] || ''}
                                  onChange={e => updateRefField(currentQuestion.id, null, e.target.value)}
                                  className="w-full p-3 rounded-xl bg-white border border-[#0B1C2D]/20 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] min-h-[60px] resize-none"
                                  placeholder="Escriba los datos aquí..." />
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Opciones de respuesta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentQuestion.options.map(opt => (
                    <button key={opt.val}
                      onClick={() => {
                        setScores({ ...scores, [currentQuestion.id]: opt.val });
                        if (!currentQuestion.refLabel) {
                          if (currentQIndex < 29) setCurrentQIndex(prev => prev + 1);
                          else setStep(2);
                        }
                      }}
                      className={`text-left p-3 rounded-xl text-xs font-semibold border flex items-center gap-3 transition-all ${scores[currentQuestion.id] === opt.val ? 'bg-[#0B1C2D] border-[#0B1C2D] text-white scale-[1.02] shadow-md z-10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-[#FFD400] hover:ring-1 hover:ring-[#FFD400]'}`}>
                      <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-black text-[10px] border ${scores[currentQuestion.id] === opt.val ? 'border-white text-[#FFD400]' : 'border-slate-300 text-slate-400'}`}>
                        {opt.val}
                      </span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navegación */}
              <div className="flex justify-between items-center px-2 shrink-0">
                <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className={`text-[10px] font-black uppercase flex items-center gap-1 ${currentQIndex === 0 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}>
                  <ChevronLeft size={14} /> ANTERIOR
                </button>
                <div className="flex gap-1">
                  {CATEGORIES.map(c => (
                    <div key={c.id} className={`w-2 h-2 rounded-full transition-all ${currentCategory.id === c.id ? 'bg-[#0B1C2D] scale-125' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <button disabled={!canAdvance} onClick={handleNext}
                  className={`py-3 px-6 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 transition-all ${canAdvance ? 'bg-[#0B1C2D] text-white shadow-lg shadow-[#0B1C2D]/20 hover:bg-[#1a2e3f]' : 'bg-slate-100 text-slate-300'}`}>
                  {currentQIndex < 29 ? 'Siguiente' : 'Finalizar'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Informe */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Score card */}
                <div className="flex-1 bg-[#0B1C2D] rounded-[2rem] p-6 text-white text-center shadow-xl border-b-4 border-[#FFD400]">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Idoneidad Social (IS)</p>
                  <p className="text-7xl font-black text-[#FFD400] tabular-nums">{finalIS.toFixed(2)}</p>
                  <div className={`mt-3 px-4 py-1.5 rounded-lg font-black uppercase text-[9px] border ${zone.color} border-current inline-block`}>
                    {zone.label}
                  </div>
                </div>
                {/* Barras por categoría */}
                <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-6 space-y-3 shadow-sm">
                  {CATEGORIES.map(cat => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase">
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

              {/* Análisis técnico auto-generado */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Análisis de Riesgo Técnico (Factual):</label>
                <textarea value={autoReport} onChange={e => setAutoReport(e.target.value)} rows={8}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl p-6 text-slate-700 text-[11px] font-medium leading-relaxed outline-none focus:ring-2 focus:ring-[#0B1C2D]/20 focus:border-[#0B1C2D] shadow-inner" />
              </div>

              {/* Apreciación del auditor */}
              <div className="space-y-2 bg-[#0B1C2D]/5 p-6 rounded-[2.5rem] border-2 border-[#0B1C2D]/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-6 opacity-5 text-[#0B1C2D]"><MessageSquareQuote size={60} /></div>
                <label className="text-[10px] font-black uppercase text-[#0B1C2D] ml-1 flex items-center gap-2">
                  <UserCheck size={14} className="text-[#10B981]" /> Apreciación General del Auditor (Obligatorio)
                </label>
                <textarea value={auditorAppreciation} onChange={e => setAuditorAppreciation(e.target.value)} rows={6}
                  placeholder="Redacte aquí sus conclusiones subjetivas, observaciones de conducta o motivos específicos de la recomendación..."
                  className="w-full bg-white border-2 border-[#0B1C2D]/20 rounded-2xl p-5 text-slate-800 text-sm font-semibold leading-relaxed outline-none focus:ring-4 focus:ring-[#0B1C2D]/5 focus:border-[#0B1C2D] transition-all" />
                {!auditorAppreciation.trim() && (
                  <p className="text-[9px] font-black text-red-500 mt-2 animate-pulse uppercase tracking-widest text-right">
                    *** Debe completar este apartado para consolidar el acta ***
                  </p>
                )}
              </div>

              <button disabled={!auditorAppreciation.trim()} onClick={() => setStep(3)}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex justify-center items-center gap-2 transition-all ${auditorAppreciation.trim() ? 'bg-[#0B1C2D] text-white hover:bg-[#1a2e3f] shadow-lg shadow-[#0B1C2D]/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                CONSOLIDAR ACTA OFICIAL <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 3 — Acta final */}
          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <ActaImprimible 
                aspirant={aspirant}
                finalIS={finalIS}
                autoReport={autoReport}
                refs={refs}
                noConsta={noConsta}
                auditorAppreciation={auditorAppreciation}
                zone={zone}
              />

              <div className="flex flex-wrap gap-3 pb-12 px-2 print:hidden">
                <button onClick={() => { setStep(2); setGuardado(false); }} className="flex-1 min-w-[120px] py-4 text-slate-400 font-black uppercase text-[10px] hover:bg-white rounded-2xl border-2 border-slate-100 hover:border-[#FFD400] hover:text-[#0B1C2D] transition-all disabled:opacity-50" disabled={guardando}>
                  Editar Informe
                </button>
                <button 
                  onClick={async () => {
                    if (guardado || guardando) return;
                    setGuardando(true);
                    setSaveError('');
                    await trackEvento('evaluacion_completada');
                    const res = await registrarEvaluacion({ 
                      aspiranteNombre: aspirant.name, 
                      aspiranteDpi: aspirant.id, 
                      analistaNombre: aspirant.evaluator, 
                      indiceIdoneidad: parseFloat(finalIS.toFixed(2)), 
                      zona: zone.label,
                      detalles: {
                        scores,
                        refs,
                        noConsta,
                        finalIS,
                        autoReport,
                        auditorAppreciation,
                        zone: { label: zone.label, color: zone.color, action: zone.action },
                        aspirant
                      }
                    });
                    if (res && res.error) {
                      setSaveError(res.error);
                      setGuardando(false);
                      return;
                    }
                    setGuardando(false);
                    setGuardado(true);
                  }} 
                  disabled={guardado || guardando}
                  className={`flex-[2] min-w-[200px] py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${
                    guardado 
                      ? 'bg-green-500 text-white border-2 border-green-500 shadow-lg shadow-green-500/20 cursor-default' 
                      : 'bg-[#0B1C2D] text-white hover:bg-[#1a2e3f] border-2 border-[#0B1C2D] hover:border-[#FFD400] shadow-lg shadow-[#0B1C2D]/20 disabled:opacity-75'
                  }`}
                >
                  {guardando ? (
                    <><RefreshCcw size={16} className="text-[#FFD400] animate-spin" /> Guardando...</>
                  ) : guardado ? (
                    <><CheckCircle size={16} /> Guardado Exitosamente</>
                  ) : (
                    <><Save size={16} className="text-[#FFD400]" /> Guardar</>
                  )}
                </button>
                <button onClick={resetEvaluation} className="w-full mt-6 py-5 bg-white border-2 border-red-100 text-red-600 rounded-[2rem] font-black uppercase text-xs shadow-sm flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 group">
                  <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                  Nueva evaluación de riesgo
                </button>
              </div>

              {saveError && (
                <div className="mx-2 mb-12 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold text-[11px] uppercase tracking-wide rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertTriangle size={20} className="shrink-0" />
                  {saveError}
                </div>
              )}
            </div>
          )}

        </main>

        <footer className="bg-slate-50 p-3 border-t border-slate-100 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] shrink-0">
          SISTEMA DE FILTRO ANALÓGICO COMIF • MATRIZ OBJETIVA DE RIESGOS • 2024
        </footer>
      </div>


    </div>
  );
};

export default App;

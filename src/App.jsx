import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck, FileText, AlertTriangle, CheckCircle, TrendingUp, ShieldCheck,
  Printer, ChevronRight, ChevronLeft, Search, Users, ArrowRight, BrainCircuit,
  FileDown, RefreshCcw, Plus, Trash2, XCircle, Undo2, MessageSquareQuote,
  Building2, Phone, Briefcase, MapPin
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const APP_ID = "comif-eval-2024-final-refs-integrated-v19";

const CATEGORIES = [
  { id: 'laboral',  title: 'I. Trayectoria y Estabilidad Laboral',           weight: 0.15, icon: <TrendingUp  className="w-5 h-5" /> },
  { id: 'arraigo',  title: 'II. Arraigo Comunitario y Capital Social',        weight: 0.20, icon: <Users        className="w-5 h-5" /> },
  { id: 'etico',    title: 'III. Perfil Ético-Financiero y Proyectivos',      weight: 0.40, icon: <ShieldCheck  className="w-5 h-5" /> },
  { id: 'valores',  title: 'IV. Motivación y Valores Cooperativos',           weight: 0.10, icon: <FileText     className="w-5 h-5" /> },
  { id: 'avales',   title: 'V. Relación con Avalistas y Referencias',         weight: 0.15, icon: <UserCheck    className="w-5 h-5" /> },
];

const QUESTIONS_DB = [
  { id: 1,  cat: 'laboral',  text: "1. ¿Cuánto tiempo lleva desempeñando sus responsabilidades actuales?",          refLabel: "Referencia Laboral Actual",       refType: 'empresa', options: [{ val: 1, text: "Menos de 6 meses." }, { val: 2, text: "6 meses a 1 año." }, { val: 3, text: "1 a 2 años." }, { val: 4, text: "2 a 5 años." }, { val: 5, text: "Más de 5 años." }] },
  { id: 2,  cat: 'laboral',  text: "2. ¿Cuál ha sido el periodo más largo de permanencia en una sola institución?", refLabel: "Institución de Mayor Permanencia", refType: 'empresa', options: [{ val: 1, text: "Menos de 1 año." }, { val: 2, text: "Entre 1 y 2 años." }, { val: 3, text: "Entre 2 y 3 años." }, { val: 4, text: "Entre 3 y 5 años." }, { val: 5, text: "Más de 5 años continuos." }] },
  { id: 3,  cat: 'laboral',  text: "3. ¿Qué registro de puntualidad reportaría su empleador anterior?",             refLabel: "Contacto Empleador Anterior",     refType: 'empresa', options: [{ val: 1, text: "Registros de faltas o retrasos frecuentes." }, { val: 2, text: "Incumplimientos ocasionales." }, { val: 3, text: "Horario estándar." }, { val: 4, text: "Asistencia constante." }, { val: 5, text: "Asistencia perfecta." }] },
  { id: 4,  cat: 'laboral',  text: "4. ¿Cómo cubrió sus gastos en su última transición laboral?",                                                                              options: [{ val: 1, text: "Préstamos informales." }, { val: 2, text: "Apoyo de terceros." }, { val: 3, text: "Liquidación de ley." }, { val: 4, text: "Fondo de ahorro." }, { val: 5, text: "No he tenido ceses laborales en los últimos 6 - 36 meses" }] },
  { id: 5,  cat: 'laboral',  text: "5. ¿Cuál es su meta profesional para los próximos dos años?",                                                                              options: [{ val: 1, text: "Sin planes definidos o retiro." }, { val: 2, text: "Permanencia en el cargo." }, { val: 3, text: "Ascenso jerárquico." }, { val: 4, text: "Especialización técnica." }, { val: 5, text: "Alta responsabilidad/Liderazgo." }] },
  { id: 6,  cat: 'laboral',  text: "6. Resolución ante un dilema de integridad laboral previo:",                                                                               options: [{ val: 1, text: "No identifica situación." }, { val: 2, text: "Evitó el conflicto." }, { val: 3, text: "Reportó a supervisión." }, { val: 4, text: "Negativa directa a irregularidad." }, { val: 5, text: "Uso de canales de cumplimiento." }] },
  { id: 7,  cat: 'arraigo',  text: "7. ¿Años de residencia en su domicilio actual?",                                refLabel: "Dirección de Residencia",         refType: 'texto',   options: [{ val: 1, text: "Menos de 1 año." }, { val: 2, text: "Entre 1 y 3 años." }, { val: 3, text: "Entre 3 y 5 años." }, { val: 4, text: "Entre 5 y 10 años." }, { val: 5, text: "Más de 10 años." }] },
  { id: 8,  cat: 'arraigo',  text: "8. Nivel de participación en organizaciones locales:",                          refLabel: "Entidad Comunitaria",             refType: 'empresa', options: [{ val: 1, text: "Ninguna participación." }, { val: 2, text: "Asistente ocasional." }, { val: 3, text: "Miembro con aportes." }, { val: 4, text: "Asistente recurrente." }, { val: 5, text: "Líder o directivo." }] },
  { id: 9,  cat: 'arraigo',  text: "9. Referencias de buen nombre en su comunidad inmediata:",                      refLabel: "Vecino de Referencia",            refType: 'contacto', isMultiple: true, options: [{ val: 1, text: "Sin trato con vecinos." }, { val: 2, text: "Un conocido superficial." }, { val: 3, text: "Trato cordial estándar." }, { val: 4, text: "Líderes locales lo conocen." }, { val: 5, text: "Reconocido como íntegro." }] },
  { id: 10, cat: 'arraigo',  text: "10. Colaboración en proyectos de bienestar del barrio:",                                                                                   options: [{ val: 1, text: "Nunca ha colaborado." }, { val: 2, text: "Por requerimiento social." }, { val: 3, text: "Actividad puntual." }, { val: 4, text: "Ayudó a organizar." }, { val: 5, text: "Impulsor activo constante." }] },
  { id: 11, cat: 'arraigo',  text: "11. Red de apoyo local ante emergencias personales:",                           refLabel: "Apoyo Local Principal",           refType: 'contacto', isMultiple: true, options: [{ val: 1, text: "Sin red local." }, { val: 2, text: "Conocido lejano." }, { val: 3, text: "Vecino de confianza." }, { val: 4, text: "Varios vecinos." }, { val: 5, text: "Red sólida consolidada." }] },
  { id: 12, cat: 'arraigo',  text: "12. Percepción vecinal sobre cumplimiento de compromisos:",                                                                                 options: [{ val: 1, text: "Evasivo." }, { val: 2, text: "Posterga favores." }, { val: 3, text: "Puntual básico." }, { val: 4, text: "Confiable." }, { val: 5, text: "Referente de honor." }] },
  { id: 13, cat: 'etico',    text: "13. Significado de 'palabra de honor' en acuerdos:",                                                                                       options: [{ val: 1, text: "Secundario." }, { val: 2, text: "Flexible." }, { val: 3, text: "Formalidad." }, { val: 4, text: "Valor esencial." }, { val: 5, text: "Innegociable." }] },
  { id: 14, cat: 'etico',    text: "14. Gestión de préstamo familiar frente a ahorro:",                                                                                        options: [{ val: 1, text: "Ignora la meta." }, { val: 2, text: "Rompe ahorro parcial." }, { val: 3, text: "Ayuda sin tocar ahorro." }, { val: 4, text: "Apoyo no financiero." }, { val: 5, text: "Ahorro inamovible." }] },
  { id: 15, cat: 'etico',    text: "15. Herramienta para organizar y registrar sus pagos:",                                                                                    options: [{ val: 1, text: "Ninguna." }, { val: 2, text: "Uso de memoria." }, { val: 3, text: "Notas informales." }, { val: 4, text: "Agenda dedicada." }, { val: 5, text: "Libro contable manual." }] },
  { id: 16, cat: 'etico',    text: "16. Orden de prioridad al recibir ingresos mensuales:",                                                                                    options: [{ val: 1, text: "Recreación." }, { val: 2, text: "Sin orden fijo." }, { val: 3, text: "Básicos primero." }, { val: 4, text: "Deudas y ahorro." }, { val: 5, text: "Prioridad absoluta de deuda." }] },
  { id: 17, cat: 'etico',    text: "17. Razón principal percibida para el impago de deudas:",                                                                                  options: [{ val: 1, text: "Mala suerte." }, { val: 2, text: "Emergencias." }, { val: 3, text: "Mala administración." }, { val: 4, text: "Falta de carácter." }, { val: 5, text: "Ausencia de honor." }] },
  { id: 18, cat: 'etico',    text: "18. Sacrificio de gasto de lujo para cumplir compromiso previo:",                                                                          options: [{ val: 1, text: "No lo hace." }, { val: 2, text: "Presión externa." }, { val: 3, text: "Sacrificio menor." }, { val: 4, text: "Postergó compras." }, { val: 5, text: "Deuda antes que lujo." }] },
  { id: 19, cat: 'etico',    text: "19. Estado emocional ante una deuda pendiente:",                                                                                           options: [{ val: 1, text: "Indiferencia." }, { val: 2, text: "Incomodidad leve." }, { val: 3, text: "Preocupación normal." }, { val: 4, text: "Urgencia de liberación." }, { val: 5, text: "Inquietud ética profunda." }] },
  { id: 20, cat: 'etico',    text: "20. Diferencia entre 'necesidad' y 'deseo' al pedir crédito:",                                                                             options: [{ val: 1, text: "No identifica diferencia." }, { val: 2, text: "Confunde estatus." }, { val: 3, text: "Diferencia básica." }, { val: 4, text: "Análisis de utilidad." }, { val: 5, text: "Inversión/Emergencia." }] },
  { id: 21, cat: 'etico',    text: "21. Plan de acción ante disminución de ingresos:",                                                                                         options: [{ val: 1, text: "Suspensión de pagos." }, { val: 2, text: "Nuevos créditos." }, { val: 3, text: "Renegociación." }, { val: 4, text: "Venta activos." }, { val: 5, text: "Ajuste radical deuda." }] },
  { id: 22, cat: 'etico',    text: "22. Resolución de desacuerdo previo sobre un pago:",                                                                                       options: [{ val: 1, text: "Evitó/Conflicto." }, { val: 2, text: "Resentimiento." }, { val: 3, text: "Acuerdo básico." }, { val: 4, text: "Mediación." }, { val: 5, text: "Formal/Transparente." }] },
  { id: 23, cat: 'valores',  text: "23. Motivo para elegir cooperativa sobre banco:",                                                                                          options: [{ val: 1, text: "Sin acceso banca." }, { val: 2, text: "Tasas bajas." }, { val: 3, text: "Cercanía física." }, { val: 4, text: "Confianza socios." }, { val: 5, text: "Ayuda mutua/Social." }] },
  { id: 24, cat: 'valores',  text: "24. Aporte a la masa social más allá de lo económico:",                                                                                   options: [{ val: 1, text: "Ningún aporte." }, { val: 2, text: "Esporádico." }, { val: 3, text: "Obligatorio." }, { val: 4, text: "Colaboración comités." }, { val: 5, text: "Liderazgo activo." }] },
  { id: 25, cat: 'valores',  text: "25. Compromiso de asistencia a asambleas generales:",                                                                                      options: [{ val: 1, text: "No tiene intención." }, { val: 2, text: "Por obligatoriedad." }, { val: 3, text: "Cumplir estatutos." }, { val: 4, text: "Toma decisiones." }, { val: 5, text: "Participación física activa." }] },
  { id: 26, cat: 'valores',  text: "26. Importancia del pago puntual del colectivo:",                                                                                          options: [{ val: 1, text: "Evitar quiebra." }, { val: 2, text: "Es la regla." }, { val: 3, text: "Costos externos." }, { val: 4, text: "Dinero vecinos." }, { val: 5, text: "Respeto confianza mutua." }] },
  { id: 27, cat: 'avales',   text: "27. Tiempo de relación con avalistas actuales?",                                refLabel: "Socio Avalista Principal",        refType: 'contacto', isMultiple: true, options: [{ val: 1, text: "Menos de 1 año." }, { val: 2, text: "Entre 1 y 3 años." }, { val: 3, text: "Entre 3 y 5 años." }, { val: 4, text: "Entre 5 y 10 años." }, { val: 5, text: "Más de 10 años." }] },
  { id: 28, cat: 'avales',   text: "28. Razón percibida del aval otorgado:",                                                                                                   options: [{ val: 1, text: "Amistad/Favor." }, { val: 2, text: "Necesidad aspirante." }, { val: 3, text: "Trayectoria laboral." }, { val: 4, text: "Responsabilidad." }, { val: 5, text: "Honorabilidad probada." }] },
  { id: 29, cat: 'avales',   text: "29. Efecto de un retraso de pago en relación con avalista:",                                                                               options: [{ val: 1, text: "Mínimo percibido." }, { val: 2, text: "Molestia temporal." }, { val: 3, text: "Daño confianza." }, { val: 4, text: "Vergüenza personal." }, { val: 5, text: "Traición al honor." }] },
  { id: 30, cat: 'avales',   text: "30. Referencia de puntualidad de avalistas anteriores:",                        refLabel: "Avalista",                        refType: 'contacto', options: [{ val: 1, text: "Temor registros negativos." }, { val: 2, text: "Uso recordatorios." }, { val: 3, text: "Margen estándar." }, { val: 4, text: "Constante/Puntual." }, { val: 5, text: "Referencia ejemplar." }] },
];

const App = () => {
  const [step, setStep] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [aspirant, setAspirant] = useState({
    name: '', id: '', evaluator: '', date: new Date().toLocaleDateString('es-ES')
  });
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
      setAutoReport(report);
    }
  }, [step, finalIS, categoryScores, zone.action, refs, aspirant.name, noConsta]);

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

  const exportToPDF = async () => {
    const element = document.getElementById('printable-acta');
    // Save original styles to restore them later
    const originalStyle = element.style.cssText;
    
    // Force some styles for the capture
    element.style.width = '210mm';
    element.style.minHeight = '297mm';
    element.style.margin = '0';
    element.style.padding = '15mm';
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    const canvas = await html2canvas(element, {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    // Restore original styles
    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Handle multi-page if necessary
    let heightLeft = imgHeight;
    let position = 0;
    const pageHeight = 297;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Acta_Resolucion_${aspirant.name.replace(/ /g, '_') || 'Nuevo'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 font-sans text-slate-900 flex flex-col">
      <div className="max-w-5xl mx-auto w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header */}
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-4 border-blue-600 shrink-0">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Cooperativa COMIF</h1>
            <p className="text-blue-400 font-mono text-[9px] tracking-[0.1em] uppercase">
              Control de Riesgos de Morosidad • v19.0
            </p>
          </div>
          <ShieldCheck className="text-blue-400" size={18} />
        </header>

        {/* Progress bar */}
        <div className="bg-slate-200 h-1 w-full shrink-0">
          <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <main className="p-4 md:p-6 flex-1 overflow-y-auto">

          {/* STEP 0 — Datos aspirante */}
          {step === 0 && (
            <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Expediente de Admisión</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Matriz de Inteligencia Social</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-4 shadow-inner">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Aspirante</label>
                  <input type="text" value={aspirant.name}
                    onChange={e => setAspirant({ ...aspirant, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
                    placeholder="NOMBRE COMPLETO" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">ID/Cédula</label>
                    <input type="text" value={aspirant.id}
                      onChange={e => setAspirant({ ...aspirant, id: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 font-mono text-sm outline-none"
                      placeholder="NÚMERO" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fecha</label>
                    <input type="text" value={aspirant.date}
                      onChange={e => setAspirant({ ...aspirant, date: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Auditor</label>
                  <input type="text" value={aspirant.evaluator}
                    onChange={e => setAspirant({ ...aspirant, evaluator: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none"
                    placeholder="FIRMA EVALUADOR" />
                </div>
              </div>
              <button disabled={!aspirant.name} onClick={() => setStep(1)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm flex justify-center items-center gap-3 active:scale-95 disabled:opacity-50 transition-all shadow-lg">
                COMENZAR ENTREVISTA <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 1 — Cuestionario */}
          {step === 1 && (
            <div className="space-y-4 h-full flex flex-col animate-in slide-in-from-right duration-300">
              {/* Categoría actual */}
              <div className="flex items-center gap-3 bg-slate-900 text-white p-3 rounded-2xl shrink-0 shadow-lg">
                <div className="p-2 bg-blue-600 rounded-xl">{currentCategory.icon}</div>
                <h3 className="text-[11px] font-black uppercase tracking-tight">{currentCategory.title}</h3>
                <div className="ml-auto font-mono text-[10px] opacity-60">{currentQIndex + 1}/30</div>
              </div>

              <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-4 flex-1 flex flex-col justify-center gap-4">
                <div className="space-y-3">
                  <p className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{currentQuestion.text}</p>

                  {/* Panel de referencia */}
                  {currentQuestion.refLabel && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                          <FileText size={12} /> {currentQuestion.refLabel}
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
                                <div key={idx} className="relative bg-white/50 p-3 rounded-xl border border-blue-100/50">
                                  {refs[currentQuestion.id].length > 1 && (
                                    <button onClick={() => removeRef(currentQuestion.id, idx)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform">
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                  <div className="grid grid-cols-3 gap-2">
                                    <input placeholder="Nombre"   className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={item.nombre}   onChange={e => updateRefField(currentQuestion.id, 'nombre',   e.target.value, idx)} />
                                    <input placeholder="Relación" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={item.relacion} onChange={e => updateRefField(currentQuestion.id, 'relacion', e.target.value, idx)} />
                                    <input placeholder="Teléfono" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={item.telefono} onChange={e => updateRefField(currentQuestion.id, 'telefono', e.target.value, idx)} />
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => addRef(currentQuestion.id)}
                                className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors">
                                <Plus size={14} /> Añadir otro contacto
                              </button>
                            </div>
                          ) : (
                            <>
                              {currentQuestion.refType === 'empresa' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <input placeholder="Empresa"  className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].empresa}   onChange={e => updateRefField(currentQuestion.id, 'empresa',   e.target.value)} />
                                  <input placeholder="Contacto" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].contacto}  onChange={e => updateRefField(currentQuestion.id, 'contacto',  e.target.value)} />
                                  <input placeholder="Cargo"    className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].cargo}     onChange={e => updateRefField(currentQuestion.id, 'cargo',     e.target.value)} />
                                  <input placeholder="Teléfono" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].telefono}  onChange={e => updateRefField(currentQuestion.id, 'telefono',  e.target.value)} />
                                </div>
                              )}
                              {currentQuestion.refType === 'contacto' && (
                                <div className="grid grid-cols-3 gap-2">
                                  <input placeholder="Nombre"   className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].nombre}   onChange={e => updateRefField(currentQuestion.id, 'nombre',   e.target.value)} />
                                  <input placeholder="Relación" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].relacion} onChange={e => updateRefField(currentQuestion.id, 'relacion', e.target.value)} />
                                  <input placeholder="Teléfono" className="p-2 rounded-lg border text-xs focus:ring-2 focus:ring-blue-400 outline-none" value={refs[currentQuestion.id].telefono} onChange={e => updateRefField(currentQuestion.id, 'telefono', e.target.value)} />
                                </div>
                              )}
                              {currentQuestion.refType === 'texto' && (
                                <textarea
                                  value={refs[currentQuestion.id] || ''}
                                  onChange={e => updateRefField(currentQuestion.id, null, e.target.value)}
                                  className="w-full p-3 rounded-xl bg-white border border-blue-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px] resize-none"
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
                      className={`text-left p-3 rounded-xl text-xs font-semibold border flex items-center gap-3 transition-all ${scores[currentQuestion.id] === opt.val ? 'bg-blue-600 border-blue-600 text-white scale-[1.02] shadow-md z-10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-200'}`}>
                      <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-black text-[10px] border ${scores[currentQuestion.id] === opt.val ? 'border-white text-white' : 'border-slate-300 text-slate-400'}`}>
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
                    <div key={c.id} className={`w-2 h-2 rounded-full transition-all ${currentCategory.id === c.id ? 'bg-blue-600 scale-125' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <button disabled={!canAdvance} onClick={handleNext}
                  className={`py-3 px-6 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 transition-all ${canAdvance ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}>
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
                <div className="flex-1 bg-slate-900 rounded-[2rem] p-6 text-white text-center shadow-xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Idoneidad Social (IS)</p>
                  <p className="text-7xl font-black text-blue-400 tabular-nums">{finalIS.toFixed(2)}</p>
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
                        <div className="h-full bg-slate-800 transition-all duration-1000" style={{ width: `${(categoryScores[cat.id] / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis técnico auto-generado */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Análisis de Riesgo Técnico (Factual):</label>
                <textarea value={autoReport} onChange={e => setAutoReport(e.target.value)} rows={8}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl p-6 text-slate-700 text-[11px] font-medium leading-relaxed outline-none focus:border-blue-600 shadow-inner" />
              </div>

              {/* Apreciación del auditor */}
              <div className="space-y-2 bg-blue-50/50 p-6 rounded-[2.5rem] border-2 border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-6 opacity-5"><MessageSquareQuote size={60} /></div>
                <label className="text-[10px] font-black uppercase text-blue-700 ml-1 flex items-center gap-2">
                  <UserCheck size={14} /> Apreciación General del Auditor (Obligatorio)
                </label>
                <textarea value={auditorAppreciation} onChange={e => setAuditorAppreciation(e.target.value)} rows={6}
                  placeholder="Redacte aquí sus conclusiones subjetivas, observaciones de conducta o motivos específicos de la recomendación..."
                  className="w-full bg-white border-2 border-blue-200 rounded-2xl p-5 text-slate-800 text-sm font-semibold leading-relaxed outline-none focus:ring-4 focus:ring-blue-100 transition-all" />
                {!auditorAppreciation.trim() && (
                  <p className="text-[9px] font-black text-red-500 mt-2 animate-pulse uppercase tracking-widest text-right">
                    *** Debe completar este apartado para consolidar el acta ***
                  </p>
                )}
              </div>

              <button disabled={!auditorAppreciation.trim()} onClick={() => setStep(3)}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex justify-center items-center gap-2 transition-all ${auditorAppreciation.trim() ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                CONSOLIDAR ACTA OFICIAL <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 3 — Acta final */}
          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <div id="printable-acta" className="bg-white p-6 md:p-8 text-slate-900 font-serif leading-tight" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
                <div className="space-y-4">
                  {/* Header Institucional */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                    <div className="space-y-0.5">
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">COMIF, R.L.</h2>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">Cooperativa de Ahorro y Crédito Integral</p>
                      <p className="text-[8px] font-medium text-slate-400 italic">"Al servicio de nuestra comunidad"</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="bg-slate-900 text-white px-3 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-sm">
                        Acta de Resolución
                      </div>
                      <p className="font-mono text-[8px] uppercase font-bold pt-1">EXP: {aspirant.id || '---'}</p>
                      <p className="font-mono text-[8px] uppercase font-bold">FECHA: {aspirant.date}</p>
                    </div>
                  </div>

                  {/* Título Principal */}
                  <div className="text-center py-2">
                    <h3 className="text-lg font-black uppercase underline underline-offset-4 decoration-2 tracking-widest">Resolución de Ingreso y Admisión</h3>
                  </div>

                  {/* Datos del Aspirante */}
                  <section className="space-y-1">
                    <h5 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-2">
                      <UserCheck size={12} className="text-slate-500" /> I. Información del Aspirante
                    </h5>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-sm border border-slate-100">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400">Nombre Completo</p>
                        <p className="text-xs font-bold uppercase">{aspirant.name || '---'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-slate-400">Resultado de Idoneidad (IS)</p>
                        <p className="text-xl font-black text-slate-900">{finalIS.toFixed(2)} / 5.00</p>
                      </div>
                    </div>
                  </section>

                  {/* Considerandos Técnicos */}
                  <section className="space-y-1">
                    <h5 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-2">
                      <BrainCircuit size={12} className="text-slate-500" /> II. Considerandos Técnicos y Análisis de Riesgo
                    </h5>
                    <div className="text-[9px] space-y-2 text-justify leading-snug">
                      <p>
                        Tras la aplicación de la Matriz de Inteligencia Social v19.0, se ha evaluado el perfil del aspirante considerando su trayectoria laboral, arraigo comunitario, perfil ético-financiero y relación con avalistas.
                      </p>
                      <div className="bg-slate-50 border-l-4 border-slate-900 p-3 font-bold text-slate-800 italic">
                        {autoReport.split('DILIGENCIA DE DATOS RECOPILADOS:')[0].replace('ANÁLISIS DE RIESGO OBJETIVO:', '').trim()}
                      </div>
                    </div>
                  </section>

                  {/* Diligencias de Campo */}
                  <section className="space-y-1">
                    <h5 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-2">
                      <Briefcase size={12} className="text-slate-500" /> III. Diligencia de Datos y Referencias Verificadas
                    </h5>
                    <div className="overflow-hidden border border-slate-200 rounded-sm">
                      <table className="w-full text-[8px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 uppercase font-black text-slate-600">
                            <th className="p-1.5 border-b border-slate-200">Tipo de Referencia / Entidad</th>
                            <th className="p-1.5 border-b border-slate-200">Detalles de Contacto</th>
                            <th className="p-1.5 border-b border-slate-200">Información Adicional</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {QUESTIONS_DB.filter(q => q.refLabel).map(q => {
                            const data = refs[q.id];
                            const isNoConsta = noConsta[q.id];
                            if (isNoConsta) return (
                              <tr key={q.id} style={{ pageBreakInside: 'avoid' }}>
                                <td className="p-1 font-bold uppercase">{q.refLabel}</td>
                                <td colSpan="2" className="p-1 text-red-500 italic">No consta / Información no disponible</td>
                              </tr>
                            );
                            
                            const formatData = (item) => {
                              if (q.refType === 'empresa') return {
                                main: item.empresa || '---',
                                contact: `${item.contacto || '---'} (${item.cargo || '---'})`,
                                tel: item.telefono || '---'
                              };
                              if (q.refType === 'contacto') return {
                                main: item.nombre || '---',
                                contact: `Relación: ${item.relacion || '---'}`,
                                tel: item.telefono || '---'
                              };
                              return { main: item || '---', contact: '---', tel: '---' };
                            };

                            const items = Array.isArray(data) ? data : [data];
                            return items.map((item, idx) => {
                              const info = formatData(item);
                              return (
                                <tr key={`${q.id}-${idx}`} style={{ pageBreakInside: 'avoid' }}>
                                  <td className="p-1 font-bold uppercase">{idx === 0 ? q.refLabel : ''} {Array.isArray(data) ? `[Ref ${idx+1}]` : ''}</td>
                                  <td className="p-1">
                                    <div className="font-bold">{info.main}</div>
                                    <div className="text-slate-500">{info.contact}</div>
                                  </td>
                                  <td className="p-1">
                                    <div className="flex items-center gap-1 font-mono"><Phone size={7} /> {info.tel}</div>
                                  </td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-[8px] font-bold text-slate-600 italic">
                      {autoReport.split('CONCLUSIÓN TÉCNICA:')[1] ? `CONCLUSIÓN TÉCNICA: ${autoReport.split('CONCLUSIÓN TÉCNICA:')[1].trim()}` : ''}
                    </div>
                  </section>

                  {/* Apreciación del Auditor */}
                  <section className="space-y-1">
                    <h5 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-2">
                      <MessageSquareQuote size={12} className="text-slate-500" /> IV. Apreciación General del Auditor
                    </h5>
                    <div className="p-3 bg-slate-50 border border-slate-100 text-[10px] font-medium italic text-slate-800 leading-snug min-h-[60px]">
                      {auditorAppreciation || 'Sin observaciones adicionales registradas.'}
                    </div>
                  </section>

                  {/* Dictamen Final */}
                  <section className="pt-2">
                    <div className="border-2 border-slate-900 p-3 text-center space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Dictamen Final de Admisión</p>
                      <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">{zone.label}</h4>
                      <div className="h-0.5 w-16 bg-slate-900 mx-auto mt-1"></div>
                      <p className="text-[9px] font-bold uppercase pt-1 italic text-slate-600 leading-none">{zone.action}</p>
                    </div>
                  </section>

                  {/* Firmas */}
                  <div className="pt-10 grid grid-cols-2 gap-16 text-center">
                    <div className="space-y-1">
                      <div className="border-t border-slate-900 pt-1">
                        <p className="font-black uppercase text-[9px] tracking-widest">{aspirant.evaluator || 'Firma Auditor'}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase">Analista de Riesgos</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="border-t border-slate-900 pt-1">
                        <p className="font-black uppercase text-[9px] tracking-widest">Sello / Comité de Riesgos</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase">Dirección de Admisiones</p>
                      </div>
                    </div>
                  </div>

                  {/* Pie de página del Acta */}
                  <div className="pt-4 text-center">
                    <p className="text-[6px] text-slate-400 font-bold uppercase tracking-[0.4em]">Este documento es confidencial y propiedad exclusiva de COMIF, R.L. • v19.0</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pb-12 px-2">
                <button onClick={() => setStep(2)} className="flex-1 min-w-[120px] py-4 text-slate-400 font-black uppercase text-[10px] hover:bg-white rounded-2xl border-2 border-slate-100 transition-all">
                  Editar Informe
                </button>
                <button onClick={exportToPDF} className="flex-1 min-w-[180px] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                  <FileDown size={16} /> Guardar PDF
                </button>
                <button onClick={() => window.print()} className="flex-1 min-w-[160px] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all">
                  <Printer size={16} /> Imprimir Acta
                </button>
                <button onClick={resetEvaluation} className="w-full mt-6 py-5 bg-white border-2 border-red-100 text-red-600 rounded-[2rem] font-black uppercase text-xs shadow-sm flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 group">
                  <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                  Nueva evaluación de riesgo
                </button>
              </div>
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

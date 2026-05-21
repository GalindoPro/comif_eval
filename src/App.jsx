import { useState, useMemo, useEffect } from 'react';
import {
  UserCheck, FileText, AlertTriangle, CheckCircle, TrendingUp, ShieldCheck,
  Printer, ChevronRight, ChevronLeft, Search, Users, ArrowRight, BrainCircuit,
  RefreshCcw, Plus, Trash2, XCircle, Undo2, MessageSquareQuote,
  Phone, Briefcase
} from 'lucide-react';

const CATEGORIES = [
  { id: 'laboral',  title: 'I. Trayectoria y Estabilidad Laboral',           weight: 0.15, icon: <TrendingUp  className="w-5 h-5" /> },
  { id: 'arraigo',  title: 'II. Arraigo Comunitario y Capital Social',        weight: 0.20, icon: <Users        className="w-5 h-5" /> },
  { id: 'etico',    title: 'III. Perfil Ético-Financiero y Proyectivos',      weight: 0.40, icon: <ShieldCheck  className="w-5 h-5" /> },
  { id: 'valores',  title: 'IV. Motivación y Valores Cooperativos',           weight: 0.10, icon: <FileText     className="w-5 h-5" /> },
  { id: 'avales',   title: 'V. Relación con Avalistas y Referencias',         weight: 0.15, icon: <UserCheck    className="w-5 h-5" /> },
];

const QUESTIONS_DB = [
  // I. TRAYECTORIA Y ESTABILIDAD LABORAL
  { id: 1, cat: 'laboral', text: "1. ¿Cuánto tiempo lleva con su negocio propio, siembra o en su empleo actual?", refLabel: "Referencia de Actividad Laboral", refType: 'empresa', options: [{ val: 1, text: "Menos de 6 meses." }, { val: 2, text: "De 6 meses a un año." }, { val: 3, text: "De 1 a 2 años." }, { val: 4, text: "De 2 a 5 años." }, { val: 5, text: "Más de 5 años estables." }] },
  { id: 2, cat: 'laboral', text: "2. ¿Cuál ha sido el tiempo más largo que ha mantenido el mismo negocio o puesto de trabajo?", refLabel: "Historial de Mayor Permanencia", refType: 'empresa', options: [{ val: 1, text: "Menos de un año." }, { val: 2, text: "Entre 1 y 2 años." }, { val: 3, text: "Entre 2 y 3 años." }, { val: 4, text: "Entre 3 y 5 años." }, { val: 5, text: "Más de 5 años seguidos." }] },
  { id: 3, cat: 'laboral', text: "3. Con sus proveedores, clientes o jefes anteriores, ¿cómo ha sido su cumplimiento?", refLabel: "Contacto Comercial / Empleador Anterior", refType: 'empresa', options: [{ val: 1, text: "Ha tenido problemas o atrasos seguidos." }, { val: 2, text: "A veces se atrasa u olvida compromisos." }, { val: 3, text: "Cumplimiento normal, a tiempo." }, { val: 4, text: "Muy formal y puntual en sus tratos." }, { val: 5, text: "Excelente recomendación, intachable." }] },
  { id: 4, cat: 'laboral', text: "4. Cuando las ventas bajan o cambia de actividad, ¿cómo cubre sus gastos familiares?", options: [{ val: 1, text: "Prestamistas de la calle / Diarios." }, { val: 2, text: "Ayuda o remesas de familiares." }, { val: 3, text: "Ahorros guardados en casa o alcancía." }, { val: 4, text: "Fondos de reserva o mercadería guardada." }, { val: 5, text: "Tiene otra entrada de dinero fija." }] },
  { id: 5, cat: 'laboral', text: "5. ¿Qué planes tiene para su negocio, siembra o trabajo en los próximos dos años?", options: [{ val: 1, text: "No tiene planes fijos o piensa dejarlo." }, { val: 2, text: "Mantenerlo tal como está ahorita." }, { val: 3, text: "Agrandar el negocio o surtir más mercadería." }, { val: 4, text: "Diversificar o abrir otra sucursal en la región." }, { val: 5, text: "Dejar el negocio herencia/estructura sólida." }] },
  { id: 6, cat: 'laboral', text: "6. Si ha tenido un problema de dinero o mercadería en su trabajo anterior o negocio, ¿cómo lo resolvió?", options: [{ val: 1, text: "No aclara o prefiere no responder." }, { val: 2, text: "Dejó que el problema se enfriara solo." }, { val: 3, text: "Habló de frente y buscó un convenio." }, { val: 4, text: "Asumió la pérdida y pagó de inmediato." }, { val: 5, text: "Buscó mediación legal o comunitaria justa." }] },

  // II. ARRAIGO COMUNITARIO Y CAPITAL SOCIAL
  { id: 7, cat: 'arraigo', text: "7. ¿Cuántos años lleva de vivir en la misma comunidad, barrio o cantón?", refLabel: "Dirección Exacta de Residencia", refType: 'texto', options: [{ val: 1, text: "Menos de un año (está alquilando o recién llegado)." }, { val: 2, text: "De 1 a 3 años." }, { val: 3, text: "De 3 a 5 años." }, { val: 4, text: "De 5 a 10 años en el sector." }, { val: 5, text: "Más de 10 años o la casa es propia/familiar." }] },
  { id: 8, cat: 'arraigo', text: "8. ¿Participa en el Cocode, comités de la iglesia, feria u otra organización local?", refLabel: "Entidad o Comité Comunitario", refType: 'empresa', options: [{ val: 1, text: "No participa en nada de la comunidad." }, { val: 2, text: "Asiste solo cuando lo obligan o convocan." }, { val: 3, text: "Apoya con la cuota o colaboración básica." }, { val: 4, text: "Asiste seguido y ayuda a organizar actividades." }, { val: 5, text: "Es líder, directivo o muy activo en el grupo." }] },
  { id: 9, cat: 'arraigo', text: "9. ¿Qué opinan los vecinos cercanos sobre la honorabilidad de su familia?", refLabel: "Vecino de Referencia de la Comunidad", refType: 'contacto', isMultiple: true, options: [{ val: 1, text: "Casi no le hablan a la vecindad." }, { val: 2, text: "Los conocen poco o superficialmente." }, { val: 3, text: "Trato cordial y educado con todos." }, { val: 4, text: "Familia muy respetada en el sector." }, { val: 5, text: "Son referentes de confianza y buena conducta." }] },
  { id: 10, cat: 'arraigo', text: "10. Cuando la comunidad organiza trabajos colectivos para mejorar el agua o las calles, ¿usted suele participar o ayudar?", options: [{ val: 1, text: "Nunca colabora ni asiste." }, { val: 2, text: "Solo si le toca pagar multa por faltar." }, { val: 3, text: "Colabora con el trabajo o el dinero que piden." }, { val: 4, text: "Ayuda a coordinar con los vecinos." }, { val: 5, text: "Es de los que impulsa los proyectos del barrio." }] },
  { id: 11, cat: 'arraigo', text: "11. Si tuviera una emergencia familiar grave en la noche, ¿con qué vecinos cuenta para apoyarse?", refLabel: "Contacto de Apoyo Comunitario Vecinal", refType: 'contacto', isMultiple: true, options: [{ val: 1, text: "No tiene a nadie cerca que lo auxilie." }, { val: 2, text: "Tal vez algún conocido lejano." }, { val: 3, text: "Cuenta con un vecino de total confianza." }, { val: 4, text: "Varios vecinos se solidarizan rápido." }, { val: 5, text: "Tiene una red comunitaria muy unida." }] },
  { id: 12, cat: 'arraigo', text: "12. En los negocios o favores del vecindario, ¿cómo lo miran los demás?", options: [{ val: 1, text: "Mala paga o esquivo con los favores." }, { val: 2, text: "Le cuesta cumplir o se tarda mucho." }, { val: 3, text: "Cumplidor con lo básico." }, { val: 4, text: "Es muy cabal y de palabra." }, { val: 5, text: "Un ejemplo de rectitud en todo el cantón." }] },

  // III. PERFIL ÉTICO-FINANCIERO Y PROYECTIVOS
  { id: 13, cat: 'etico', text: "13. Para usted, ¿qué valor tiene empeñar la palabra en un trato de palabra?", options: [{ val: 1, text: "Se la lleva el viento si las cosas cambian." }, { val: 2, text: "Es flexible si hay una buena excusa." }, { val: 3, text: "Vale, pero es mejor tener un papel firmado." }, { val: 4, text: "Es un compromiso moral muy serio." }, { val: 5, text: "La palabra es sagrada, se cumple pase lo que pase." }] },
  { id: 14, cat: 'etico', text: "14. Si un familiar le pide dinero prestado de urgencia, ¿qué hace usted?", options: [{ val: 1, text: "Saca el dinero sin pensar en sus propios pagos." }, { val: 2, text: "Usa parte de sus ahorros aunque se descomplete." }, { val: 3, text: "Le ayuda buscando otra solución sin tocar sus reservas." }, { val: 4, text: "Apoya con trabajo o víveres, pero no con dinero." }, { val: 5, text: "Explica con respeto que su ahorro no se toca." }] },
  { id: 15, cat: 'etico', text: "15. ¿Cómo lleva el control de lo que vende, gasta o debe pagar cada mes?", options: [{ val: 1, text: "No lleva ningún control." }, { val: 2, text: "Todo lo calcula al tanteo y de memoria." }, { val: 3, text: "Apunta las cosas en papeles sueltos o calendario." }, { val: 4, text: "Usa un cuaderno o libreta dedicada solo a eso." }, { val: 5, text: "Lleva un libro de cuentas bien ordenado al día." }] },
  { id: 16, cat: 'etico', text: "16. Cuando recibe su dinero o las ganancias de la cosecha/venta, ¿qué paga primero?", options: [{ val: 1, text: "Los gustos de la familia o gastos del día." }, { val: 2, text: "Lo que vaya saliendo primero sin orden." }, { val: 3, text: "La comida y los servicios de la casa." }, { val: 4, text: "Separa lo del gasto y de una vez lo de sus deudas." }, { val: 5, text: "Pagar sus deudas es lo primerito, antes que todo." }] },
  { id: 17, cat: 'etico', text: "17. A su criterio, ¿por qué cree que la gente a veces no paga sus créditos?", options: [{ val: 1, text: "Por mala suerte o el destino." }, { val: 2, text: "Porque se les meten emergencias imprevistas." }, { val: 3, text: "Por mala administración del dinero." }, { val: 4, text: "Por descuido o falta de voluntad." }, { val: 5, text: "Por falta de vergüenza y de principios." }] },
  { id: 18, cat: 'etico', text: "18. ¿Alguna vez ha dejado de asistir a una fiesta o reunión familiar porque necesitaba ahorrar dinero para pagar su cuota?", options: [{ val: 1, text: "No, la familia y los compromisos sociales van primero." }, { val: 2, text: "Solo si me están presionando mucho para pagar." }, { val: 3, text: "A veces, trato de hacer un balance intermedio." }, { val: 4, text: "Sí, prefiero abstenerme de lujos con tal de cumplir." }, { val: 5, text: "Siempre; primero la tranquilidad de no deberle a nadie." }] },
  { id: 19, cat: 'etico', text: "19. ¿Cómo se siente usted espiritualmente o de ánimo cuando sabe que debe dinero?", options: [{ val: 1, text: "Tranquilo, es normal deber en estos tiempos." }, { val: 2, text: "Un poco incómodo, pero se le pasa." }, { val: 3, text: "Preocupado lo normal para juntar el pisto." }, { val: 4, text: "Con urgencia de pagar para quitarse esa carga." }, { val: 5, text: "No duerme tranquilo; es una pena moral profunda." }] },
  { id: 20, cat: 'etico', text: "20. Al pedir este préstamo, ¿es para una necesidad urgente o para una inversión de negocio?", options: [{ val: 1, text: "Para salir de otros compromisos y gastos diarios." }, { val: 2, text: "Para un gusto familiar o consumo." }, { val: 3, text: "Un porcentaje para el negocio y otro para consumo." }, { val: 4, text: "Para surtir o capitalizar un negocio que ya funciona." }, { val: 5, text: "Inversión directa en tierra, herramientas o activos productivos." }] },
  { id: 21, cat: 'etico', text: "21. Si las ventas bajan a la mitad por un par de meses, ¿cuál es su plan para responderle a COMIF?", options: [{ val: 1, text: "Tendría que dejar de pagar mientras se recupera." }, { val: 2, text: "Prestar en otro lado para tapar este hoyo." }, { val: 3, text: "Venir a la cooperativa a dar la cara y buscar un arreglo." }, { val: 4, text: "Vender algún animalito o herramienta del negocio." }, { val: 5, text: "Ajustar al máximo el gasto de comida y usar el fondo de reserva." }] },
  { id: 22, cat: 'etico', text: "22. Si ha tenido un malentendido con una cuenta o cobro antes, ¿cómo lo solucionó?", options: [{ val: 1, text: "Se enojó y dejó de pagar." }, { val: 2, text: "Pagó de mala gana y con resentimiento." }, { val: 3, text: "Platicó de buena manera hasta aclarar las cuentas." }, { val: 4, text: "Buscó un recibo o prueba para demostrarlo con respeto." }, { val: 5, text: "Actuó con total transparencia y educación hasta resolver." }] },

  // IV. MOTIVACIÓN Y VALORES COOPERATIVOS
  { id: 23, cat: 'valores', text: "23. ¿Por qué prefiere asociarse a la cooperativa COMIF, R.L. en lugar de ir a un banco grande?", options: [{ val: 1, text: "Porque los bancos no me prestan o piden mucho papel." }, { val: 2, text: "Por las tasas de interés o porque queda más cerca." }, { val: 3, text: "Porque aquí atienden con más confianza y amabilidad." }, { val: 4, text: "Porque conozco a otros asociados de la comunidad." }, { val: 5, text: "Por el principio de ayuda mutua; el pisto se queda en el pueblo." }] },
  { id: 24, cat: 'valores', text: "24. Además de ahorrar y prestar, ¿de qué otra forma le gustaría apoyar a la cooperativa?", options: [{ val: 1, text: "Solo vengo por el trámite, no tengo tiempo." }, { val: 2, text: "Recomendar la cooperativa con algunos conocidos." }, { val: 3, text: "Asistir a las capacitaciones que den sobre finanzas." }, { val: 4, text: "Apoyar en comisiones o actividades de beneficio social." }, { val: 5, text: "Formar parte de los comités de vigilancia o administración a futuro." }] },
  { id: 25, cat: 'valores', text: "25. ¿Está dispuesto a asistir puntualmente a las Asambleas Generales de asociados?", options: [{ val: 1, text: "No creo poder asistir por mi trabajo." }, { val: 2, text: "Solo si mandan aviso de que es obligatorio." }, { val: 3, text: "Sí, para cumplir con lo que mandan los estatutos." }, { val: 4, text: "Asistiría con gusto para enterarme de cómo van las cuentas." }, { val: 5, text: "Sí, participando activamente con propuestas y voto consciente." }] },
  { id: 26, cat: 'valores', text: "26. Si un asociado de la cooperativa se atrasa con su pago, ¿a quiénes cree que afecta?", options: [{ val: 1, text: "Afecta solo al banco o al gerente." }, { val: 2, text: "Es problema de él y sus fiadores." }, { val: 3, text: "Afecta el historial de la sucursal." }, { val: 4, text: "Se pierde el dinero que sirve para prestarle a otros vecinos." }, { val: 5, text: "Es una falta de respeto a la confianza mutua de todos los asociados." }] },

  // V. RELACIÓN CON AVALISTAS Y REFERENCIAS
  { id: 27, cat: 'avales', text: "27. ¿Cuánto tiempo hace que conoce a sus fiadores o avalistas actuales?", refLabel: "Socio Avalista / Fiador Principal", refType: 'contacto', isMultiple: true, options: [{ val: 1, text: "Menos de un año (o le cobraron por el favor)." }, { val: 2, text: "De 1 a 3 años de conocerse." }, { val: 3, text: "De 3 a 5 años de buena amistad." }, { val: 4, text: "De 5 a 10 años, vecinos de toda la vida." }, { val: 5, text: "Más de 10 años o son parientes muy rectos." }] },
  { id: 28, cat: 'avales', text: "28. ¿Por qué cree que su fiador aceptó respaldarlo firmando con usted?", options: [{ val: 1, text: "Por compromiso, no le quedó de otra." }, { val: 2, text: "Por hacerme la campaña / Favor de amistad." }, { val: 3, text: "Porque sabe que tengo un trabajo estable o siembra." }, { val: 4, text: "Porque conoce que soy una persona responsable." }, { val: 5, text: "Porque sabe que mi honorabilidad es intachable y no le voy a fallar." }] },
  { id: 29, cat: 'avales', text: "29. Si usted se atrasara en una cuota y le cobraran a su fiador, ¿cómo se sentiría?", options: [{ val: 1, text: "Para eso firmó, para respaldarme si no tengo." }, { val: 2, text: "Una molestia del momento, ya se le pasará." }, { val: 3, text: "Apenado, trataría de pagarle lo antes posible." }, { val: 4, text: "Con mucha vergüenza familiar y social." }, { val: 5, text: "Como una traición directa a la confianza y al honor de la familia." }] },
  { id: 30, cat: 'avales', text: "30. ¿Cómo es el historial de pago de sus referencias o de las personas que lo recomiendan?", refLabel: "Referencia Personal Adicional", refType: 'contacto', options: [{ val: 1, text: "Tienen mala fama o deudas vencidas." }, { val: 2, text: "A veces se atrasan pero van saliendo." }, { val: 3, text: "Récord normal, corriente." }, { val: 4, text: "Gente muy cumplida en sus propios compromisos." }, { val: 5, text: "Gente ejemplar y muy respetada en la región." }] }
];

const App = () => {
  const [step, setStep] = useState(0);
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
              <button disabled={!aspirant.name.trim() || aspirant.id.length !== 13 || !aspirant.evaluator.trim()} onClick={() => setStep(1)}
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
              <div id="printable-acta" className="bg-white p-6 text-slate-900 font-serif leading-tight border border-slate-300 shadow-lg rounded-sm flex flex-col justify-between" style={{ width: '210mm', minHeight: '277mm', margin: '0 auto', boxSizing: 'border-box' }}>
                <div className="flex-1 flex flex-col justify-between">
                  {/* Bloque Superior de Contenido */}
                  <div className="space-y-3">
                    {/* Header Institucional */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-1.5">
                      <div className="space-y-0.5">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">COMIF, R.L.</h2>
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">Cooperativa de Ahorro y Crédito Integral</p>
                        <p className="text-[8px] font-medium text-slate-400 italic">"Al servicio de nuestra comunidad"</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="bg-slate-900 text-white px-3 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-sm">
                          Acta de Resolución
                        </div>
                        <p className="font-mono text-[8px] uppercase font-bold pt-1">EXP: {aspirant.id?.replace(/(\d{4})(\d{5})(\d{4})/, '$1-$2-$3') || '---'}</p>
                        <p className="font-mono text-[8px] uppercase font-bold">FECHA: {aspirant.date}</p>
                      </div>
                    </div>

                    {/* Título Principal */}
                    <div className="text-center py-0.5">
                      <h3 className="text-base font-black uppercase underline underline-offset-4 decoration-2 tracking-widest text-[#0B1C2D]">Resolución de Ingreso y Admisión</h3>
                    </div>

                    {/* Datos del Aspirante */}
                    <section className="space-y-0.5">
                      <h5 className="text-[9px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
                        <UserCheck size={10} className="text-slate-500" /> I. Información del Aspirante
                      </h5>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-sm border border-slate-100">
                        <div>
                          <p className="text-[7.5px] font-black uppercase text-slate-400">Nombre Completo</p>
                          <p className="text-xs font-bold uppercase">{aspirant.name || '---'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7.5px] font-black uppercase text-slate-400">Resultado de Idoneidad (IS)</p>
                          <p className="text-xs font-black text-slate-900">{finalIS.toFixed(2)} / 5.00</p>
                        </div>
                      </div>
                    </section>

                    {/* Considerandos Técnicos */}
                    <section className="space-y-0.5">
                      <h5 className="text-[9px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
                        <BrainCircuit size={10} className="text-slate-500" /> II. Considerandos Técnicos y Análisis de Riesgo
                      </h5>
                      <div className="text-[8px] space-y-1 text-justify leading-relaxed">
                        <p>
                          Tras la aplicación de la Matriz de Inteligencia Social v19.0, se ha evaluado el perfil del aspirante considerando su trayectoria laboral, arraigo comunitario, perfil ético-financiero y relación con avalistas.
                        </p>
                        <div className="bg-slate-50 border-l-4 border-slate-900 p-2 font-bold text-slate-800 italic leading-snug">
                          {autoReport.split('DILIGENCIA DE DATOS RECOPILADOS:')[0].replace('ANÁLISIS DE RIESGO OBJETIVO:', '').trim()}
                        </div>
                      </div>
                    </section>

                    {/* Diligencias de Campo */}
                    <section className="space-y-0.5">
                      <h5 className="text-[9px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
                        <Briefcase size={10} className="text-slate-500" /> III. Diligencia de Datos y Referencias Verificadas
                      </h5>
                      <div className="overflow-hidden border border-slate-200 rounded-sm">
                        <table className="w-full text-[7.5px] text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 uppercase font-black text-slate-600">
                              <th className="p-1 border-b border-slate-200">Tipo de Referencia / Entidad</th>
                              <th className="p-1 border-b border-slate-200">Detalles de Contacto</th>
                              <th className="p-1 border-b border-slate-200">Información Adicional</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {QUESTIONS_DB.filter(q => q.refLabel).map(q => {
                              const data = refs[q.id];
                              const isNoConsta = noConsta[q.id];
                              if (isNoConsta) return (
                                <tr key={q.id} style={{ pageBreakInside: 'avoid' }}>
                                  <td className="p-0.5 font-bold uppercase text-[7px] leading-tight">{q.refLabel}</td>
                                  <td colSpan="2" className="p-0.5 text-red-500 italic">No consta / Información no disponible</td>
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
                                  contact: `Rel: ${item.relacion || '---'}`,
                                  tel: item.telefono || '---'
                                };
                                return { main: item || '---', contact: '---', tel: '---' };
                              };

                              const items = Array.isArray(data) ? data : [data];
                              return items.map((item, idx) => {
                                const info = formatData(item);
                                return (
                                  <tr key={`${q.id}-${idx}`} style={{ pageBreakInside: 'avoid' }}>
                                    <td className="p-0.5 font-bold uppercase text-[7px] leading-tight">{idx === 0 ? q.refLabel : ''} {Array.isArray(data) ? `[Ref ${idx+1}]` : ''}</td>
                                    <td className="p-0.5 leading-tight">
                                      <div className="font-bold">{info.main}</div>
                                      <div className="text-slate-500 text-[6.5px]">{info.contact}</div>
                                    </td>
                                    <td className="p-0.5 leading-tight">
                                      <div className="flex items-center gap-1 font-mono text-[7px]"><Phone size={6} /> {info.tel}</div>
                                    </td>
                                  </tr>
                                );
                              });
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-[7.5px] font-bold text-slate-600 italic">
                        {autoReport.split('CONCLUSIÓN TÉCNICA:')[1] ? `CONCLUSIÓN TÉCNICA: ${autoReport.split('CONCLUSIÓN TÉCNICA:')[1].trim()}` : ''}
                      </div>
                    </section>

                    {/* Apreciación del Auditor */}
                    <section className="space-y-0.5">
                      <h5 className="text-[9px] font-black uppercase tracking-widest border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
                        <MessageSquareQuote size={10} className="text-slate-500" /> IV. Apreciación General del Auditor
                      </h5>
                      <div className="p-2 bg-slate-50 border border-slate-100 text-[8.5px] font-medium italic text-slate-800 leading-normal min-h-[35px]">
                        {auditorAppreciation || 'Sin observaciones adicionales registradas.'}
                      </div>
                    </section>

                    {/* Dictamen Final */}
                    <section className="pt-1">
                      <div className="border border-slate-900 p-2 text-center space-y-0.5">
                        <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-[0.2em]">Dictamen Final de Admisión</p>
                        <h4 className="text-lg font-black uppercase tracking-tighter leading-none">{zone.label}</h4>
                        <div className="h-0.5 w-12 bg-slate-900 mx-auto mt-0.5"></div>
                        <p className="text-[8.5px] font-bold uppercase pt-0.5 italic text-slate-600 leading-none">{zone.action}</p>
                      </div>
                    </section>
                  </div>

                  {/* Bloque Inferior: Firmas y Pie de Página */}
                  <div className="pt-12 space-y-6">
                    {/* Firmas */}
                    <div className="grid grid-cols-2 gap-10 text-center">
                      <div className="space-y-0.5">
                        <div className="border-t border-slate-900 pt-2">
                          <p className="font-black uppercase text-[8.5px] tracking-widest">{aspirant.evaluator || 'Firma Auditor'}</p>
                          <p className="text-[6.5px] font-bold text-slate-400 uppercase">Analista de Riesgos</p>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="border-t border-slate-900 pt-2">
                          <p className="font-black uppercase text-[8.5px] tracking-widest">Sello / Comité de Riesgos</p>
                          <p className="text-[6.5px] font-bold text-slate-400 uppercase">Dirección de Admisiones</p>
                        </div>
                      </div>
                    </div>

                    {/* Pie de página del Acta */}
                    <div className="pt-2 text-center">
                      <p className="text-[5.5px] text-slate-400 font-bold uppercase tracking-[0.4em]">Este documento es confidencial y propiedad exclusiva de COMIF, R.L. • v19.0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pb-12 px-2 print:hidden">
                <button onClick={() => setStep(2)} className="flex-1 min-w-[120px] py-4 text-slate-400 font-black uppercase text-[10px] hover:bg-white rounded-2xl border-2 border-slate-100 hover:border-[#FFD400] hover:text-[#0B1C2D] transition-all">
                  Editar Informe
                </button>
                <button onClick={() => window.print()} className="flex-[2] min-w-[200px] py-4 bg-[#0B1C2D] text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-[#0B1C2D]/20 flex items-center justify-center gap-2 hover:bg-[#1a2e3f] border-2 border-[#0B1C2D] hover:border-[#FFD400] transition-all">
                  <Printer size={16} className="text-[#FFD400]" /> Imprimir / Guardar en PDF
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

import React from 'react';
import { UserCheck, BrainCircuit, Briefcase, Phone, MessageSquareQuote } from 'lucide-react';
import { QUESTIONS_DB } from '../lib/constants';

const ActaImprimible = ({ 
  aspirant = {}, 
  finalIS = 0, 
  autoReport = '', 
  refs = {}, 
  noConsta = {}, 
  auditorAppreciation = '', 
  zone = {} 
}) => {
  return (
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
              <p className="font-mono text-[8px] uppercase font-bold">FECHA: {aspirant.date || '---'}</p>
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
                <p className="text-xs font-black text-slate-900">{typeof finalIS === 'number' ? finalIS.toFixed(2) : '0.00'} / 5.00</p>
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
                {autoReport ? autoReport.split('DILIGENCIA DE DATOS RECOPILADOS:')[0].replace('ANÁLISIS DE RIESGO OBJETIVO:', '').trim() : '---'}
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
                    const data = refs ? refs[q.id] : null;
                    const isNoConsta = noConsta ? noConsta[q.id] : true;
                    if (isNoConsta || !data) return (
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
                          <td className="p-0.5 font-bold uppercase text-[7px] leading-tight">{idx === 0 ? q.refLabel : ''} {Array.isArray(data) && data.length > 1 ? `[Ref ${idx+1}]` : ''}</td>
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
              {autoReport && autoReport.split('CONCLUSIÓN TÉCNICA:')[1] ? `CONCLUSIÓN TÉCNICA: ${autoReport.split('CONCLUSIÓN TÉCNICA:')[1].trim()}` : ''}
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
              <h4 className="text-lg font-black uppercase tracking-tighter leading-none">{zone.label || '---'}</h4>
              <div className="h-0.5 w-12 bg-slate-900 mx-auto mt-0.5"></div>
              <p className="text-[8.5px] font-bold uppercase pt-0.5 italic text-slate-600 leading-none">{zone.action || '---'}</p>
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
  );
};

export default ActaImprimible;

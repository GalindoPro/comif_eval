# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Mejoras Recientes

- **Limpieza de código y resolución de advertencias de linter (ESLint):**
  - Se eliminaron importaciones sin uso (iconos de `lucide-react` como `Briefcase`, `BrainCircuit`, `Users`, `TrendingUp`, `Phone`, y la importación de `React` en `ActaImprimible.jsx`).
  - Se resolvieron advertencias sobre variables definidas pero no utilizadas, especialmente en bloques `catch` (usando la sintaxis moderna `catch { ... }` para evitar declarar variables de error innecesarias).
  - Se añadió manejo de errores (logging) en bloques `catch` que anteriormente estaban vacíos (ej. en `PanelMetricas.jsx`).
- **Optimización de React:**
  - Se corrigieron actualizaciones de estado síncronas dentro de los hooks `useEffect` (ej. `setDraftData`, `setShowRecoveryModal`, `cargarDatos`) en `App.jsx` y `PanelMetricas.jsx` para seguir las mejores prácticas y prevenir renderizados en cascada innecesarios.
- **Actualizaciones menores:**
  - Se actualizó el año del pie de página a 2026.
- **Prevención Inteligente de Duplicidad y Autocompletado:**
  - **Detección temprana de DPI:** Al iniciar una evaluación, el sistema verifica en la base de datos si el DPI ya está registrado.
  - **Lógica condicional por estado:** Si el expediente está "En Espera", permite cargar los datos para actualizar o iniciar un expediente nuevo. Si ya fue "Aceptado/Rechazado" por el administrador, bloquea la creación de expedientes nuevos y solo permite la actualización.
  - **Autocompletado Mágico:** Al elegir "Cargar para Actualizar", el sistema rellena automáticamente todo el cuestionario y las calificaciones que el evaluador anterior había guardado.
  - **Reinicio automático de estado:** Si se actualiza un expediente que ya había sido "Aceptado" o "Rechazado", el sistema lo regresa automáticamente al estado "En Espera" para que el administrador sea notificado y lo vuelva a evaluar.
- **Panel Administrativo (Mejoras UI/UX):**
  - **Buscador en Tiempo Real:** Se incorporó una barra de búsqueda inteligente en la pestaña de solicitudes que permite filtrar instantáneamente expedientes escribiendo el nombre del asociado o su número de DPI, combinable con los filtros de estado (Total, En Espera, Aceptadas, Rechazadas).

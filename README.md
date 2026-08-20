# OpoRitmo

Herramienta abierta para organizar el temario de oposiciones mediante vueltas, repasos y simulacros.

No guarda material de academias ni depende de legislación cambiante. Sirve para decidir **qué estudiar hoy**, cuándo repasar y cómo afrontar el sorteo sin rehacer el calendario cada vez que un día se tuerce.

Creada por [Profe en Beta](https://x.com/ProfeEnBeta).

---

## Qué resuelve

Opositar con temario y sorteo obliga a equilibrar dos cosas a la vez:

- **Cobertura**: cuántos temas tienes preparados.
- **Profundidad**: que no se te enfríen los que ya tocaste.

OpoRitmo calcula la probabilidad de que salga al menos un tema preparado, te propone qué hacer hoy y mantiene un calendario flexible de vueltas y repasos.

Pensada para maestros, secundaria y cualquier oposición con temario numerado y extracción aleatoria.

---

## Características

### Planificación

- **Qué hacer hoy** — propuesta del día según tu ritmo, sin reorganizar todo el plan.
- **Calendario flexible** — aguanta días malos y se reajusta sin romperse.
- **Horas distintas por día de la semana** — y posibilidad de cambiar solo las de hoy.
- **Periodo de estudio** — día de inicio y día de fin configurables.
- **Temas a medias** — si no terminas uno, al día siguiente aparece para acabarlo.

### Temario

- **Títulos propios** — cada persona escribe los suyos (cortos y legibles).
- **Orden libre** — puedes estudiar el 6, el 18 y el 15 si quieres.
- **Bloques con color** — agrupa temas; el color se aplica al día en el calendario.
- **Filtros reales por vuelta** — pendientes, 1.ª, 2.ª, 3.ª… según tu configuración, preparados y olvidados.
- **Temas olvidados** — avisa de los que llevan demasiado sin tocarse.

### Vueltas y probabilidad

- **Vueltas de repaso configurables** — cada vuelta con su propio intervalo (p. ej. 7, 14 y 30 días).
- **Probabilidad de sorteo** — de que salga al menos un tema preparado.
- **Umbrales** — cuántos temas conviene añadir para acercarte al 70 %, 80 % o 90 %.

### Sorteo y simulacros

- **Simulacros de extracción** — como el tribunal.
- **Contraste estadístico** — miles de sorteos para comparar con el cálculo teórico.
- **Simulacro cronometrado** — reloj personalizable, con pausa y registro del tiempo real (sin guardar el escrito).
- **Evolución del tiempo por tema** — si te sale más rápido o más lento en cada intento.

### Uso diario

- **Frase de ánimo al terminar un tema** (con confeti).
- **Modo claro / oscuro / sistema**.
- **Sin registro obligatorio** — los datos pueden quedarse solo en el dispositivo.
- **Cuenta opcional** (Google o X) — para sincronizar entre móvil y ordenador.
- **Instalable en el móvil** como PWA (Añadir a pantalla de inicio).

---

## Principios de diseño

1. **Local-first** — funciona sin cuenta; la nube es opcional.
2. **Sin contenido protegido** — no almacena temarios de academias ni apuntes.
3. **Calendario que no se rompe** — un día malo no obliga a replanificarlo todo a mano.
4. **Transparente** — la probabilidad y los simulacros se entienden; no hay “caja negra”.
5. **Pequeña** — pensada para mantenerse usable, no para convertirse en otra academia.

---

## Cómo usarla

1. Entra en la versión publicada (o arranca el proyecto en local).
2. Completa el arranque en tres pasos: temario, periodo de estudio y, si quieres, cuenta.
3. Ajusta las horas por día de la semana.
4. Configura las vueltas de repaso en Ajustes.
5. Usa la pestaña **«Hoy»** como punto de partida cada jornada.

Si no inicias sesión, los datos se guardan en el navegador de ese dispositivo. Si inicias sesión, se sincronizan con tu cuenta.

---

## Desarrollo local

> Requisitos: Node.js 22+ y npm.

```bash
npm install
npm run dev
```

La app queda en `http://localhost:8080` (o el puerto que indique la consola).

```bash
npm run build    # build de producción
npm run typecheck
```

### Stack

- [TanStack Start](https://tanstack.com/start) + React
- Zustand (estado local con persistencia)
- PWA (manifest + service worker)
- Autenticación opcional (cuenta para sincronizar)

---

## Estructura orientativa

```
src/
  components/     # UI (Hoy, calendario, onboarding, simulacro…)
  lib/oporitmo/   # Lógica: probabilidad, vueltas, sugerencias, store
  routes/         # Páginas: Hoy, Temas, Calendario, Sorteo, Ajustes
public/           # Iconos PWA, manifest, favicon
```

---

## Privacidad

- Sin cuenta: todo permanece en el almacenamiento local del navegador.
- Con cuenta: los datos de planificación se asocian a tu sesión para poder recuperarlos en otro dispositivo.
- No se pide ni se guarda el texto de los temas desarrollados en simulacros.
- No hay publicidad en el diseño actual.

---

## Hoja de ruta (ideas, no compromisos)

- Mejoras a partir del uso real de opositores.
- Empaquetado APK (TWA / Capacitor) si hay demanda.
- Ajustes finos de calendario y filtros según feedback.

La **1.0** ya está pensada para usarse de verdad. Lo que venga después debería salir de rozaduras reales, no de una lista infinita de funciones.

---

## Contribuir

Las sugerencias y los fallos ayudan más que las peticiones genéricas.

1. Abre un *issue* describiendo qué pasaba y qué esperabas.
2. Si propones código, mantén el alcance pequeño y alineado con los principios de arriba.
3. No envíes temarios completos ni material de academias al repositorio.

---

## Licencia

MIT — ver [LICENSE](./LICENSE).

Puedes usar, copiar, modificar y distribuir el software, con la condición de mantener el aviso de copyright y la licencia.

---

## Autor

**Profe en Beta** — maestro de Educación Primaria (Educación Física) y aficionado a las herramientas útiles hechas con paciencia (y un poco de IA).

- X: [@ProfeEnBeta](https://x.com/ProfeEnBeta)

Hecha con ayuda de IA, orientada a opositores reales, no a vender cursos.

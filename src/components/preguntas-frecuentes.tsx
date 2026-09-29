const PREGUNTAS: { pregunta: string; respuesta: string[] }[] = [
  {
    pregunta: "¿Hace falta crear una cuenta?",
    respuesta: [
      "No. Puedes usar OpoRitmo solo en este navegador. La cuenta es opcional, por si quieres sincronizar entre móvil y ordenador.",
    ],
  },
  {
    pregunta: "¿Qué pasa si un día no estudio?",
    respuesta: [
      "Nada grave. El calendario se reajusta solo. No hay rachas ni castigos. Si pasas varios días sin abrir la app, al volver verás un aviso calmado y la propuesta de Hoy.",
    ],
  },
  {
    pregunta: "¿Qué significan Terminado, A medias y Ahora no?",
    respuesta: [
      "Terminado: lo has estudiado.",
      "A medias: empezaste, pero te queda una parte.",
      "Ahora no: hoy no lo has tocado.",
    ],
  },
  {
    pregunta: "¿Qué es la probabilidad del sorteo?",
    respuesta: [
      "Es la probabilidad de que, en un sorteo como el del tribunal, te toque al menos un tema que ya tienes preparado. No es una nota ni un ranking.",
    ],
  },
  {
    pregunta: "¿Para qué sirve «¿Llego?» / el ritmo respecto a la fecha?",
    respuesta: [
      "Es una frase sobre si tu ritmo de estudio encaja con la fecha del examen. No es un semáforo ni te dice que vas mal. Si faltan datos (por ejemplo, cero minutos registrados), no se muestra.",
    ],
  },
  {
    pregunta: "¿Cómo guardo el plan por si borro el navegador?",
    respuesta: [
      "En Ajustes → Copia de seguridad: «Guardar una copia» descarga un archivo; «Usar una copia guardada» lo recupera. Antes de sustituir, te pide confirmación.",
    ],
  },
  {
    pregunta: "¿Qué es un día libre?",
    respuesta: [
      "En el Calendario puedes marcar un día como libre (vacaciones, trabajo o imprevistos). Ese día no propone estudio y el plan se reparte en otros días, sin culpa.",
    ],
  },
  {
    pregunta: "¿Para qué sirve Empezar sesión?",
    respuesta: [
      "En Hoy, pone un reloj mientras estudias. Al parar, rellena los minutos de la sesión; luego eliges Terminado, A medias o Ahora no. No es un pomodoro ni una racha.",
    ],
  },
];

export function PreguntasFrecuentes() {
  return (
    <section className="mt-4 card p-5">
      <h3 className="font-display text-xl font-semibold">
        Preguntas frecuentes
      </h3>
      <p className="mt-2 text-sm text-muted">
        Dudas habituales sobre cómo usar OpoRitmo.
      </p>
      <div className="mt-3 divide-y divide-faint">
        {PREGUNTAS.map((item) => (
          <details key={item.pregunta} className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center py-3 text-left text-sm font-medium text-ink outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
              <span className="flex-1 pr-3">{item.pregunta}</span>
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-lg leading-none text-muted group-open:hidden"
                aria-hidden
              >
                +
              </span>
              <span
                className="hidden size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-lg leading-none text-muted group-open:grid"
                aria-hidden
              >
                −
              </span>
            </summary>
            <div className="space-y-2 pb-3 text-sm text-muted">
              {item.respuesta.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

import { ordinalVuelta } from "./vueltas";

const PRIMERA = [
  "Ya no partes de cero.",
  "La primera vez es la que más cuesta. Hecha.",
  "Este tema ya tiene cara.",
  "Hoy era abrirlo. Ya está abierto.",
  "Un tema nuevo menos en la lista.",
  "El temario se come así: de uno en uno.",
  "Primera pasada lista. Ahora sí se puede repasar.",
  "Bien. Lo desconocido ya no lo es tanto.",
  "Ese era el paso difícil. El resto es volver.",
  "Has empezado. Eso vale más que planearlo otra vez.",
  "Queda escrito en tu ritmo, no solo en el papel.",
  "Uno puesto en marcha. Mañana otro, o el mismo si toca.",
];

const VUELTA = [
  "Vuelta cerrada. El ritmo cuenta más que el día perfecto.",
  "Así se construye: un tema, y otro.",
  "Bien. Sigue sin romper el calendario.",
  "Cada vuelta deja el tema un poco más tuyo.",
  "No hace falta que salga perfecto. Hace falta que salga.",
  "Otra pasada hecha. El tribunal no pregunta si tuviste un día flojo.",
  "Esto no es sprint. Es no dejarlo enfriar.",
  "Vuelta anotada. El plan ya se reajusta solo.",
  "Un poco más sólido que ayer. Con eso basta.",
  "Has vuelto al tema. Eso es estudiar de verdad.",
  "Cerrada. Ahora a lo que toque, sin reorganizarlo todo.",
  "La constancia aburre, y por eso funciona.",
];

const PREPARADO = [
  "Este ya está. A cubierto.",
  "Tema preparado. Otro más en el saco.",
  "Listo para el sorteo.",
  "Si sale este, tienes con qué.",
  "De pendiente a preparado. Eso sube la probabilidad.",
  "Ya no es un agujero en el temario.",
  "Este lo puedes defender. Al siguiente.",
  "Cobertura un poco más ancha. Se nota.",
  "Lo has cerrado del todo. Merece un respiro corto.",
  "Preparados suman. Este suma.",
  "Cuando salga, no será la primera vez que lo ves.",
  "Hecho. Ahora a mantenerlo vivo de vez en cuando.",
];

const MANTENIMIENTO = [
  "Repaso hecho. Sigue fresco.",
  "Lo has vuelto a tocar. Eso es mantenerlo.",
  "Un rato ahora ahorra un apuro luego.",
  "El tema no se ha enfriado. Bien.",
  "Mantenimiento aburrido, y necesario.",
  "Volver a él es lo que lo deja listo para el examen.",
  "No era estudiar de cero. Era no olvidarlo. Hecho.",
  "Sigue en la cabeza. Eso era el objetivo.",
  "Repaso corto, tema vivo.",
  "Así no se escapa entre tantas vueltas.",
  "Lo tenías preparado. Ahora lo sigues teniendo.",
  "Otra pasada de mantenimiento. El temario agradece.",
];

let ultima = "";

function pick(lista: string[]): string {
  const opciones = lista.filter((f) => f !== ultima);
  const pool = opciones.length > 0 ? opciones : lista;
  const i = Math.floor(Math.random() * pool.length);
  const frase = pool[i] ?? lista[0]!;
  ultima = frase;
  return frase;
}

export function fraseAnimo(
  vueltaAntes: number,
  nVueltas: number,
): { titulo: string; texto: string } {
  if (vueltaAntes <= 0) {
    return { titulo: "¡Ánimo!", texto: pick(PRIMERA) };
  }
  const nueva = vueltaAntes + 1;
  if (nueva > nVueltas && vueltaAntes <= nVueltas) {
    return { titulo: "¡Ánimo!", texto: pick(PREPARADO) };
  }
  if (vueltaAntes > nVueltas) {
    return { titulo: "¡Ánimo!", texto: pick(MANTENIMIENTO) };
  }
  return {
    titulo: `¡${ordinalVuelta(nueva)} vuelta!`,
    texto: pick(VUELTA),
  };
}

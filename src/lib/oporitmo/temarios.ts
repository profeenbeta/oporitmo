export function parseListado(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linea) =>
      linea
        .replace(/^\s*(?:tema\s*)?\d{1,3}\s*[\.\)\:\-\u2013\u2014]\s*/i, "")
        .trim(),
    )
    .filter((linea) => linea.length > 0);
}

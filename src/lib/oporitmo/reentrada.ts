import { useEffect, useState } from "react";
import { diasEntre, hoyISO } from "./math";

const KEY_VISITA = "oporitmo-visita-hoy";
const KEY_MOSTRAR = "oporitmo-reentrada-mostrar";
const KEY_OK = "oporitmo-reentrada-ok";
const UMBRAL = 3;

function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    /* modo privado u origen opaco */
  }
}

function evaluar(hoy: string): boolean {
  const previa = leer(KEY_VISITA);
  const ok = leer(KEY_OK);
  if (previa && diasEntre(previa, hoy) >= UMBRAL && ok !== hoy) {
    escribir(KEY_MOSTRAR, hoy);
  }
  escribir(KEY_VISITA, hoy);
  return leer(KEY_MOSTRAR) === hoy && leer(KEY_OK) !== hoy;
}

function borrar(clave: string) {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    /* noop */
  }
}

export function descartarReentrada(hoy = hoyISO()) {
  escribir(KEY_OK, hoy);
  borrar(KEY_MOSTRAR);
}

export function useReentrada() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(evaluar(hoyISO()));
  }, []);

  function descartar() {
    descartarReentrada();
    setVisible(false);
  }

  return { visible, descartar };
}

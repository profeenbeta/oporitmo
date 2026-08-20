export type Apariencia = "claro" | "oscuro" | "sistema";

export const THEME_STORAGE_KEY = "oporitmo-v1";

export function resolverOscuro(apariencia: Apariencia): boolean {
  if (apariencia === "oscuro") return true;
  if (apariencia === "claro") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function aplicarApariencia(apariencia: Apariencia) {
  const dark = resolverOscuro(apariencia);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", dark ? "#14110e" : "#f3eee4");
}

export const THEME_BOOT_SCRIPT = `(function(){try{var r=localStorage.getItem("${THEME_STORAGE_KEY}");var t=r?JSON.parse(r).state.apariencia:"sistema";var d=t==="oscuro"||(t!=="claro"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

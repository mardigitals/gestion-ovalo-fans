export function validarCuit(cuit: string): boolean {
  // 1. Limpiamos el CUIT de guiones o espacios
  const limpio = cuit.replace(/[- ]/g, "");
  
  // 2. Debe tener 11 dígitos
  if (limpio.length !== 11) return false;

  const [tipo, ...resto] = limpio.split("").map(Number);
  const verificador = resto.pop();
  
  // 3. Coeficientes oficiales para el cálculo
  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += limpio[i] === '-' ? 0 : Number(limpio[i]) * factores[i];
  }

  let resultado = 11 - (suma % 11);
  if (resultado === 11) resultado = 0;
  if (resultado === 10) resultado = 9; // Caso especial para algunos CUITs

  return resultado === verificador;
}
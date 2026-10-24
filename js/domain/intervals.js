export function intervalsOverlap(first, second) {
  return first.espacioId === second.espacioId
    && first.fecha === second.fecha
    && first.inicio < second.fin
    && first.fin > second.inicio;
}

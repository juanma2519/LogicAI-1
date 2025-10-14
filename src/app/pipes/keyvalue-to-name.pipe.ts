// ==================================================
// file: keyvalue-to-name.pipe.ts (opcional, usado en detalle)
// ==================================================
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'keyvalueToName', standalone: true })
export class KeyvalueToNamePipe implements PipeTransform {
  transform(arr: { id: number; nombre: string }[] | null | undefined, id: number | null | undefined): string | undefined {
    if (!arr || id == null) return undefined;
    return arr.find((x) => x.id === id)?.nombre;
  }
}

// src/app/core/profile/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UsuarioApi {
  usuario_id: number;
  nombre: string;
  apellidos: string;
  dni?: string | null;
  fecha_nacimiento?: string | null;  // ISO (YYYY-MM-DD) o datetime
  correo_electronico: string;
  genero?: 'hombre' | 'mujer' | null;
  telefono?: string | null;
  profesion?: string | null;
  image?: string | null;
  credit?: string | null;
  // backend también tiene contrasena (hash), cus, rol, verified...
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private base = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /** Obtiene un usuario por id (para precargar perfil) */
  getById(id: number | string) {
    return this.http.get<UsuarioApi>(`${this.base}/${id}`);
  }

  /** Actualiza el usuario (solo campos enviados) */
  update(id: number | string, payload: Partial<UsuarioApi> & { password?: string, username?: string }) {
    // El backend acepta PUT /usuarios/:id con los campos a modificar.
    return this.http.put<UsuarioApi>(`${this.base}/${id}`, payload);
  }
}

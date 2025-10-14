import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}/usuarios`;
  private _usuario$ = new BehaviorSubject<any | null>(this.cargarUsuario());
  usuario$ = this._usuario$.asObservable();

  constructor(private http: HttpClient) {}

  get token(): string | null { return localStorage.getItem('token'); }
  get usuario(): any | null { return this._usuario$.value; }
  get isLoggedIn(): boolean { return !!this.token; }

  login(correo_electronico: string, contrasena: string, remember = true) {
    return this.http.post<any>(`${this.base}/authenticate`, { correo_electronico, contrasena })
      .pipe(
        tap((res) => {
          // guarda token + datos mínimos que usas en la app
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', String(res.usuario.usuario_id));
          localStorage.setItem('role', JSON.stringify(res.usuario.rol || ''));
          // opcional: persistir el usuario completo (para navbar, etc.)
          if (remember) {
            localStorage.setItem('usuario', JSON.stringify(res.usuario));
          } else {
            sessionStorage.setItem('usuario', JSON.stringify(res.usuario));
          }
          this._usuario$.next(res.usuario);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('usuario');
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('user');
    this._usuario$.next(null);
  }

  private cargarUsuario(): any | null {
    const raw = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    return raw ? JSON.parse(raw) as any : null;
  }
}

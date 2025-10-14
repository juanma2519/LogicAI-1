import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private userSubject: BehaviorSubject<Usuario>;
    private roleSubject: BehaviorSubject<String>;
    public user: Observable<Usuario>;
    public role: Observable<String>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject<Usuario>(JSON.parse(localStorage.getItem('user') || '{}'));
        this.roleSubject = new BehaviorSubject<String>(JSON.parse(localStorage.getItem('role') || '{}'));
        this.user = this.userSubject.asObservable();
        this.role = this.roleSubject.asObservable();
    }

    public get userValue(): Usuario {
        return this.userSubject.value;
    }

    public get roleValue(): String {
        return this.roleSubject.value;
    }

    login(correo_electronico: string, contrasena: string) {
        return this.http.post<Usuario>(`${environment.apiUrl}/usuarios/authenticate`, { correo_electronico, contrasena })
            .pipe(map(user => {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('role', JSON.stringify(user.rol));
                this.userSubject = new BehaviorSubject<Usuario>(JSON.parse(localStorage.getItem('user') || ""));
                this.roleSubject = new BehaviorSubject<String>(JSON.parse(localStorage.getItem('role') || ""));
                this.user = this.userSubject.asObservable();
                this.role = this.roleSubject.asObservable();
                this.userSubject.next(user);
                return user;
            }));
    }

    logout() {
        this.http.get(`${environment.apiUrl}/usuarios/logout`);
        // remove user from local storage and set current user to null
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('usuario');
        sessionStorage.removeItem('user');
        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login']);
    }

    register(user: Usuario) {
        return this.http.post(`${environment.apiUrl}/usuarios/register`, user);
    }

    getAll() {
        return this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`);
    }

    getById(id: string) {
        return this.http.get<Usuario>(`${environment.apiUrl}/usuarios/${id}`);
    }

    update(id: string, params: Usuario) {
        return this.http.put(`${environment.apiUrl}/usuarios/${id}`, params)
            .pipe(map(x => {
                // update stored user if the logged in user updated their own record
                if (id == this.userValue.usuario_id) {
                    // update local storage
                    const user = { ...this.userValue, ...params };
                    localStorage.setItem('user', JSON.stringify(user));

                    // publish updated user to subscribers
                    this.userSubject.next(user);
                }
                return x;
            }));
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/usuarios/${id}`)
            .pipe(map(x => {
                // auto logout if the logged in user deleted their own record
                if (id == this.userValue.usuario_id) {
                    this.logout();
                }
                return x;
            }));
    }

    getBookings(){
        return this.http.get<any[]>(`${environment.apiUrl}/reservas/habitaciones/1/disponibilidad/2`);
    }

    upload(file: File, usuario: Usuario): Observable<HttpEvent<any>> {
        const formData: FormData = new FormData();
        const fileExtension = '.png';
        formData.append('file', file, usuario + fileExtension);
    
        const req = new HttpRequest('POST', `${environment.apiUrl}/usuarios/upload`, formData, {
          reportProgress: true,
          responseType: 'json'
        });
        
        return this.http.request(req);
    }
}
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private base = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient, private zone: NgZone) {}

  /** Listar mensajes de un usuario */
  getByUser(userId: string | number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.base}/user/${userId}`);
  }

  /** Obtener un mensaje concreto */
  getOne(id: number): Observable<Message> {
    return this.http.get<Message>(`${this.base}/${id}`);
  }

  /** Marcar un mensaje como leído */
  markAsRead(id: number): Observable<{ updated: boolean }> {
    return this.http.put<{ updated: boolean }>(`${this.base}/${id}/read`, {});
  }

  /** Marcar todos como leídos para un usuario */
  markAllAsRead(userId: string | number): Observable<{ updated: number }> {
    return this.http.put<{ updated: number }>(`${this.base}/user/${userId}/read-all`, {});
  }

  /** Borrar un mensaje */
  delete(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/${id}`);
  }

  /**
   * (Opcional) Suscripción a stream SSE si tu backend lo expone en /messages/stream/:userId
   * Devuelve eventos 'message' parseados como Message.
   */
  listenStream(userId: string | number): Observable<Message> {
    return new Observable<Message>((observer) => {
      const url = `${this.base}/stream/${userId}`;
      const es = new EventSource(url);

      es.onmessage = (evt) => {
        try {
          const data: Message = JSON.parse(evt.data);
          // aseguramos ejecución dentro de Angular
          this.zone.run(() => observer.next(data));
        } catch (e) {
          // ignoramos eventos mal formateados
        }
      };
      es.onerror = () => {
        this.zone.run(() => observer.error(new Error('SSE connection error')));
        es.close();
      };

      return () => es.close();
    });
  }
}

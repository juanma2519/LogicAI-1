import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from '../../../models/message';
import { MessagesService } from '../../../services/messages.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContainerComponent, ButtonDirective, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, PopoverModule, PopoverDirective, TableModule, UtilitiesModule, InputGroupTextDirective, FormControlDirective } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';
import { LeadFormComponent } from '../leeds-form/leeds-form.component';

import { freeSet } from '@coreui/icons';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  imports: [ContainerComponent, FormsModule, ButtonDirective, WidgetsBrandComponent, WidgetsDemoComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective,
        InputGroupComponent, LeadFormComponent, ReactiveFormsModule, PopoverModule, PopoverDirective, IconModule, TableModule, UtilitiesModule, InputGroupTextDirective, IconDirective, FormControlDirective, CommonModule]
})

export class MessagesComponent implements OnInit, OnDestroy {
  @Input() userId?: number | string;

  mensajes: Message[] = [];
  loading = false;
  error?: string;

  icons = freeSet;
  private sseSub?: Subscription;

  constructor(private messagesSrv: MessagesService) {}

  ngOnInit(): void {
    const uid = this.userId ?? localStorage.getItem('userId') ?? '';
    if (!uid) {
      this.error = 'No se encontró userId para cargar mensajes.';
      return;
    }
    this.cargarMensajes(uid);

    // (Opcional) activar stream en cuanto el backend esté listo:
    // this.suscribirStream(uid);
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  cargarMensajes(uid: number | string): void {
    this.loading = true;
    this.error = undefined;
    this.messagesSrv.getByUser(uid).subscribe({
      next: (data: any) => {
        // Aseguramos orden por fecha más reciente primero
        this.mensajes = [...data].sort(
          (a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime()
        );
        this.loading = false;
      },
      error: (err:any) => {
        this.error = 'No se pudieron cargar los mensajes';
        this.loading = false;
        console.error(err);
      }
    });
  }

  verDetalles(mensaje: Message): void {
    // Aquí podrías abrir un modal; por ahora, simple log.
    console.table(mensaje);
  }

  marcarComoLeido(mensaje: Message): void {
    if (mensaje.leido) return;
    this.messagesSrv.markAsRead(mensaje.mensaje_id).subscribe({
      next: () => (mensaje.leido = true),
      error: (err: any) => console.error('Error marcando como leído', err)
    });
  }

  marcarTodosComoLeidos(): void {
    const uid = this.userId ?? localStorage.getItem('userId') ?? '';
    if (!uid) return;
    this.messagesSrv.markAllAsRead(uid).subscribe({
      next: () => {
        this.mensajes = this.mensajes.map(m => ({ ...m, leido: true }));
      },
      error: (err:any) => console.error('Error marcando todos como leídos', err)
    });
  }

  eliminar(mensaje: Message): void {
    if (!confirm('¿Eliminar este mensaje?')) return;
    this.messagesSrv.delete(mensaje.mensaje_id).subscribe({
      next: () => {
        this.mensajes = this.mensajes.filter(m => m.mensaje_id !== mensaje.mensaje_id);
      },
      error: (err: any) => console.error('Error eliminando mensaje', err)
    });
  }

  private suscribirStream(uid: number | string): void {
    this.sseSub = this.messagesSrv.listenStream(uid).subscribe({
      next: (nuevo: Message) => {
        // prepend si no existe
        const exists = this.mensajes.some(m => m.mensaje_id === nuevo.mensaje_id);
        if (!exists) this.mensajes = [nuevo, ...this.mensajes];
      },
      error: (err: { message: any; }) => console.warn('Stream SSE desconectado:', err?.message || err)
    });
  }
}
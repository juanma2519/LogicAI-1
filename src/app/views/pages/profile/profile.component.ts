// src/app/views/pages/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormsModule } from '@angular/forms';
import { ProfileService, UsuarioApi } from '../../../services/profile.service';
import { Router } from '@angular/router';
import { ContainerComponent, ButtonDirective, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, PopoverModule, TableModule, UtilitiesModule } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContainerComponent, FormsModule, ButtonDirective, WidgetsBrandComponent, WidgetsDemoComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective,
       PopoverModule, IconModule, TableModule, UtilitiesModule, IconDirective],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  loading = false;
  saving = false;
  error?: string;
  success?: string;

  userId!: number;
  // Para mostrar solo lectura:
  creditDisplay: string = '0';

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profile: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.error = undefined;
    this.success = undefined;

    // userId desde localStorage (de tu login)
    this.userId = Number(localStorage.getItem('userId') || 0);
    if (!this.userId) {
      this.error = 'No se encontró el usuario. Inicia sesión de nuevo.';
      this.router.navigate(['/login']);
      return;
    }

    this.form = this.fb.group({
        nombre: ['', [Validators.required]],
        apellidos: ['', [Validators.required]],
        correo_electronico: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        dni: [''],
        fecha_nacimiento: [''],
        genero: [''],
        telefono: [''],
        profesion: [''],
        image: [''],
        username: [''],
        password: ['']
    });

    this.loadUser();
  }

  public loadUser() {
    this.loading = true;
    this.profile.getById(this.userId).subscribe({
      next: (u) => {
        this.loading = false;
        this.patchForm(u);
        this.creditDisplay = u.credit ?? '0';
      },
      error: (err) => {
        this.loading = false;
        this.error = this.parseErr(err);
      }
    });
  }

  private patchForm(u: UsuarioApi) {
    this.form.patchValue({
      nombre: u.nombre || '',
      apellidos: u.apellidos || '',
      correo_electronico: u.correo_electronico || '',
      dni: u.dni || '',
      fecha_nacimiento: u.fecha_nacimiento ? u.fecha_nacimiento.toString().slice(0, 10) : '',
      genero: u.genero || '',
      telefono: u.telefono || '',
      profesion: u.profesion || '',
      image: u.image || '',
      // username/password son opcionales en tu backend TS; si existen, los mapeas aquí
      username: (u as any).username || ''
    });
  }

  submit() {
    this.error = undefined;
    this.success = undefined;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Construimos payload solo con campos editables
    const raw = this.form.getRawValue();
    const payload: any = {
      nombre: raw.nombre,
      apellidos: raw.apellidos,
      correo_electronico: raw.correo_electronico, // sigue deshabilitado, pero por si lo habilitas
      dni: raw.dni || null,
      fecha_nacimiento: raw.fecha_nacimiento || null,
      genero: raw.genero || null,
      telefono: raw.telefono || null,
      profesion: raw.profesion || null,
      image: raw.image || null
    };

    // opcionales de auth
    if (raw.username) payload.username = raw.username;
    if (raw.password) payload.password = raw.password;

    this.saving = true;
    this.profile.update(this.userId, payload).subscribe({
      next: (u) => {
        this.saving = false;
        this.success = 'Perfil actualizado correctamente.';
        // Refresca form/credit:
        this.patchForm(u);
        this.creditDisplay = u.credit ?? '0';
        // Opcional: actualizar cache local
        localStorage.setItem('usuario', JSON.stringify(u));
      },
      error: (err) => {
        this.saving = false;
        this.error = this.parseErr(err);
      }
    });
  }

  recargarCredito() {
    // TODO: aquí enlazaremos con Stripe (checkout)
    // Por ahora, redirige a una ruta placeholder o abre modal
    alert('Próximamente: recarga de crédito con Stripe.');
  }

  private parseErr(err: any): string {
    if (typeof err?.error === 'string') return err.error;
    if (typeof err?.message === 'string') return err.message;
    return 'No se pudo actualizar el perfil.';
  }
}

import { Component } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { FormBuilder, FormControlDirective, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authService';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, ButtonDirective } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContainerComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, ButtonDirective, NgStyle],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  error?: string;
  form: FormGroup;


  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      correo_electronico: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true]
    });
  }
  submit() {
    this.error = undefined;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { correo_electronico, contrasena, remember } = this.form.value;
    this.loading = true;

    this.auth.login(correo_electronico!, contrasena!, !!remember)
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']); // o tu ruta principal (dashboard)
        },
        error: (err) => {
          this.loading = false;
          this.error = this.parseError(err);
        }
      });
  }

  private parseError(err: any): string {
    // tu backend lanza strings como 'Usuario no verificado...' o 'No se ha encontrado un usuario...'
    if (typeof err?.error === 'string') return err.error;
    if (typeof err?.message === 'string') return err.message;
    return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}

import { Component, viewChild } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
  ToasterComponent,
  ToasterPlacement
} from '@coreui/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../../../services/account.service';
import { first } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { AppToastComponent } from '../toast/toast.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [ContainerComponent, AppToastComponent, ReactiveFormsModule, RowComponent, ColComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective],
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private appComponent: AppComponent, private accountService: AccountService, private router: Router) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo_electronico: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    });
  }


  readonly toaster = viewChild(ToasterComponent);
  placement = ToasterPlacement.TopCenter;

  onSubmit() {
    if (this.registerForm.invalid) return;

    const usuario = this.registerForm.value;

    // Validar que password y repeatPassword coincidan
    if (usuario.password !== usuario.repeatPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.accountService.register(this.registerForm.value)
      .pipe(first())
      .subscribe({
        next: (user) => {
          this.addToast(
            "Usuario creado correctamente.", "info"
          );
          this.router.navigate(['/login']);
        },
        error: error => {
          this.addToast(
            "El usuario no se ha podido crear.", "error"
          )
          
        }
      });

  }

  addToast(title: string, type: string) {
    const options = {
      title: title,
      delay: 5000,
      placement: this.placement,
      color: type,
      autohide: true
    };
    const componentRef = this.toaster()?.addToast(AppToastComponent, { ...options });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

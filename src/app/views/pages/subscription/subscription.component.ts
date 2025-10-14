import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective, RowComponent, ColComponent, CardComponent, InputGroupComponent, UtilitiesModule, FormControlDirective } from '@coreui/angular';

@Component({
  selector: 'app-suscripciones',
  templateUrl: './subscription.component.html',
   imports: [ FormsModule, ButtonDirective, RowComponent, ColComponent, CardComponent,
        InputGroupComponent, UtilitiesModule, FormControlDirective, CommonModule]
})
export class SuscripcionesComponent implements OnInit {

  serviceSpecial = '';
  phone = '';

  constructor() { }

  ngOnInit(): void {
  }
}
// =========================================
// file: leeds-form.component.ts (Angular)
// Reemplazo completo compatible con tu HTML
// =========================================
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Lead, Concepto, Estado } from '../../../models/lead';
import { CommonModule } from '@angular/common';
import { ContainerComponent, ButtonDirective, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, PopoverModule, PopoverDirective, TableModule, UtilitiesModule, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';
import { KeyvalueToNamePipe } from '../../../pipes/keyvalue-to-name.pipe';

@Component({
  selector: 'app-lead-form',
  templateUrl: './leeds-form.component.html',
  imports: [ContainerComponent, FormsModule, ModalModule, ButtonDirective, WidgetsBrandComponent, WidgetsDemoComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective,
    InputGroupComponent, KeyvalueToNamePipe, ReactiveFormsModule, PopoverModule, PopoverDirective, IconModule, TableModule, UtilitiesModule, InputGroupTextDirective, IconDirective, CommonModule]
})
export class LeadFormComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() detail = false;
  @Input() lead: Lead | null = null;

  @Input() conceptos: Concepto[] = [];
  @Input() estados: Estado[] = [];

  @Output() save = new EventEmitter<Partial<Lead>>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;

  get title(): string {
    if (this.detail) return 'Detalle del Lead';
    return this.lead?.id ? 'Editar Lead' : 'Crear Lead';
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      usuario_id: [null],
      fecha_de_entrada: '',
      empresa: '',
      nombre: '',
      web: '',
      correo: '',
      telefono: '',
      fuente: '',
      propietario_relaccion: '',
      notas: '',
      concepto_id: null,
      estado_id: null
    });

    if (this.lead) this.patchLead(this.lead);

    if (this.detail) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lead'] && this.form) {
      this.patchLead(this.lead);
    }
    if (changes['detail'] && this.form) {
      this.detail ? this.form.disable({ emitEvent: false }) : this.form.enable({ emitEvent: false });
    }
  }

  private patchLead(lead: Lead | null): void {
    if (!lead) {
      this.form.reset({
        id: [null],
        usuario_id: [null],
        fecha_de_entrada: '',
        empresa: '',
        nombre: '',
        web: '',
        correo: '',
        telefono: '',
        fuente: '',
        propietario_relaccion: '',
        notas: '',
        concepto_id: null,
        estado_id: null
      });
      return;
    }

    // Si solo vienen nombres, intenta resolver IDs contra catálogos
    let concepto_id = lead.concepto_id ?? null;
    if (!concepto_id && lead.concepto?.id) concepto_id = lead.concepto.id;
    if (!concepto_id && lead.concepto_nombre) {
      const c = this.conceptos.find((x) => x.nombre === lead.concepto_nombre);
      concepto_id = c?.id ?? null;
    }

    let estado_id = lead.estado_id ?? null;
    if (!estado_id && lead.estado?.id) estado_id = lead.estado.id;
    if (!estado_id && lead.estado_nombre) {
      const e = this.estados.find((x) => x.nombre === lead.estado_nombre);
      estado_id = e?.id ?? null;
    }

    this.form.patchValue({
      id: lead.id ?? null,
      usuario_id: lead.usuario_id ?? null,
      fecha_de_entrada: lead.fecha_de_entrada ?? '',
      empresa: lead.empresa ?? '',
      nombre: lead.nombre ?? '',
      web: lead.web ?? '',
      telefono: lead.telefono ?? '',
      correo: lead.correo ?? '',
      fuente: lead.fuente ?? '',
      propietario_relaccion: lead.propietario_relaccion ?? '',
      notas: lead.notas ?? '',
      concepto_id,
      estado_id
    });
  }

  onSubmit(): void {
    if (this.detail) return;
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    this.save.emit({
      id: value.id ?? undefined,
      usuario_id: value.usuario_id ?? undefined,
      fecha_de_entrada: value.fecha_de_entrada ?? undefined,
      empresa: value.empresa ?? undefined,
      nombre: value.nombre,
      web: value.web ?? undefined,
      telefono: value.telefono || null,
      correo: value.correo || null,
      fuente: value.fuente ?? undefined,
      propietario_relaccion: value.propietario_relaccion ?? undefined,
      notas: value.notas ?? undefined,
      concepto_id: value.concepto_id ?? null,
      estado_id: value.estado_id ?? null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}

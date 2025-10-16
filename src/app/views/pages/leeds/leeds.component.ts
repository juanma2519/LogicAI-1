// =====================================
// file: leeds.component.ts (Angular)
// Reemplazo completo compatible con tu HTML
// =====================================
import { Component, OnInit } from '@angular/core';
import { Lead, Concepto, Estado } from '../../../models/lead';
import { catchError, finalize } from 'rxjs/operators';
import { LeedsService } from '../../../services/leads.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControlDirective, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ContainerComponent, ButtonDirective, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, PopoverModule, PopoverDirective, TableModule, UtilitiesModule, InputGroupTextDirective, ModalModule, ProgressComponent } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';
import { LeadFormComponent } from '../leeds-form/leeds-form.component';
import { PaginationModule } from '@coreui/angular';
import { N8nService } from '../../../services/n8n.service';
import { of } from 'rxjs';
import { AlertComponent, AlertHeadingDirective } from '@coreui/angular';

@Component({
    selector: 'app-leeds',
    templateUrl: './leeds.component.html',
    imports: [AlertComponent, AlertHeadingDirective, PaginationModule, ContainerComponent, FormsModule, ButtonDirective, WidgetsBrandComponent, WidgetsDemoComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective,
        ProgressComponent, ModalModule, InputGroupComponent, LeadFormComponent, ReactiveFormsModule, PopoverModule, PopoverDirective, IconModule, TableModule, UtilitiesModule, InputGroupTextDirective, IconDirective, CommonModule]
})
export class LeadsComponent implements OnInit {
    // Datos
    leads: Lead[] = [];
    leadsFiltrados: Lead[] = [];
    conceptos: Concepto[] = [];
    estados: Estado[] = [];
    Math = Math;
    scraping: boolean = false;
    // Modal generar leads
    showGenModal = false;
    generateForm: FormGroup;
    generating = false;
    confirmGenerateModal = false;

    progress = 0;
    progressText = 'Iniciando...';
    progressColor = 'info';
    progressInterval: any;
    progressStartTime: number | null = null;
    progressDuration = 120000; // 3 minutos en ms

    // Opciones ejemplo (puedes cargarlas de API si quieres)
    negocios = ['Clínicas dentales', 'Gimnasios', 'Mudanzas'];
    ciudades = [
        'Madrid',
        'Barcelona',
        'Valencia',
        'Sevilla',
        'Zaragoza',
        'Málaga',
        'Murcia',
        'Palma de Mallorca',
        'Las Palmas de Gran Canaria',
        'Bilbao',
        'Alicante',
        'Córdoba',
        'Valladolid',
        'Vigo',
        'Gijón',
        'Hospitalet de Llobregat',
        'Vitoria-Gasteiz',
        'La Coruña',
        'Elche',
        'Granada',
        'Badalona',
        'Terrassa',
        'Sabadell',
        'Oviedo',
        'Móstoles',
        'Santa Cruz de Tenerife',
        'Pamplona',
        'Almería',
        'Alcalá de Henares',
        'Fuenlabrada',
        'Getafe',
        'San Sebastián',
        'Burgos',
        'Albacete',
        'Castellón de la Plana',
        'Santander',
        'Alcorcón',
        'Marbella',
        'Logroño',
        'Salamanca',
        'Huelva',
        'Lleida'
    ];

    // Filtros
    filtroConceptoId: number | null = null;
    filtroEstadoId: number | null = null;
    filtroCiudad: string | null = null;

    // UI/Estado
    cargando = false;
    formVisible = false;
    detail = false;

    // props de paginación
    page = 1;
    pageSize = 10;

    // Selección
    leadSeleccionado: Lead | null = null;
    leadFlag = false;

    // Ajusta de dónde tomas el usuario (auth service, etc.)
    private userId = Number(localStorage.getItem('userId'));

    constructor(private api: LeedsService, private fb: FormBuilder, private webhokService: N8nService) {
        this.generateForm = this.fb.group({
            negocio: ['', Validators.required],
            ciudad: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        const saved = sessionStorage.getItem('leadProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.progressStartTime = data.startTime;
            this.generating = true;
            this.restoreProgress();
        }
        this.cargarCatalogos();
        this.cargarLeads();
    }

    private restoreProgress() {
        const data = JSON.parse(sessionStorage.getItem('leadProgress')!);
        const elapsed = Date.now() - data.startTime;

        if (elapsed >= this.progressDuration) {
            this.progress = 100;
            this.progressText = '¡Completado!';
            this.progressColor = 'success';
            sessionStorage.removeItem('leadProgress');
            return;
        }

        // Calcula cuánto queda y reanuda desde ahí
        this.progress = Math.min((elapsed / this.progressDuration) * 100, 100);
        this.progressText = 'Reanudando progreso...';
        this.progressColor = 'info';

        this.startProgressTimer();
    }

    private startProgressTimer() {
        const startTime = this.progressStartTime!;
        const intervalMs = 1000; // cada segundo

        clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            this.progress = Math.min((elapsed / this.progressDuration) * 100, 100);
            if (this.progress >= 100) {
                this.progress = 100;
                this.generating = false;
                this.progressText = '¡Completado!';
                this.progressColor = 'success';
                clearInterval(this.progressInterval);
                sessionStorage.removeItem('leadProgress'); // limpieza
                this.cargarLeads();
            }

            // Guarda progreso en sesión cada tick
            sessionStorage.setItem('leadProgress', JSON.stringify({ startTime }));
        }, intervalMs);
    }

    private cargarCatalogos(): void {
        this.api.getConceptos().subscribe((c) => (this.conceptos = c || []));
        this.api.getEstados().subscribe((e) => (this.estados = e || []));
    }

    private cargarLeads(): void {
        this.cargando = true;
        this.api
            .getLeadsByUser(this.userId)
            .pipe(finalize(() => (this.cargando = false)))
            .subscribe((leads) => {
                this.leads = (leads || []).map((l) => ({
                    ...l,
                    // compatibilidad: si viene solo nombre, lo mostramos igualmente
                    concepto_nombre: l.concepto?.nombre ?? l.concepto_nombre ?? null,
                    estado_nombre: l.estado?.nombre ?? l.estado_nombre ?? null
                }));
                this.aplicarFiltros();
            });
        this.resetPagination();
    }

    getConceptoNombre(id: number | null): string {
        if (!id || !this.conceptos) return '—';
        const c = this.conceptos.find((x: any) => x.id === id);
        return c ? c.nombre : '—';
    }

    getEstadoNombre(id: number | null): string {
        if (!id || !this.estados) return '—';
        const c = this.estados.find((x: any) => x.id === id);
        return c ? c.nombre : '—';
    }

    aplicarFiltros(): void {
        this.leadsFiltrados = this.leads.filter((l) => {
            const conceptoId = l.concepto?.id ?? l.concepto_id ?? null;
            const estadoId = l.estado?.id ?? l.estado_id ?? null;
            const ciudad = l.ciudad ?? l.ciudad ?? null;
            const passConcepto = this.filtroConceptoId ? conceptoId === this.filtroConceptoId : true;
            const passEstado = this.filtroEstadoId ? estadoId === this.filtroEstadoId : true;
            const passCiudad = this.filtroCiudad ? ciudad === this.filtroCiudad : true;
            return passConcepto && passEstado && passCiudad;
        });
        this.resetPagination();
    }

    private resetPagination() {
        this.page = 1;
    }

    // utilidades
    goTo(p: number) {
        this.page = Math.min(Math.max(1, p), this.totalPages);
    }
    onPageSizeChange(ps: number) {
        this.pageSize = +ps;
        this.page = 1;
    }
    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }


    // si ya tienes leadsFiltrados, úsalo tal cual; aquí solo derivamos el “slice”
    get baseList(): any[] {
        return (this.leadsFiltrados && this.leadsFiltrados.length > 0)
            ? this.leadsFiltrados
            : (this.leads || []);
    }

    get totalItems(): number {
        return this.baseList.length;
    }
    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    }
    get pagedLeads(): any[] {
        const start = (this.page - 1) * this.pageSize;
        return this.baseList.slice(start, start + this.pageSize);
    }

    // ----- UI handlers -----
    nuevoLead(): void {
        this.leadSeleccionado = {
            usuario_id: this.userId,
            fecha_entrada: '',
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
        };
        this.detail = false;
        this.leadFlag = true;
        this.formVisible = true;
    }

    editarLead(lead: Lead): void {
        this.leadSeleccionado = { ...lead };
        this.leadFlag = true;
        // normaliza ids si solo tenemos nombres
        if (!this.leadSeleccionado.concepto_id && this.leadSeleccionado.concepto_nombre) {
            const c = this.conceptos.find((x) => x.nombre === this.leadSeleccionado!.concepto_nombre!);
            this.leadSeleccionado.concepto_id = c?.id ?? null;
        }
        if (!this.leadSeleccionado.estado_id && this.leadSeleccionado.estado_nombre) {
            const e = this.estados.find((x) => x.nombre === this.leadSeleccionado!.estado_nombre!);
            this.leadSeleccionado.estado_id = e?.id ?? null;
        }
        this.detail = false;
        this.formVisible = true;
    }

    verDetalle(lead: Lead): void {
        this.leadSeleccionado = { ...lead };
        this.leadFlag = true;
        this.detail = true;
        this.formVisible = true;
    }

    borrarLead(lead: Lead): void {
        this.leadFlag = true;
        if (!lead.id) return;
        if (!confirm('¿Eliminar este lead?')) return;
        this.api.deleteLead(lead.id).subscribe(() => {
            this.leads = this.leads.filter((l) => l.id !== lead.id);
            this.aplicarFiltros();
            this.cargarLeads();
            this.leadFlag = true;
        });
    }

    importarLeads(): void {
        // Abre file input invisible
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            this.api.importLeads(file).subscribe((res) => {
                alert(`Importación OK\nCreados: ${res.created}\nActualizados: ${res.updated}\nErrores: ${res.errors?.length || 0}`);
                this.cargarLeads();
            });
        };
        input.click();
    }

    // ----- Form events -----
    guardarLead(payload: Partial<Lead>): void {
        const data: Partial<Lead> = {
            ...payload,
            usuario_id: payload.usuario_id ?? this.userId
        };

        // decide create/update
        if (payload.id) {
            this.api.updateLead(payload.id, data).subscribe((updated) => {
                // sustituye en memoria
                const idx = this.leads.findIndex((l) => l.id === updated.id);
                if (idx >= 0) this.leads[idx] = updated;
                this.aplicarFiltros();
                this.formVisible = false;
            });
        } else {
            this.api.createLeadByUser(this.userId, data).subscribe((created) => {
                this.leads.unshift(created);
                this.aplicarFiltros();
                this.formVisible = false;
            });
        }
    }

    // Llamado por (click)="generarLeads()"
    generarLeads() {
        this.generateForm.reset();
        this.showGenModal = true;
    }

    closeGenerateModal() {
        this.showGenModal = false;
    }

    submitGenerate() {
        if (this.generateForm.invalid) return;
        this.generating = true;
        const payload = this.generateForm.value; // { negocio, ciudad }

        this.api.generateLeads(this.userId, payload).subscribe({
            next: () => {
                this.showGenModal = false;
                // refresca tu tabla si procede
                this.cargarLeads();
            },
            error: (err) => {
                this.generating = false;
                console.error(err);
                alert('Error al solicitar la generación de leads.');
            }
        });
    }

    abrirConfirmacion() {
        this.confirmGenerateModal = true;
    }

    confirmarGeneracion() {
        this.submitGenerate(); // llama a la función real que inicia el proceso
        this.confirmGenerateModal = false;
        // Reiniciar barra
        this.progress = 0;
        this.progressText = 'Procesando generación de leads...';
        this.progressColor = 'info';
        this.progressStartTime = Date.now();
        const duration = 120; // segundos (3 minutos)
        const stepTime = 1000; // cada 1s
        const increment = 100 / duration;
        sessionStorage.setItem('leadProgress', JSON.stringify({ startTime: this.progressStartTime }));

        clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
            this.progress += increment;

            if (this.progress >= 100) {
                this.progress = 100;
                this.progressText = '¡Completado!';
                this.progressColor = 'success';
                sessionStorage.removeItem('leadProgress');
                clearInterval(this.progressInterval);
                this.generating = false;
                this.cargarLeads();
            }
        }, stepTime);

    }

    cancelarGeneracion() {
        this.confirmGenerateModal = false;
    }

    
  scrapWeb(lead: Lead): void {
    if (!lead) return;

    const url = (lead.web as string).trim();
    if (!url) return;
    this.scraping = true;
    this.webhokService.puppeter(url, this.userId, lead.id || 0).subscribe((updated) => {
                // sustituye en memoria
    this.scraping = false;
    });
  }
}

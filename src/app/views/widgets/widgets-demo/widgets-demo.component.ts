import { Component, Input, OnInit } from '@angular/core';
import { WidgetStatsService, WidgetStats } from '../../../services/widget-stats-service';
import { ButtonDirective, DropdownComponent, DropdownDividerDirective, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective, TemplateIdDirective, WidgetStatAComponent } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { RouterLink } from '@angular/router';
import { ChartjsComponent } from '@coreui/angular-chartjs';

@Component({
  selector: 'app-widgets-demo',
  templateUrl: './widgets-demo.component.html',
  imports: [ WidgetStatAComponent, TemplateIdDirective, IconDirective, DropdownComponent, ButtonDirective, DropdownToggleDirective, DropdownMenuDirective, DropdownItemDirective, RouterLink, DropdownDividerDirective, ChartjsComponent]
})
export class WidgetsDemoComponent implements OnInit {
  @Input() adminMode: boolean = false;   // si true → /usage/admin/summary
  @Input() demoKey?: string;             // ej. 'text-to-image'
  @Input() userId?: number | string;     // si no viene, lo coge de localStorage
  @Input() pageType: string = ''; // 👈 recibe el tipo de página

  // Mapa de colores según el tipo
  private colorMap: Record<string, string> = {
    'text-to-image': 'primary',     // azul → generación visual desde texto
    'image-to-video': 'info',       // celeste → transformación multimedia
    'text-to-carrusel': 'warning',  // amarillo → contenido tipo presentación
    'text-to-music': 'success',     // verde → generación de audio/música
    'text-to-subtitle': 'danger',
    home: 'primary',
    productos: 'info',
    clientes: 'warning',
    error: 'danger'
  };

  valueText = '...';
  deltaPercent = 0;
  data: any[] = [{}];
  options: any[] = [{}];

  constructor(private stats: WidgetStatsService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  get color(): string {
    return this.colorMap[this.pageType] || 'primary'; // fallback
  }

  private loadStats(): void {
    if (this.adminMode) {
      this.stats.getAdminWidgetStats().subscribe(w => this.applyStats(w));
    } else {
      const uid = this.userId ?? Number(localStorage.getItem('userId') || 0);
      this.stats.getUserWidgetStats(uid, this.demoKey).subscribe(w => this.applyStats(w));
    }
  }

  private applyStats(w: WidgetStats): void {
    this.valueText = w.valueText;
    this.deltaPercent = w.deltaPercent;
    this.data = [w.chartData];
    this.options = [w.chartOptions];
  }
}

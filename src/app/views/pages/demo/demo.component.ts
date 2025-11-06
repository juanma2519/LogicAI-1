import { Component } from '@angular/core';
import { N8nService } from '../../../services/n8n.service';
import { ButtonDirective, CardBodyComponent, CardComponent, ColComponent, ContainerComponent, FormControlDirective, InputGroupComponent, InputGroupTextDirective, RowComponent, UtilitiesModule } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { CommonModule, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsageService } from '../../../services/usage.service';

@Component({
  selector: 'app-n8n-input',
  templateUrl: './demo.component.html',
  imports: [ContainerComponent, FormsModule, ButtonDirective, WidgetsDemoComponent, RowComponent, ColComponent, CardComponent,
    InputGroupComponent, UtilitiesModule, FormControlDirective, NgStyle, CommonModule]
})
export class DemoComponent {
  textToImage = '';
  imageToVideo = '';
  textToSubtitles = '';
  textToMusic = '';
  carouselIdea = '';

  public blobUrl!: SafeUrl;

  response: any;

  constructor(private n8nService: N8nService, private sanitizer: DomSanitizer, private usage: UsageService) { }

  // Función que llama al servicio con tipo y texto
  sendToN8n(type: string, value: string) {
    
    if (!value) {
      this.response = { error: 'Debe ingresar un valor' };
      return;
    }

    this.n8nService.triggerWebhook(type, value).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        this.blobUrl = url; // <img [src]="blobUrl">

        const userId = Number(localStorage.getItem('userId') || 0);

        // 2) Registrar uso (no bloquea la acción principal)
        this.usage.create({
          usuario_id: userId,
          demo_key: type,
          meta: { inputPreview: value?.slice(0, 200) || '' }
        }).subscribe({ next: () => {}, error: () => {} });
      },
      error: err => console.error('Error fetching blob', err)
    });
  }
}
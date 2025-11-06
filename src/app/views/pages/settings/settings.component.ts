import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PricingService, ModelPricing } from '../../../services/pricing.service';
import { ContainerComponent, ButtonDirective, CardComponent, PopoverModule, TableModule, UtilitiesModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

type DemoKey =
  | 'text-to-image'
  | 'image-to-video'
  | 'text-to-subtitle'
  | 'text-to-music'
  | 'text-to-carrusel';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ContainerComponent, FormsModule, ButtonDirective, CardComponent,
         ReactiveFormsModule, PopoverModule, IconModule, TableModule, UtilitiesModule, CommonModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  // formulario de selección
  form!: FormGroup;

  // datos de precios
  allModels: ModelPricing[] = [];
  loading = false;
  error?: string;

  constructor(private fb: FormBuilder, private pricing: PricingService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      // Text → Image
      textModel_for_TextToImage: [''],
      imageModel_for_TextToImage: [''],

      // Image → Video
      imageModel_for_ImageToVideo: [''],
      videoModel_for_ImageToVideo: [''],

      // Text → Subtitle
      textModel_for_TextToSubtitle: [''],

      // Text → Music
      textModel_for_TextToMusic: [''],
      musicModel_for_TextToMusic: [''],

      // Text → Carrusel
      textModel_for_TextToCarrusel: [''],
      imageModel_for_TextToCarrusel: ['']
    });

    this.loadPricing();
  }

  loadPricing() {
    this.loading = true;
    this.pricing.getAll(true).subscribe({
      next: (data) => {
        this.loading = false;
        // ordenamos un poco y guardamos
        this.allModels = [...data].sort((a, b) =>
          (a.family || '').localeCompare(b.family || '') || (a.model_name).localeCompare(b.model_name)
        );
      },
      error: (err) => {
        this.loading = false;
        this.error = typeof err?.error === 'string' ? err.error : 'No se pudieron cargar los precios.';
      }
    });
  }

  // ======= Categorización básica por tipo de tarea =======
  // Modelos de TEXTO (LLM general): OpenAI GPT (gpt-5/4.1/4o/3.5), Claude, Gemini 1.5 (flash/pro)
  get textModels(): ModelPricing[] {
    return this.allModels.filter(m =>
      ['gpt-5','gpt-4.1','gpt-4o','gpt-3.5','claude','gemini'].includes((m.family || '').toLowerCase()) &&
      m.price_input_per_mtok != null && m.price_output_per_mtok != null
    );
  }

  // Modelos de IMAGEN (generación): gpt-image-1, gemini-image-*
  get imageModels(): ModelPricing[] {
    return this.allModels.filter(m =>
      ['image','gemini-image'].includes((m.family || '').toLowerCase()) &&
      m.price_image_per_unit != null
    );
  }

  // Modelos de VIDEO / Realtime (si usas alguno para pipeline de video)
  get videoModels(): ModelPricing[] {
    return this.allModels.filter(m =>
      ['realtime','video'].includes((m.family || '').toLowerCase()) ||
      m.price_video_per_second != null
    );
  }

  // Modelos de AUDIO: TTS y/o Transcribe (por si tu pipeline de música necesita voces/generación)
  get audioModels(): ModelPricing[] {
    return this.allModels.filter(m =>
      (m.price_tts_per_1k_chars != null) || (m.price_audio_transc_per_min != null)
    );
  }

  // ========= Helpers de UI =========
  asTextLabel(m: ModelPricing): string {
    // "gpt-5-mini — in $0.25 / out $2.00"
    const inp = m.price_input_per_mtok != null ? `$${m.price_input_per_mtok}` : '-';
    const out = m.price_output_per_mtok != null ? `$${m.price_output_per_mtok}` : '-';
    return `${m.model_name} — in ${inp} / out ${out}`;
  }

  asImageLabel(m: ModelPricing): string {
    const img = m.price_image_per_unit != null ? `$${m.price_image_per_unit} por imagen` : '';
    return `${m.model_name}${img ? ' — ' + img : ''}`;
  }

  asVideoLabel(m: ModelPricing): string {
    const sec = m.price_video_per_second != null ? `$${m.price_video_per_second}/seg` : '';
    const inp = m.price_input_per_mtok != null ? `$${m.price_input_per_mtok}` : '';
    const out = m.price_output_per_mtok != null ? `$${m.price_output_per_mtok}` : '';
    const io = (inp || out) ? `in ${inp || '-'} / out ${out || '-'}` : '';
    const price = [io, sec].filter(Boolean).join(' · ');
    return `${m.model_name}${price ? ' — ' + price : ''}`;
  }

  asAudioLabel(m: ModelPricing): string {
    const tts = m.price_tts_per_1k_chars != null ? `TTS $${m.price_tts_per_1k_chars}/1k chars` : '';
    const tr  = m.price_audio_transc_per_min != null ? `Transcribe $${m.price_audio_transc_per_min}/min` : '';
    const both = [tts, tr].filter(Boolean).join(' · ');
    return `${m.model_name}${both ? ' — ' + both : ''}`;
  }

  // (Opcional) guardar en backend tus elecciones de settings
  guardarSettings() {
    // aquí podrías llamar a tu endpoint /settings para persistir selección por usuario
    // console.log(this.form.value);
  }
}

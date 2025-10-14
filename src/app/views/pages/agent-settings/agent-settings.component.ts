import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormControl
} from '@angular/forms';
import { IconDirective } from '@coreui/icons-angular';
// CoreUI
import {
  CardModule, ButtonModule, FormModule, GridModule, Tabs2Module,
  AlertModule, ModalModule, ListGroupModule, BadgeModule
} from '@coreui/angular';

import { ElevenService, ElevenAgent, ElevenVoice } from '../../../services/eleven.service';

@Component({
  selector: 'app-agent-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    // CoreUI
    GridModule, CardModule, ButtonModule, FormModule, Tabs2Module, AlertModule,
    ModalModule, ListGroupModule, BadgeModule, IconDirective
  ],
  templateUrl: './agent-settings.component.html'
})
export class AgentSettingsComponent implements OnInit {
  @Input({ required: true }) agent!: ElevenAgent;               // agente actual (con agent_id)
  @Output() saved = new EventEmitter<ElevenAgent>();
  @Output() cancelled = new EventEmitter<void>();

  activeItemKey: string = 'home';   // pestaña inicial

  handleChange(key: string | number | undefined) {
    this.activeItemKey = String(key ?? 'home');
  }

  form!: FormGroup;

  // voces
  voices: ElevenVoice[] = [];
  filteredVoices: ElevenVoice[] = [];
  voicesModal = false;
  voiceSearch = new FormControl<string>('', { nonNullable: true });

  loading = false;
  error?: string;

  constructor(private fb: FormBuilder, private eleven: ElevenService) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadVoices();

    this.voiceSearch.valueChanges.subscribe(q => this.applyVoiceFilter(q));

    if (this.agent) {
      this.patchAgent(this.agent);
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],

      // campos de texto simples
      first_message: [''],   // 👈 nuevo
      language: [''],        // 👈 nuevo
      prompt: [''],          // 👈 nuevo
      system_prompt: [''],

      voice_id: [''],
      llm_model: [''],
      temperature: [0.7],

      // grupos anidados
      conversation_config: this.fb.group({
        asr: this.fb.group({
          provider: ['elevenlabs'],
          quality: ['high'],
          user_input_audio_format: ['pcm_8000'],
          keywords: this.fb.array<string>([])
        }),
        tts: this.fb.group({
          stability: [0.4],
          similarity_boost: [0.8],
          speed: [1.0] // 👈 nuevo
        }),
        turn: this.fb.group({
          turn_timeout: [7],
          silence_end_call_timeout: [-1]
        }),
        llm: this.fb.group({
          model_id: [''],
          temperature: [0.7]
        })
      }),

      platform_settings: this.fb.group({
        webchat: this.fb.group({
          barge_in: [true],
          show_typing: [true]
        }),
        phone: this.fb.group({
          dtmf_enabled: [true]
        })
      }),

      knowledge_base: this.fb.group({
        usage_mode: ['auto']
      }),

      tags: this.fb.array<string>([]),
      tools: this.fb.array<FormGroup>([])
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes['agent'] && this.agent) {
      this.patchAgent(this.agent);
      this.form.patchValue(this.agent, { emitEvent: false });
      this.activeItemKey = "basic";
    }
  }

  // Helpers de arrays
  get tagsFA() { return this.form.controls['tags'] as FormArray<FormControl<string>>; }
  get keywordsFA() {
    return (this.form.get('conversation_config.asr.keywords') as FormArray<FormControl<string>>);
  }
  get toolsFA() { return this.form.controls['tools'] as FormArray<FormGroup>; }

  addTag() { this.tagsFA.push(new FormControl<string>('', { nonNullable: true })); }
  removeTag(i: number) { this.tagsFA.removeAt(i); }

  addKeyword() { this.keywordsFA.push(new FormControl<string>('', { nonNullable: true })); }
  removeKeyword(i: number) { this.keywordsFA.removeAt(i); }

  addTool() {
    this.toolsFA.push(this.fb.group({
      tool_id: [''],
      tool_config: [''] // JSON en string, se parsea al guardar
    }));
  }
  removeTool(i: number) { this.toolsFA.removeAt(i); }

  // Voces
  loadVoices() {
    this.eleven.listVoices().subscribe({
      next: (res) => {
        this.voices = res?.voices || [];
        this.filteredVoices = this.voices.slice();
      },
      error: () => { this.voices = []; this.filteredVoices = []; }
    });
  }
  openVoicesModal() { this.voicesModal = true; this.applyVoiceFilter(this.voiceSearch.value); }
  closeVoicesModal() { this.voicesModal = false; }
  applyVoiceFilter(q: string | null | undefined) {
    const term = (q ?? '').trim().toLowerCase();
    if (!term) { this.filteredVoices = this.voices.slice(); return; }
    this.filteredVoices = this.voices.filter(v => {
      const txt = [
        v.name, v.category,
        (v as any)?.labels?.gender,
        (v as any)?.labels?.language,
        (v as any)?.labels?.accent,
        (v as any)?.labels?.use_case,
        v.description
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ');
      return txt.includes(term);
    });
  }
  selectVoice(v: ElevenVoice) {
    this.form.controls['voice_id'].setValue(v.voice_id);
    this.voicesModal = false;
  }
  playVoice(url?: string) {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(err => console.error('Error preview voz', err));
  }

  // Getters display
  getVoiceSummary(v: ElevenVoice) {
    const g = (v as any)?.labels?.gender ?? 'n/a';
    const l = (v as any)?.labels?.language ?? '—';
    const a = (v as any)?.labels?.accent ?? '';
    const u = (v as any)?.labels?.use_case ?? '';
    return [v.category || 'custom', g, l, a, u].filter(Boolean).join(' • ');
  }

  // Cargar datos del agente en el form
  private patchAgent(a: ElevenAgent) {

    const vid = a?.voice_id ?? (a as any).conversation_config?.tts?.voice_id ?? '';
    this.form.get('voice_id')?.setValue(vid, { emitEvent: false });

    const description =
      a?.description ??
      (a as any)?.agent?.agent?.description ?? // por si algún día lo traes anidado
      '';

    const voice_id =
      (a as any)?.conversation_config?.tts.voice_id;

    this.form.controls['voice_id'].setValue(voice_id);

    // tags
    this.tagsFA.clear();
    (a as any).tags?.forEach((t: string) => this.tagsFA.push(new FormControl<string>(t, { nonNullable: true })));

    // conversation_config.keywords
    const kw = (a as any)?.conversation_config?.asr?.keywords || [];
    this.keywordsFA.clear();
    kw.forEach((k: string) => this.keywordsFA.push(new FormControl<string>(k, { nonNullable: true })));

    // tools
    this.toolsFA.clear();
    const tools = (a as any)?.tools || [];
    tools.forEach((t: any) => {
      this.toolsFA.push(this.fb.group({
        tool_id: [t?.tool_id || ''],
        tool_config: [JSON.stringify(t?.tool_config ?? {}, null, 2)]
      }));
    });

    // patch general (copiamos seguros)
    this.form.patchValue({
      name: a.name || '',
      description: (a as any).description || '',
      voice_id: (a as any).voice_id || '',
      llm_model: (a as any).llm_model || '',
      temperature: (a as any).temperature ?? 0.7,
      system_prompt: (a as any).system_prompt || '',
      conversation_config: {
        asr: {
          provider: (a as any)?.conversation_config?.asr?.provider ?? 'elevenlabs',
          quality: (a as any)?.conversation_config?.asr?.quality ?? 'high',
          user_input_audio_format: (a as any)?.conversation_config?.asr?.user_input_audio_format ?? 'pcm_8000'
        },
        tts: {
          stability: (a as any)?.conversation_config?.tts?.stability ?? 0.4,
          similarity_boost: (a as any)?.conversation_config?.tts?.similarity_boost ?? 0.8
        },
        turn: {
          turn_timeout: (a as any)?.conversation_config?.turn?.turn_timeout ?? 7,
          silence_end_call_timeout: (a as any)?.conversation_config?.turn?.silence_end_call_timeout ?? -1
        },
        llm: {
          model_id: (a as any)?.conversation_config?.llm?.model_id ?? '',
          temperature: (a as any)?.conversation_config?.llm?.temperature ?? 0.7
        }
      },
      platform_settings: {
        webchat: {
          barge_in: (a as any)?.platform_settings?.webchat?.barge_in ?? true,
          show_typing: (a as any)?.platform_settings?.webchat?.show_typing ?? true
        },
        phone: {
          dtmf_enabled: (a as any)?.platform_settings?.phone?.dtmf_enabled ?? true
        }
      },
      knowledge_base: {
        usage_mode: (a as any)?.knowledge_base?.usage_mode ?? 'auto'
      }
    });
  }

  // Guardar cambios → PATCH ElevenLabs
  save() {
    if (!this.agent?.agent_id) { this.error = 'Agente inválido'; return; }

    // Construir payload a partir del form (limpio)
    const raw = this.form.getRawValue();
    const payload: any = {
      name: raw.name,
      description: raw.description,
      voice_id: raw.voice_id || undefined,
      llm_model: raw.llm_model || undefined,
      temperature: raw.temperature,
      system_prompt: raw.system_prompt || undefined,
      tags: (raw.tags || []).filter(Boolean),

      conversation_config: {
        asr: {
          provider: raw.conversation_config.asr.provider,
          quality: raw.conversation_config.asr.quality,
          user_input_audio_format: raw.conversation_config.asr.user_input_audio_format,
          keywords: (raw.conversation_config.asr as any).keywords?.filter(Boolean) || []
        },
        tts: {
          stability: Number(raw.conversation_config.tts.stability),
          similarity_boost: Number(raw.conversation_config.tts.similarity_boost)
        },
        turn: {
          turn_timeout: Number(raw.conversation_config.turn.turn_timeout),
          silence_end_call_timeout: Number(raw.conversation_config.turn.silence_end_call_timeout)
        },
        llm: {
          model_id: raw.conversation_config.llm.model_id || undefined,
          temperature: Number(raw.conversation_config.llm.temperature)
        }
      },

      platform_settings: {
        webchat: {
          barge_in: !!raw.platform_settings.webchat.barge_in,
          show_typing: !!raw.platform_settings.webchat.show_typing
        },
        phone: {
          dtmf_enabled: !!raw.platform_settings.phone.dtmf_enabled
        }
      },

      knowledge_base: {
        usage_mode: raw.knowledge_base.usage_mode
      },

      tools: (raw.tools || []).map((t: any) => {
        let parsed = {};
        if (t.tool_config && String(t.tool_config).trim()) {
          try { parsed = JSON.parse(t.tool_config); } catch { parsed = {}; }
        }
        return { tool_id: t.tool_id, tool_config: parsed };
      })
    };

    this.loading = true;
    this.error = undefined;

    if (this.agent?.agent_id) {
      this.eleven.updateAgent(this.agent.agent_id, payload).subscribe({
        next: (updated: any) => {
          this.loading = false;
          this.saved.emit(updated);
        },
        error: (err: any) => {
          this.loading = false;
          this.error = 'No se pudo guardar la configuración.';
          console.error('[agent-settings] update error', err);
        }
      });
    } else {
      this.eleven.createAgent(payload).subscribe({
        next: (updated: any) => {
          this.loading = false;
          this.saved.emit(updated);
        },
        error: (err: any) => {
          this.loading = false;
          this.error = 'No se pudo guardar la configuración.';
          console.error('[agent-settings] update error', err);
        }
      });
    }


  }

  cancel() {
    this.cancelled.emit();
  }
}

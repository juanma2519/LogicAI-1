import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule, FormControl } from '@angular/forms';
import { ElevenService, ElevenAgent, ElevenVoice } from '../../../services/eleven.service';

// CoreUI
import { GridModule, CardModule, ButtonModule, TableModule, ModalModule, AlertModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { AgentSettingsComponent } from '../agent-settings/agent-settings.component'

@Component({
    selector: 'app-eleven-agents',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AgentSettingsComponent,
        GridModule, CardModule, ButtonModule, FormsModule, TableModule, ModalModule, AlertModule, IconModule],
    templateUrl: './agents.component.html',
    styleUrls:['./agents.component.scss']
})
export class AgentsComponent implements OnInit {
    loading = false;
    error?: string;
    agents: ElevenAgent[] = [];
    voices: ElevenVoice[] = [];
    filteredVoices: ElevenVoice[] = [];
    voiceSearch = new FormControl<string>('', { nonNullable: true });
    voicesModal = false;
    agentActual: ElevenAgent = {
        agent_id: '',
        name: ''
    };
    // UI state
    modalOpen = false;
    editId: string | null = null;

    form!: FormGroup;

    // simulación (si lo usabas)
    simAgentId: string | null = null;
    simUserText: FormControl<string> = new FormControl<string>('', { nonNullable: true });
    simLog: { role: 'user' | 'assistant' | 'system', content: string }[] = [];

    constructor(private fb: FormBuilder, private eleven: ElevenService) { }

    ngOnInit(): void {
        this.buildForm();
        this.loadAll();
        this.voiceSearch.valueChanges.subscribe(q => this.applyVoiceFilter(q));
    }

    private buildForm() {
        this.form = this.fb.group({
            // === Básico ===
            name: ['', Validators.required],
            description: [''],
            tags: this.fb.array<string>([]),

            // === Voz & LLM ===
            voice_id: [''],
            llm_model: [''],
            temperature: [0.7],

            // === Prompt / Inicialización ===
            first_message: [''],           // ⬅️ NUEVO
            language: [''],                // ⬅️ NUEVO (ej: es, en, fr…)
            system_prompt: [''],           // prompt de sistema general
            prompt: [''],                  // ⬅️ NUEVO (prompt específico que el cliente quiere)

            // === Conversación ===
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
                    speed: [1.0]               // ⬅️ NUEVO (1.0 normal)
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

            // === Plataforma ===
            platform_settings: this.fb.group({
                webchat: this.fb.group({
                    barge_in: [true],
                    show_typing: [true]
                }),
                phone: this.fb.group({
                    dtmf_enabled: [true]
                })
            }),

            // === Knowledge Base ===
            knowledge_base: this.fb.group({
                usage_mode: ['auto']
            }),

            // === Tools ===
            tools: this.fb.array<FormGroup>([])
        });
    }

    loadAll() {
        this.loading = true;
        this.error = undefined;
        this.eleven.listAgents().subscribe({
            next: (ags) => {
                this.agents = ags.agents || [];
                this.loading = false;
            },
            error: (e) => { this.loading = false; this.error = 'No se pudieron cargar los agentes.'; }
        });
        this.eleven.listVoices().subscribe({
            next: (v) => { this.voices = v.voices || [] },
            error: () => { /* silencioso */ }
        });
    }

    openCreate() {
        this.editId = null;
        this.agentActual = {
            agent_id: '', name: '', description: '', voice_id: '', llm_model: '',
            temperature: 0.7, active: true
        } as ElevenAgent; // objeto vacío inicial
        this.modalOpen = true;

    }


    openEdit(a: any) {
        this.eleven.getAgent(a.agent_id).subscribe({
            next: (ags) => {
                a = ags || [];
                this.loading = false;
                this.editId = a.agent_id;
                this.modalOpen = true;
                this.agentActual = a;
                this.form.patchValue({
                    name: a.displayName || '',
                    description: a.description || '',
                    voice_id: a.conversation_config.tts.voice_id || '',
                    llm_model: a.llm_model || '',
                    temperature: a.temperature ?? 0.7
                });
            },
            error: (e) => { this.loading = false; this.error = 'No se pudieron cargar los agentes.'; }
        });

        this.modalOpen = true;
    }
    save() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        const payload = this.form.getRawValue();

        const obs = this.editId
            ? this.eleven.updateAgent(this.editId, payload)
            : this.eleven.createAgent(payload);

        obs.subscribe({
            next: () => { this.modalOpen = false; this.loadAll(); },
            error: () => { this.error = 'No se ha podido guardar el agente.'; }
        });
    }
    remove(a: ElevenAgent) {
        if (!confirm(`Eliminar agente "${a.name}"?`)) return;
        this.eleven.deleteAgent(a.agent_id).subscribe({
            next: () => this.loadAll(),
            error: () => this.error = 'No se pudo eliminar el agente.'
        });
    }
    duplicate(a: ElevenAgent) {
        this.eleven.duplicateAgent(a.agent_id).subscribe({
            next: () => this.loadAll(),
            error: () => this.error = 'No se pudo duplicar el agente.'
        });
    }

    startSimulate(a: ElevenAgent) {
        this.simAgentId = a.agent_id;
        this.simLog = [{ role: 'system', content: `Simulando con agente: ${a.displayName}` }];
        this.simUserText.setValue('');
    }
    sendUserMessage() {
        if (!this.simAgentId || !this.simUserText) return;
        const msg = this.simUserText.toString();
        this.simLog.push({ role: 'user', content: msg });

        this.eleven.simulateConversation(this.simAgentId, this.simLog.slice(-6)) // últimas 6 como contexto
            .subscribe({
                next: (resp) => {
                    // la API devuelve la respuesta; ajusta según payload real
                    const assistantReply = (resp?.messages?.slice(-1)?.[0]?.content) || JSON.stringify(resp);
                    this.simLog.push({ role: 'assistant', content: assistantReply });
                    this.simUserText.setValue('');
                },
                error: () => this.simLog.push({ role: 'system', content: 'Error al simular la conversación.' })
            });
    }

    getGender(v: ElevenVoice) {
        // Evita TS4111: accede con optional chaining y fallback
        // Si en tu interfaz tipaste labels, puedes usar v.labels?.gender directamente.
        return (v as any)?.labels?.gender ?? 'n/a';
    }

    getLanguage(v: ElevenVoice) {
        return (v as any)?.labels?.language ?? '—';
    }

    getAccent(v: ElevenVoice) {
        return (v as any)?.labels?.accent ?? '';
    }

    getUseCase(v: ElevenVoice) {
        return (v as any)?.labels?.use_case ?? '';
    }

    getVoiceSummary(v: ElevenVoice) {
        const parts = [
            v.category || 'custom',
            this.getGender(v),
            this.getLanguage(v),
            this.getAccent(v) || '',
            this.getUseCase(v) || ''
        ].filter(Boolean);
        return parts.join(' • ');
    }

    /* =========================
       Modal de voces
       ========================= */

    openVoicesModal() {
        this.voicesModal = true;
        this.applyVoiceFilter(this.voiceSearch.value);
    }

    closeVoicesModal() {
        this.voicesModal = false;
    }

    applyVoiceFilter(q: string | null | undefined) {
        const term = (q ?? '').trim().toLowerCase();
        if (!term) {
            this.filteredVoices = this.voices.slice();
            return;
        }
        this.filteredVoices = this.voices.filter(v => {
            const hay = [
                v.name,
                v.category,
                (v as any)?.labels?.gender,
                (v as any)?.labels?.language,
                (v as any)?.labels?.accent,
                (v as any)?.labels?.use_case,
                v.description
            ].map(x => (x ?? '').toString().toLowerCase()).join(' ');
            return hay.includes(term);
        });
    }

    selectVoice(v: ElevenVoice) {
        this.form.controls['voice_id'].setValue(v.voice_id);
        this.voicesModal = false;
    }

    playVoice(url?: string) {
        if (!url) return;
        const audio = new Audio(url);
        audio.play().catch(err => console.error('Error al reproducir preview', err));
    }

    onSaved(updated: ElevenAgent) {
        this.modalOpen = false;
        this.editId = null;
        this.agentActual = {
            agent_id: '',
            name: '',
            description: '',
            voice_id: '',
            llm_model: '',
            temperature: 0.7,
            active: true
        } as ElevenAgent;
        this.loadAll(); // refrescamos listado
    }

    onCancel() {
        this.modalOpen = false;
        this.editId = null;
        this.agentActual = {
            agent_id: '',
            name: '',
            description: '',
            voice_id: '',
            llm_model: '',
            temperature: 0.7,
            active: true
        } as ElevenAgent;
    }
}

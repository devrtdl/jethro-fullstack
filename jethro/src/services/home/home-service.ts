import { apiClient } from '@/src/services/api/client';
import { getAuthHeaders } from '@/src/lib/auth-headers';

export type Devocional = {
  titulo: string;
  texto: string;
  versiculo: string;
};

export type Tarefa = {
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  completada: boolean;
  recurso_biblioteca?: string | null;
};

export type PlanoSemana = {
  semanaNumero: number;
  fase: string;
  pilar: string;
  bloco?: string | null;
  tag?: string | null;
  objetivo: string;
  gateStatus: 'locked' | 'available' | 'completed' | 'overdue';
  horasRegistadas: number;
  horasNecessarias: number;
  checkInsCount: number;
  checkInsNecessarios: number;
  todayCheckedIn: boolean;
  tarefas: Tarefa[];
};

export type HomeKpis = {
  receitaAtual: string | null;
  ticketMedio: number | null;
  clientesAtivos: number | null;
};

export type HomeData = {
  modelo: string | null;
  devocional: Devocional | null;
  plano: PlanoSemana | null;
  kpis: HomeKpis | null;
  onboardingCompleto: boolean;
};

type HomeApiResponse = {
  success: boolean;
  data: HomeData;
};

export type DiagnosticoLatest = {
  id: string;
  modelo: string;
  faturamento: string | null;
  score: number | null;
  createdAt: string;
  mensagem: {
    block_1_title: string;
    block_1_body: string;
    block_2_title: string;
    block_2_body: string;
    cta_label: string;
    scripture_verse: string | null;
    scripture_text: string | null;
  } | null;
} | null;

type DiagnosticoApiResponse = {
  success: boolean;
  data: DiagnosticoLatest;
};

type PlanoGenerateResponse = {
  success: boolean;
  data: { status: 'generating' | 'ready'; planoId: string };
};

export type PlanoStatus = {
  status: 'not_started' | 'generating' | 'ready' | 'error';
  planoId?: string;
  error?: string;
};

type PlanoStatusResponse = {
  success: boolean;
  data: PlanoStatus;
};

export type PlanoSemanaCompleta = {
  numero: number;
  nome: string | null;
  objetivo: string;
  por_que_importa: string | null;
  versiculo: string | null;
  fase: string;
  bloco: string | null;
  tag: string | null;
  gate_status: 'locked' | 'available' | 'completed' | 'overdue';
  indicador_conclusao: string | null;
  resultado_esperado: string | null;
  conteudo_completo: boolean;
  tarefas: { descricao: string; prioridade: string; completada: boolean; recurso_biblioteca?: string | null }[];
};

export type PlanoCompleto = {
  planoId: string;
  modelo: string;
  totalSemanas: number;
  semanas: PlanoSemanaCompleta[];
};

type PlanoCompletoResponse = {
  success: boolean;
  data: PlanoCompleto | null;
};

export const homeService = {
  async getHomeData(): Promise<HomeData> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<HomeApiResponse>('/home', { headers });
    return response.data;
  },

  async getLatestDiagnostic(): Promise<DiagnosticoLatest> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<DiagnosticoApiResponse>('/diagnostic/latest', {
      headers,
    });
    return response.data;
  },

  async generatePlano(): Promise<{ status: 'generating' | 'ready'; planoId: string }> {
    const headers = await getAuthHeaders();
    const response = await apiClient.post<PlanoGenerateResponse>(
      '/plano/generate',
      undefined,
      { headers, timeoutMs: 15_000 }
    );
    return response.data;
  },

  async getPlanoStatus(): Promise<PlanoStatus> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<PlanoStatusResponse>('/plano/status', { headers });
    return response.data;
  },

  async checkIn(cumpriu: boolean, nota?: string): Promise<{
    skipped: boolean;
    reason?: string;
    checkInsCount?: number;
    gateDesbloqueado?: boolean;
  }> {
    const headers = await getAuthHeaders();
    const response = await apiClient.post<{
      success: boolean;
      data: { skipped: boolean; reason?: string; checkInsCount?: number; gateDesbloqueado?: boolean };
    }>('/check-in', { cumpriu, nota }, { headers });
    return response.data;
  },

  async getPlanoCompleto(): Promise<PlanoCompleto | null> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<PlanoCompletoResponse>('/plano', { headers });
    return response.data;
  },

  async gateAdvance(): Promise<{
    advanced: boolean;
    reason?: string;
    semanaAnterior?: number;
    proximaSemana?: number | null;
    programaConcluido?: boolean;
  }> {
    const headers = await getAuthHeaders();
    const response = await apiClient.post<{
      success: boolean;
      data: { advanced: boolean; reason?: string; semanaAnterior?: number; proximaSemana?: number | null; programaConcluido?: boolean };
    }>('/gate/advance', undefined, { headers });
    return response.data;
  },
};

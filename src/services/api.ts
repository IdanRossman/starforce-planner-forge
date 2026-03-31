const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://forge-service-production.up.railway.app';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateEquipmentResponse {
  slot_name: string;
  id: number;
  name: string;
  type: string;
  set: string;
  level: number;
  starforceable: boolean;
  storage_url?: string;
  class: string;
  job: string[];
  current_starforce: number;
  target_starforce: number;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const isBodyRequest = options.method && options.method !== 'GET' && options.method !== 'HEAD';
    const config: RequestInit = {
      headers: {
        ...(isBodyRequest ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const err = new Error(`HTTP error! status: ${response.status}`) as Error & { status: number };
        err.status = response.status;
        throw err;
      }

      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return undefined as T;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.get('/api/equipment/equipments');
      return true;
    } catch {
      return false;
    }
  }

  // Template-specific methods
  async getTemplates(): Promise<Template[]> {
    return this.get<Template[]>('/Templates');
  }

  async getTemplateEquipment(templateId: number, job: string): Promise<TemplateEquipmentResponse[]> {
    return this.get<TemplateEquipmentResponse[]>(`/Templates/${templateId}/equipment?job=${encodeURIComponent(job)}`);
  }

  // Potential management methods
  async getPotentialLines(equipmentType: string, tier: string): Promise<string[]> {
    return this.get<string[]>(`/Potential/lines?equipmentType=${encodeURIComponent(equipmentType)}&tier=${encodeURIComponent(tier)}`);
  }

  async calculatePotentialCost(equipmentType: string, currentTier: string, targetTier: string, targetLines: string[]): Promise<any> {
    return this.post('/Potential/calculate', {
      equipmentType,
      currentTier,
      targetTier,
      targetLines
    });
  }

  async enhancePotential(equipmentId: number, enhancementData: any): Promise<any> {
    return this.post(`/Potential/enhance/${equipmentId}`, enhancementData);
  }

  // Character endpoints
  async createCharacter(data: { userId: string; name: string; job: string; level: number; enableCallingCard?: boolean }): Promise<{ id: string; userId: string; name: string; job: string; level: number }> {
    return this.post('/api/character', {
      ...data,
      createdAt: '0001-01-01T00:00:00',
      updatedAt: '0001-01-01T00:00:00',
    });
  }

  async upsertCharacterEquipment(characterId: string, slots: Array<{
    equipmentSlot: string;
    equipmentId: number | null;
    currentStarforce: number;
    targetStarforce: number;
    currentPotential: string;
    targetPotential: string;
  }>): Promise<void> {
    return this.post(`/api/character/${characterId}/equipment`, slots);
  }

  async getCharactersByUser(userId: string): Promise<Array<{ id: string; userId: string; name: string; job: string; level: number; callingCardHash: string | null; cardGenerationDate: string | null; cardGenerationCount: number }>> {
    return this.get(`/api/character/by-user/${userId}`);
  }

  async getCharacterEquipment(characterId: string): Promise<Array<{ id: string; characterId: string; equipmentSlot: string | null; equipmentId: number | null; currentStarforce: number; targetStarforce: number; currentPotential: string; targetPotential: string }>> {
    return this.get(`/api/character/${characterId}/equipment`);
  }

  async addStorageItem(characterId: string, data: { equipmentId: number; currentStarforce: number; targetStarforce: number; currentPotential: string; targetPotential: string }): Promise<{ id: string; characterId: string; equipmentSlot: null; equipmentId: number; currentStarforce: number; targetStarforce: number; currentPotential: string; targetPotential: string }> {
    return this.post(`/api/character/${characterId}/storage`, data);
  }

  async updateStorageItem(characterId: string, itemId: string, data: { equipmentId: number; currentStarforce: number; targetStarforce: number; currentPotential: string; targetPotential: string }): Promise<void> {
    return this.put(`/api/character/${characterId}/storage/${itemId}`, data);
  }

  async deleteStorageItem(characterId: string, itemId: string): Promise<void> {
    return this.delete(`/api/character/${characterId}/storage/${itemId}`);
  }

  async updateCharacter(id: string, data: { userId: string; name: string; job: string; level: number; enableCallingCard?: boolean }): Promise<void> {
    return this.put(`/api/character/${id}`, {
      ...data,
      createdAt: '0001-01-01T00:00:00',
      updatedAt: '0001-01-01T00:00:00',
    });
  }

  async deleteCharacter(id: string): Promise<void> {
    return this.delete(`/api/character/${id}`);
  }

  async getCallingCard(characterId: string): Promise<{ hash: string; url: string } | null> {
    try {
      return await this.get(`/api/callingcard/${characterId}`);
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  }

  async regenerateCallingCard(characterId: string): Promise<{ hash: string; url: string }> {
    return this.post(`/api/callingcard/${characterId}`, {});
  }

  async getPartyImage(userId: string): Promise<{ hash: string; url: string } | null> {
    try {
      return await this.get(`/api/partyimage/${userId}`);
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  }

  async generatePartyImage(userId: string): Promise<{ hash: string; url: string }> {
    return this.post(`/api/partyimage/${userId}/generate`, {});
  }
}

export const apiService = new ApiService();
export const railwayApiService = new ApiService('https://forge-service-production.up.railway.app');

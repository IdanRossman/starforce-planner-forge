const API_BASE_URL = 'https://forge-service-production.up.railway.app';

import { StarforceOptimizationRequestDto, StarforceOptimizationResponseDto } from '@/types';

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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
      await this.get('/Equipment');
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

  // StarForce Optimization method
  async optimizeStarforce(request: StarforceOptimizationRequestDto): Promise<StarforceOptimizationResponseDto> {
    return this.post<StarforceOptimizationResponseDto>('/Starforce/optimize', request);
  }
}

export const apiService = new ApiService();

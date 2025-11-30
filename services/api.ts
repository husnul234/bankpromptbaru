import { GOOGLE_SCRIPT_URL } from '../constants';
import { ApiResponse, Prompt } from '../types';

/**
 * The Google Apps Script Web App URL must be set in constants.ts
 * If empty, we simulate data for demonstration.
 */
const API_URL = GOOGLE_SCRIPT_URL;

export const fetchPrompts = async (): Promise<Prompt[]> => {
  if (!API_URL) {
    console.warn("API URL is not set. Returning mock data.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'SEO Article Writer',
            category: 'Writing',
            prompts: 'You are an expert SEO copywriter. Write a 1000-word article about...',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Python Bug Fixer',
            category: 'Coding',
            prompts: 'Analyze the following Python code and identify potential memory leaks...',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      }, 1000);
    });
  }

  try {
    const response = await fetch(API_URL);
    const result: ApiResponse<Prompt[]> = await response.json();
    if (result.status === 'success' && result.data) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to fetch');
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};

export const createPrompt = async (prompt: Omit<Prompt, 'id' | 'created_at'>): Promise<void> => {
  if (!API_URL) return; // Mock mode: do nothing
  
  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...prompt })
  });
};

export const updatePrompt = async (prompt: Prompt): Promise<void> => {
  if (!API_URL) return;
  
  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'update', ...prompt })
  });
};

export const deletePrompt = async (id: string): Promise<void> => {
  if (!API_URL) return;
  
  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id })
  });
};
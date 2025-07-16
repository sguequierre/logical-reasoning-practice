import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://127.0.0.1:3000/api'  // Development
  : 'https://your-production-api.com/api';  // Production

// Types
export interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  subscription_type: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface GenerateQuestionRequest {
  type: 'strengthen' | 'weaken' | 'assumption' | 'flaw';
  difficulty?: number;
}

export interface SubmitAnswerRequest {
  questionId: string;
  userAnswer: string;
  responseTime?: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  explanation: string;
  correctAnswer: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  // Load token from storage
  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  // Save token to storage
  private async saveToken(token: string) {
    try {
      this.token = token;
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  // Remove token from storage
  private async removeToken() {
    try {
      this.token = null;
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  // Add this method to your ApiService class, around line 75 after the removeToken method:

// Check if authentication is working by trying to get profile
public async checkAuthStatus(): Promise<boolean> {
    try {
      if (!this.token) {
        return false;
      }
      
      // Try to get profile to verify token is valid
      await this.getProfile();
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      // Remove invalid token
      await this.removeToken();
      return false;
    }
  }

  // Get current token
  public getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, remove it
          await this.removeToken();
          throw new Error('Authentication failed');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    
    await this.saveToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    await this.saveToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', error);
      }
    }
    await this.removeToken();
  }

  async getProfile(): Promise<{ user: User }> {
    try {
      return await this.request('/auth/profile');
    } catch (error) {
      // If it's a 401, remove the token
      if (error instanceof Error && error.message.includes('401')) {
        await this.removeToken();
      }
      throw error;
    }
  }

  async updateProfile(username: string, email: string): Promise<{ user: User }> {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, email }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return await this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Question methods (now require authentication)
  async generateQuestion(request: GenerateQuestionRequest): Promise<Question> {
    try {
      return await this.request<Question>('/questions/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      if (!this.isAuthenticated()) {
        // Fallback to sample question if not authenticated
        return this.getSampleQuestion(request.type);
      }
      throw error;
    }
  }

  async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return await this.request<SubmitAnswerResponse>('/questions/answer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUserStats(): Promise<{
    questionsAnswered: number;
    accuracy: number;
    currentStreak: number;
    longestStreak?: number;
    accuracyByType?: any;
    correctAnswers?: number;
  }> {
    try {
      return await this.request('/questions/stats');
    } catch (error) {
      // Fallback stats if not authenticated or error
      return {
        questionsAnswered: 0,
        accuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
        accuracyByType: {
          strengthen: 0,
          weaken: 0,
          assumption: 0,
          flaw: 0,
        },
        correctAnswers: 0,
      };
    }
  }

  async getMissedQuestions(): Promise<Question[]> {
    try {
      return await this.request('/questions/missed');
    } catch (error) {
      console.warn('Failed to load missed questions:', error);
      return [];
    }
  }

  // Fallback sample questions (when not authenticated)
  private getSampleQuestion(type: string): Question {
    const sampleQuestions: Record<string, Question> = {
      strengthen: {
        id: 'sample-strengthen-1',
        type: 'strengthen',
        question: `A local restaurant owner claims that installing outdoor heaters will significantly increase winter revenue. She argues that customers will be more likely to dine outside during cold months if the patio is heated, thus expanding seating capacity when indoor dining is limited.

Which of the following, if true, most strengthens the restaurant owner's argument?`,
        options: [
          'A) The cost of outdoor heaters can be recovered within six months of installation',
          'B) Other restaurants in the area have reported increased winter sales after installing outdoor heaters',
          'C) Many customers prefer dining outdoors regardless of temperature',
          'D) The restaurant currently has a waiting list during peak dinner hours in winter',
          'E) Outdoor heaters consume significant amounts of energy'
        ],
        correct_answer: 'B',
        explanation: 'Option B strengthens the argument by providing concrete evidence that outdoor heaters have actually resulted in increased winter sales for similar restaurants.'
      },
      weaken: {
        id: 'sample-weaken-1',
        type: 'weaken',
        question: `City planners argue that building a new subway line will reduce traffic congestion downtown. They claim that many commuters will switch from driving to taking the subway, resulting in fewer cars on the roads during rush hour.

Which of the following, if true, most weakens the planners' argument?`,
        options: [
          'A) The subway line will increase property values along its route',
          'B) The construction of the subway will temporarily increase traffic congestion',
          'C) Most downtown commuters live in areas not served by the new subway line',
          'D) Subway tickets will cost less than parking fees downtown',
          'E) The subway will run every 10 minutes during rush hour'
        ],
        correct_answer: 'C',
        explanation: 'Option C weakens the argument because if most commuters live in areas not served by the subway, they cannot switch to using it, undermining the predicted reduction in traffic.'
      },
      assumption: {
        id: 'sample-assumption-1',
        type: 'assumption',
        question: `A company CEO argues that implementing a four-day work week will increase employee productivity. She reasons that well-rested employees are more focused and efficient, so the company will accomplish the same amount of work in fewer days.

The CEO's argument depends on which of the following assumptions?`,
        options: [
          'A) Employees currently work inefficiently due to fatigue',
          'B) The company does not offer four-day work weeks to competitors',
          'C) Employee salaries will remain the same despite working fewer days',
          'D) The work that needs to be completed can be done in four days instead of five',
          'E) Employees will not seek additional employment on their extra day off'
        ],
        correct_answer: 'D',
        explanation: 'The argument assumes that the total amount of work can actually be completed in four days. Without this assumption, the conclusion cannot follow.'
      },
      flaw: {
        id: 'sample-flaw-1',
        type: 'flaw',
        question: `Dr. Martinez concludes that playing classical music improves mathematical ability in children. Her evidence is a study showing that students who took piano lessons for six months scored higher on math tests than those who did not take lessons.

The reasoning is most vulnerable to criticism because it:`,
        options: [
          'A) Relies on a study with too small a sample size',
          'B) Fails to consider that piano lessons and listening to classical music are different activities',
          'C) Ignores the possibility that students who choose piano lessons may already have stronger analytical skills',
          'D) Does not account for the students socioeconomic backgrounds',
          'E) Assumes that correlation between piano lessons and math scores indicates causation'
        ],
        correct_answer: 'E',
        explanation: 'The main flaw is assuming that correlation between piano lessons and math scores indicates causation. Just because students who take piano lessons score higher doesn\'t mean the lessons caused the improvement.'
      }
    };

    return sampleQuestions[type] || sampleQuestions.strengthen;
  }
}

export const apiService = new ApiService();
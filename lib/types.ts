export type AuthMode = 'x-api-key' | 'bearer';

export interface ConnectionSettings {
  baseUrl: string;
  apiKey: string;
  authMode: AuthMode;
  headerName: string;
}

export interface StrategyFormInput {
  company_name: string;
  website_url: string;
  locations: string;
  vertical: string;
  priority_service_lines: string;
  competitors: string;
  budget_tier: string;
  recipient_email: string;
}

export interface FinalOutput {
  report: string;
  company: string;
  file_saved: string;
}

export type RunPhase = 'form' | 'running' | 'timeout' | 'done' | 'error';

export interface StartRunResult {
  id: string | null;
  statusUrl: string | null;
  output: FinalOutput | null;
}

export interface PollResult {
  status: string;
  output: FinalOutput | null;
}

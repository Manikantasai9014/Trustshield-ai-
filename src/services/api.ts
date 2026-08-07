import { AuditCase, EvaluationInput, SystemStats, User, FinalDecision, EmailAlertConfig, MockEmailAlert, SystemHealthOverview } from '../types';

export async function fetchAgentHealth(): Promise<SystemHealthOverview> {
  const response = await fetch('/api/agents/health');
  if (!response.ok) {
    throw new Error('Failed to fetch agent health status.');
  }
  return response.json();
}

export async function pingAgentHealth(): Promise<SystemHealthOverview & { message: string }> {
  const response = await fetch('/api/agents/health/ping', {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to ping agent health.');
  }
  return response.json();
}

export async function toggleAgentSimulation(agentId: string, targetStatus?: string): Promise<{ agents: any[]; updatedAgent: any; message: string }> {
  const response = await fetch('/api/agents/health/toggle-simulation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, targetStatus })
  });
  if (!response.ok) {
    throw new Error('Failed to toggle agent simulation.');
  }
  return response.json();
}

export async function runEvaluation(input: EvaluationInput): Promise<{ case: AuditCase; stats: SystemStats; triggeredAlerts?: MockEmailAlert[] }> {

  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error('Evaluation failed. Server responded with error.');
  }
  return response.json();
}

export async function runBatchEvaluation(items: EvaluationInput[]): Promise<{ cases: AuditCase[]; total: number; stats: SystemStats; triggeredAlerts?: MockEmailAlert[] }> {
  const response = await fetch('/api/evaluate/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });
  if (!response.ok) {
    throw new Error('Batch evaluation failed. Server responded with error.');
  }
  return response.json();
}

export async function fetchCases(params?: { status?: string; search?: string; tag?: string }): Promise<{ cases: AuditCase[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.tag) query.append('tag', params.tag);

  const response = await fetch(`/api/cases?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch audit cases.');
  }
  return response.json();
}

export async function fetchStats(): Promise<SystemStats> {
  const response = await fetch('/api/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch system stats.');
  }
  return response.json();
}

export async function overrideCaseDecision(caseId: string, newStatus: FinalDecision, notes: string): Promise<{ case: AuditCase; stats: SystemStats }> {
  const response = await fetch(`/api/cases/${caseId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus, notes })
  });
  if (!response.ok) {
    throw new Error('Failed to record override decision.');
  }
  return response.json();
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  const response = await fetch('/api/auth/me');
  if (!response.ok) {
    throw new Error('Failed to fetch user.');
  }
  return response.json();
}

export async function loginUser(email: string, role: string, name?: string): Promise<{ user: User }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, name })
  });
  if (!response.ok) {
    throw new Error('Failed to log in.');
  }
  return response.json();
}

export async function fetchAlertConfig(): Promise<{ config: EmailAlertConfig }> {
  const response = await fetch('/api/alerts/config');
  if (!response.ok) {
    throw new Error('Failed to fetch email alert configuration.');
  }
  return response.json();
}

export async function updateAlertConfig(config: Partial<EmailAlertConfig>): Promise<{ config: EmailAlertConfig; message: string }> {
  const response = await fetch('/api/alerts/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) {
    throw new Error('Failed to update email alert configuration.');
  }
  return response.json();
}

export async function fetchAlertHistory(): Promise<{ alerts: MockEmailAlert[]; total: number }> {
  const response = await fetch('/api/alerts/history');
  if (!response.ok) {
    throw new Error('Failed to fetch alert history.');
  }
  return response.json();
}

export async function clearAlertHistory(): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/alerts/history', {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to clear alert history.');
  }
  return response.json();
}

export async function sendTestAlert(recipientEmail?: string, customCaseId?: string): Promise<{ alert: MockEmailAlert; message: string }> {
  const response = await fetch('/api/alerts/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, customCaseId })
  });
  if (!response.ok) {
    throw new Error('Failed to send test email alert.');
  }
  return response.json();
}


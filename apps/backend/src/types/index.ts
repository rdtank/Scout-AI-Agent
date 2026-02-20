export interface ResearchRequest {
  query: string
  userId?: string
}

export interface ResearchPlan {
  subQuestions: string[]
  approach: string
}

export type AgentEventType =
  | 'status'
  | 'tool_call'
  | 'tool_result'
  | 'token'
  | 'done'
  | 'error'

export interface AgentEvent {
  type: AgentEventType
  data: Record<string, unknown>
}

export interface FunctionDescription {
  name: string
  purpose: string
  parameters?: Record<string, string>
  returns?: string
  sideEffects?: string[]
}

export function describeFunction(description: FunctionDescription): string {
  return JSON.stringify(description, null, 2)
}

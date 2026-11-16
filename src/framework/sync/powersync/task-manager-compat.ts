import { mockState } from '../background-compat';

export function defineTask(taskName: string, taskExecutor: (data: any) => Promise<any> | void): void {
  mockState.definedTasks.set(taskName, taskExecutor);
}
export async function isTaskRegisteredAsync(taskName: string): Promise<boolean> {
  return mockState.registeredTasks.has(taskName);
}

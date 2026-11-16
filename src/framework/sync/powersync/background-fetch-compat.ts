import { mockState, BackgroundFetchStatus } from '../background-compat';
export { BackgroundFetchResult, BackgroundFetchStatus } from '../background-compat';

export async function registerBackgroundTaskAsync(taskName: string, options: any): Promise<void> {
  mockState.registeredTasks.add(taskName);
}
export async function unregisterBackgroundTaskAsync(taskName: string): Promise<void> {
  mockState.registeredTasks.delete(taskName);
}
export async function getStatusAsync(): Promise<BackgroundFetchStatus> {
  return BackgroundFetchStatus.Available;
}

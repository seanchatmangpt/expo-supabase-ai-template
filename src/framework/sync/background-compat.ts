// Background & Device Mocks for Node/Jest environment

export enum BackgroundFetchResult {
  NoData = 1,
  NewData = 2,
  Failed = 3,
}

export enum BackgroundFetchStatus {
  Restricted = 1,
  Denied = 2,
  Available = 3,
}

export enum BatteryState {
  UNKNOWN = 0,
  UNPLUGGED = 1,
  CHARGING = 2,
  FULL = 3,
}

export enum NetworkStateType {
  UNKNOWN = 'UNKNOWN',
  NONE = 'NONE',
  WIFI = 'WIFI',
  CELLULAR = 'CELLULAR',
}

// Global mock state so tests can adjust values dynamically
export const mockState = {
  batteryLevel: 1.0, // 0.0 to 1.0
  batteryState: BatteryState.FULL,
  networkConnected: true,
  registeredTasks: new Set<string>(),
  definedTasks: new Map<string, Function>(),
};

export const BackgroundFetch = {
  async registerBackgroundTaskAsync(taskName: string, options: any): Promise<void> {
    mockState.registeredTasks.add(taskName);
  },
  async unregisterBackgroundTaskAsync(taskName: string): Promise<void> {
    mockState.registeredTasks.delete(taskName);
  },
  async getStatusAsync(): Promise<BackgroundFetchStatus> {
    return BackgroundFetchStatus.Available;
  },
};

export const TaskManager = {
  defineTask(taskName: string, taskExecutor: (data: any) => Promise<any> | void): void {
    mockState.definedTasks.set(taskName, taskExecutor);
  },
  async isTaskRegisteredAsync(taskName: string): Promise<boolean> {
    return mockState.registeredTasks.has(taskName);
  },
};

export const Battery = {
  async getBatteryLevelAsync(): Promise<number> {
    return mockState.batteryLevel;
  },
  async getBatteryStateAsync(): Promise<BatteryState> {
    return mockState.batteryState;
  },
  BatteryState,
};

export const Network = {
  async getNetworkStateAsync(): Promise<{ isConnected: boolean; isInternetReachable: boolean; type: NetworkStateType }> {
    return {
      isConnected: mockState.networkConnected,
      isInternetReachable: mockState.networkConnected,
      type: mockState.networkConnected ? NetworkStateType.WIFI : NetworkStateType.NONE,
    };
  },
};

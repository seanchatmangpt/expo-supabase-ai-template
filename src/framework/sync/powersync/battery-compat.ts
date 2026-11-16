import { mockState, BatteryState } from '../background-compat';
export { BatteryState };

export async function getBatteryLevelAsync(): Promise<number> {
  return mockState.batteryLevel;
}
export async function getBatteryStateAsync(): Promise<BatteryState> {
  return mockState.batteryState;
}

import { mockState, NetworkStateType } from '../background-compat';
export { NetworkStateType };

export async function getNetworkStateAsync(): Promise<{ isConnected: boolean; isInternetReachable: boolean; type: NetworkStateType }> {
  return {
    isConnected: mockState.networkConnected,
    isInternetReachable: mockState.networkConnected,
    type: mockState.networkConnected ? NetworkStateType.WIFI : NetworkStateType.NONE,
  };
}

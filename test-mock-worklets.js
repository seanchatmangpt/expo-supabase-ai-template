jest.mock('react-native-worklets-core', () => {
  return {
    makeMutable: jest.fn((v) => ({ value: v })),
    makeShareable: jest.fn((v) => v),
  };
});
jest.mock('react-native-worklets', () => {
  return {
    makeMutable: jest.fn((v) => ({ value: v })),
    makeShareable: jest.fn((v) => v),
  };
});

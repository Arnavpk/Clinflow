/* Jest setup: in-memory AsyncStorage and quiet native modules. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-print', () => ({ printAsync: jest.fn(() => Promise.resolve()), printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///rx.pdf' })) }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(() => Promise.resolve(true)), shareAsync: jest.fn(() => Promise.resolve()) }));

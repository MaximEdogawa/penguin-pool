import AsyncStorageMock from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import '@testing-library/react-native/extend-expect'
import ReanimatedMock from 'react-native-reanimated/mock'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = ReanimatedMock
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => AsyncStorageMock)

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}))

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

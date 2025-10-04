import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { Text } from '@tamagui/core'
import React from 'react'

// Pages
import { LoginScreen } from '../../pages/auth/LoginScreen'
import { DashboardScreen } from '../../pages/dashboard/DashboardScreen'
import { LoansScreen } from '../../pages/loans/LoansScreen'
import { OffersScreen } from '../../pages/offers/OffersScreen'
import { OptionContractsScreen } from '../../pages/option-contracts/OptionContractsScreen'
import { PiggyBankScreen } from '../../pages/piggy-bank/PiggyBankScreen'
import { ProfileScreen } from '../../pages/profile/ProfileScreen'
import { ServiceHealthScreen } from '../../pages/service-health/ServiceHealthScreen'
import { WalletScreen } from '../../pages/wallet/WalletScreen'

// Types

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Tab Navigator for authenticated users
function AuthenticatedTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '$background',
          borderTopColor: '$borderColor',
        },
        tabBarActiveTintColor: '$blue9',
        tabBarInactiveTintColor: '$gray9',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text color={color}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{
          tabBarIcon: ({ color }) => <Text color={color}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color }) => <Text color={color}>💰</Text>,
        }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          tabBarIcon: ({ color }) => <Text color={color}>📄</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text color={color}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  )
}

// Main Stack Navigator
export function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Authenticated" component={AuthenticatedTabs} />

        {/* Additional screens accessible from tabs */}
        <Stack.Screen
          name="OptionContracts"
          component={OptionContractsScreen}
          options={{
            headerShown: true,
            title: 'Option Contracts',
          }}
        />
        <Stack.Screen
          name="PiggyBank"
          component={PiggyBankScreen}
          options={{
            headerShown: true,
            title: 'Piggy Bank',
          }}
        />
        <Stack.Screen
          name="ServiceHealth"
          component={ServiceHealthScreen}
          options={{
            headerShown: true,
            title: 'Service Health',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

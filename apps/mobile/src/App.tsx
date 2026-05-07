import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, ActivityIndicator } from 'react-native'
import { useAuthStore } from './store/auth'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { TransactionsScreen } from './screens/TransactionsScreen'
import { CategoriesScreen } from './screens/CategoriesScreen'
import { BudgetsScreen } from './screens/BudgetsScreen'
import { SettingsScreen } from './screens/SettingsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const TABS = [
  { name: 'Dashboard', component: DashboardScreen, icon: '◉', label: 'Inicio' },
  { name: 'Transactions', component: TransactionsScreen, icon: '⇄', label: 'Transacciones' },
  { name: 'Categories', component: CategoriesScreen, icon: '⊞', label: 'Categorías' },
  { name: 'Budgets', component: BudgetsScreen, icon: '◎', label: 'Presupuestos' },
  { name: 'Settings', component: SettingsScreen, icon: '⚙', label: 'Ajustes' },
]

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4, height: 60 },
        tabBarIcon: ({ color, focused }) => {
          const tab = TABS.find((t) => t.name === route.name)
          return <Text style={{ fontSize: focused ? 20 : 17, color }}>{tab?.icon}</Text>
        },
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ title: tab.label, tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  )
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hydrated = useAuthStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}

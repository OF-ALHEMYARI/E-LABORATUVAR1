import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';

import Login from './src/screens/Login';
import Registration from './src/screens/Registration';
import PatientForm from './src/screens/PatientForm';
import TestResults from './src/screens/TestResults';
import AdminReferenceGuides from './src/screens/AdminReferenceGuides';
import AdminTestInput from './src/screens/AdminTestInput';
import AdminMenu from './src/screens/AdminMenu';
import PatientSearch from './src/screens/PatientSearch';
import CombinedResultsSearch from './src/screens/CombinedResultsSearch';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={Login}
            options={{ title: 'E-Laboratory Login' }}
          />
          <Stack.Screen 
            name="Registration" 
            component={Registration}
            options={{ title: 'Register New Account' }}
          />
          <Stack.Screen 
            name="PatientForm" 
            component={PatientForm}
            options={{ 
              title: 'Patient Information',
              headerLeft: null,
            }}
          />
          <Stack.Screen 
            name="TestResults" 
            component={TestResults}
            options={{ title: 'Test Results' }}
          />
          <Stack.Screen 
            name="AdminMenu" 
            component={AdminMenu}
            options={{ 
              title: 'Admin Dashboard',
              headerLeft: null,
            }}
          />
          <Stack.Screen 
            name="AdminReferenceGuides" 
            component={AdminReferenceGuides}
            options={{ title: 'Reference Guides Management' }}
          />
          <Stack.Screen 
            name="AdminTestInput" 
            component={AdminTestInput}
            options={{ title: 'Admin Test Input' }}
          />
          <Stack.Screen 
            name="PatientSearch" 
            component={PatientSearch}
            options={{ title: 'Patient Search' }}
          />
          <Stack.Screen 
            name="CombinedResultsSearch" 
            component={CombinedResultsSearch}
            options={{ title: 'Patients & Test Results' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

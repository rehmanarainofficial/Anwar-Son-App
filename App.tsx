import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import BootSplash from 'react-native-bootsplash';
import store from './src/store';
import AppNavigator from './src/routes/AppNavigator';
import { dashboardApi } from './src/api/dashboardApi';

import { ThemeProvider } from './src/config/ThemeContext';
import { useTheme } from './src/config/useTheme';

const AppContent = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const init = async () => {
      const state = store.getState();
      const company = state.auth.company;

      if (company) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const formatDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            '0',
          )}-${String(d.getDate()).padStart(2, '0')}`;
        store.dispatch(
          dashboardApi.endpoints.getFinancialOverview.initiate({ company }),
        );
        store.dispatch(
          dashboardApi.endpoints.getDashReceivable.initiate({ company }),
        );
        store.dispatch(
          dashboardApi.endpoints.getDashPayable.initiate({ company }),
        );
        store.dispatch(
          dashboardApi.endpoints.getDashBanks.initiate({ company }),
        );
        store.dispatch(
          dashboardApi.endpoints.getIncomeExpense.initiate({
            company,
            from_date: formatDate(thirtyDaysAgo),
            to_date: formatDate(today),
          }),
        );
      }
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;

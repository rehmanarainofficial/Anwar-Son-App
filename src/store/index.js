import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '../api/baseApi';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        warnAfter: 128,
      },
    }).concat(baseApi.middleware),
  devTools: __DEV__,
});

// Listen for logout action and reset API cache
const originalDispatch = store.dispatch;
store.dispatch = (action) => {
  if (action.type === 'auth/logout') {
    // Reset RTK Query cache on logout
    originalDispatch(baseApi.util.resetApiState());
  }
  return originalDispatch(action);
};

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export default store;

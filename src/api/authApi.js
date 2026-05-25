import { baseApi } from './baseApi';
import Toast from 'react-native-toast-message';
import { portalApi } from './portalApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation({
      query: credentials => {
        const formData = new FormData();
        formData.append('user_id', credentials.username.trim());
        formData.append('password', credentials.password.trim());
        formData.append('company', credentials.company.trim().toUpperCase());
        return {
          url: 'auth/users.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },

      transformResponse: (response, meta, arg) => {
        if (response.status === true) {
          const user = response.data.find(u => u.user_id.toLowerCase() === arg.username.trim().toLowerCase());
          if (user) {
            return { success: true, user, message: response.message };
          } else {
            throw new Error('User not found in response data');
          }
        } else {
          throw new Error(response.message || 'Login failed');
        }
      },
      transformErrorResponse: (response, meta, arg) => {
        console.log('API Error response:', response);
        return {
          success: false,
          message:
            response?.data?.message ||
            response?.error ||
            'Network error occurred',
          detail: response,
        };
      },
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user?.company_user_id) {
            dispatch(
              portalApi.endpoints.getDebtorsMaster.initiate({
                company: arg.company.trim().toUpperCase(),
                user_id: data.user.company_user_id,
              })
            );
          }

          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome back!',
          });
        } catch (error) {
          console.error('Login Query Failed:', error);
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2:
              error?.error?.message ||
              error?.message ||
              'Please check your credentials and try again.',
          });
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const { useLoginMutation } = authApi;

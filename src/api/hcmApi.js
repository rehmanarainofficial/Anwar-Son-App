import { baseApi } from './baseApi';

export const hcmApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getAttendanceDetail: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('emp_code', body.emp_code);
        formData.append('date', body.date);

        const result = await baseQuery({
          url: 'hcm/get_attendence_detail.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    postAttendance: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();

        formData.append('code', body.code || '');
        formData.append('ActivityDate', body.ActivityDate || '');
        formData.append('ActivityTime', body.ActivityTime || '');
        formData.append('current_location', body.current_location || '');
        formData.append('latitude', body.latitude || '');
        formData.append('longitude', body.longitude || '');
        formData.append('in_out', '1');
        formData.append('status1', '1');
        formData.append('id', '0');
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'portal/user_attendance_post.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getExpenseClaimInquiry: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        Object.keys(body).forEach(key => {
          formData.append(key, body[key]);
        });

        const result = await baseQuery({
          url: 'hcm/expense_claim_inquiry.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getClaimExpenseAccount: builder.query({
      query: () => 'hcm/claim_expense_account.php',
    }),
    postServiceExpenseClaim: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: 'hcm/post_service_expense_claim.php',
          method: 'POST',
          body: body,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getViewGL: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        Object.keys(body).forEach(key => {
          formData.append(key, body[key]);
        });

        const result = await baseQuery({
          url: 'view/view_gl.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getViewData: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        Object.keys(body).forEach(key => {
          formData.append(key, body[key]);
        });

        const result = await baseQuery({
          url: 'view/view_data.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAttendanceDetailMutation,
  usePostAttendanceMutation,
  useGetExpenseClaimInquiryMutation,
  useGetClaimExpenseAccountQuery,
  usePostServiceExpenseClaimMutation,
  useGetViewGLMutation,
  useGetViewDataMutation,
} = hcmApi;

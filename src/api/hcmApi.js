import { baseApi } from './baseApi';

export const hcmApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getAttendanceDetail: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('emp_code', body.emp_code);
        formData.append('date', body.date);
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'portal/get_attendence_detail.php',
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
        formData.append('in_out', body.in_out !== undefined ? String(body.in_out) : '0');
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

    // --- Leave Management APIs ---
    getEmployeeLeaveHistory: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('emp_id', String(body.emp_id || ''));
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'leave/get_employee_leave_history.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    postEmployeeLeave: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('from_date', String(body.from_date || ''));
        formData.append('to_date', String(body.to_date || ''));
        formData.append('emp_id', String(body.emp_id || ''));
        formData.append('reason', String(body.reason || ''));
        formData.append('leave_type', String(body.leave_type || ''));
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'leave/post_employee_leave.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getEmpSelfLeaves: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('emp_id', String(body.emp_id || ''));
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'leave/get_emp_self_leaves.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getDeptLeaveApproval: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('head_id', String(body.head_id || ''));
        formData.append('employee_id', String(body.employee_id || ''));
        formData.append('from_date', String(body.from_date || ''));
        formData.append('to_date', String(body.to_date || ''));
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'leave/dept_leave_approval.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    postLeaveApprovalManager: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('emp_id', String(body.emp_id || ''));
        formData.append('approve', String(body.approve || ''));
        formData.append('company', 'CRM');

        const result = await baseQuery({
          url: 'leave/post_leave_approval_manager.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getAllEmployees: builder.query({
      queryFn: async (arg, api, extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: 'leave/get_all_employees.php?company=CRM',
          method: 'GET',
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
  useGetEmployeeLeaveHistoryMutation,
  usePostEmployeeLeaveMutation,
  useGetEmpSelfLeavesMutation,
  useGetDeptLeaveApprovalMutation,
  usePostLeaveApprovalManagerMutation,
  useGetAllEmployeesQuery,
} = hcmApi;

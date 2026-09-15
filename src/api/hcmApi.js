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
        formData.append('company', 'ANS');

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
        formData.append('company', 'ANS');
        if (body?.from_date) {
          formData.append('from_date', String(body.from_date));
        }
        if (body?.to_date) {
          formData.append('to_date', String(body.to_date));
        }
        if (body?.employee_id !== undefined && body?.employee_id !== null) {
          formData.append('employee_id', String(body.employee_id));
        }
        if (body) {
          Object.keys(body).forEach(key => {
            if (
              key !== 'company' &&
              key !== 'from_date' &&
              key !== 'to_date' &&
              key !== 'employee_id' &&
              body[key] !== undefined &&
              body[key] !== null
            ) {
              formData.append(key, String(body[key]));
            }
          });
        }

        console.log('[hcmApi] getExpenseClaimInquiry request body:', {
          company: 'ANS',
          from_date: body?.from_date,
          to_date: body?.to_date,
          employee_id: body?.employee_id,
          ...body,
        });

        const result = await baseQuery({
          url: 'portal/expense_claim_inquiry.php',
          method: 'POST',
          body: formData,
        });

        console.log('[hcmApi] getExpenseClaimInquiry response:', result);

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getClaimExpenseAccount: builder.query({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'ANS');
        return {
          url: 'dropdown/claim_expense_account.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    postServiceExpenseClaim: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: 'portal/post_service_expense_claim.php',
          method: 'POST',
          body: body,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getOutstationData: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('company', body?.company || 'ANS');
        formData.append('from_city', String(body?.from_city || ''));
        formData.append('to_city', String(body?.to_city || ''));
        formData.append('user_id', String(body?.user_id || ''));

        const result = await baseQuery({
          url: 'portal/outstation_get_data.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getOutstationExpenseInquiry: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('company', body?.company || 'ANS');
        if (body?.from_date) {
          formData.append('from_date', String(body.from_date));
        }
        if (body?.to_date) {
          formData.append('to_date', String(body.to_date));
        }
        if (body?.employee_id !== undefined && body?.employee_id !== null && body?.employee_id !== '') {
          formData.append('employee_id', String(body.employee_id));
        }
        if (body?.role_id !== undefined && body?.role_id !== null && body?.role_id !== '') {
          formData.append('role_id', String(body.role_id));
        }
        if (body) {
          Object.keys(body).forEach(key => {
            if (
              key !== 'company' &&
              key !== 'from_date' &&
              key !== 'to_date' &&
              key !== 'employee_id' &&
              key !== 'role_id' &&
              body[key] !== undefined &&
              body[key] !== null &&
              body[key] !== ''
            ) {
              formData.append(key, String(body[key]));
            }
          });
        }

        console.log('[hcmApi] getOutstationExpenseInquiry request:', {
          company: body?.company || 'ANS',
          from_date: body?.from_date,
          to_date: body?.to_date,
          employee_id: body?.employee_id,
          role_id: body?.role_id,
          ...body,
        });

        const result = await baseQuery({
          url: 'portal/outstation_expense_inquiry.php',
          method: 'POST',
          body: formData,
        });

        console.log('[hcmApi] getOutstationExpenseInquiry response:', result);

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    postExpenseApproval: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('company', body?.company || 'ANS');
        formData.append('trans_no', String(body?.trans_no || ''));
        formData.append(
          'type',
          String(body?.type !== undefined ? body.type : '0'),
        );
        formData.append(
          'approval',
          String(body?.approval !== undefined ? body.approval : '0'),
        );

        const result = await baseQuery({
          url: 'approval/expense_approval_post.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    postOutstationExpenseClaim: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('company', body?.company || 'ANS');
        formData.append('user_id', String(body?.user_id || ''));
        formData.append('employee_id', String(body?.employee_id || ''));
        formData.append('from_city', String(body?.from_city || ''));
        formData.append('to_city', String(body?.to_city || ''));
        formData.append('leave_date', String(body?.leave_date || ''));
        formData.append('return_date', String(body?.return_date || ''));
        formData.append('fuel', String(body?.fuel || '0'));
        formData.append(
          'expense_detail',
          typeof body?.expense_detail === 'string'
            ? body.expense_detail
            : JSON.stringify(body?.expense_detail || []),
        );

        if (body?.filename) {
          if (typeof body.filename === 'object' && body.filename.uri) {
            formData.append('filename', {
              uri: body.filename.uri,
              type: body.filename.type || 'image/jpeg',
              name:
                body.filename.fileName ||
                body.filename.name ||
                `receipt_${Date.now()}.jpg`,
            });
          } else if (
            typeof body.filename === 'string' &&
            (body.filename.startsWith('file:') ||
              body.filename.startsWith('content:'))
          ) {
            formData.append('filename', {
              uri: body.filename,
              type: 'image/jpeg',
              name: `receipt_${Date.now()}.jpg`,
            });
          }
        }

        const result = await baseQuery({
          url: 'portal/post_outstaion_expense_claim.php',
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
  useGetOutstationDataMutation,
  useGetOutstationExpenseInquiryMutation,
  usePostExpenseApprovalMutation,
  usePostOutstationExpenseClaimMutation,
  useGetEmployeeLeaveHistoryMutation,
  usePostEmployeeLeaveMutation,
  useGetEmpSelfLeavesMutation,
  useGetDeptLeaveApprovalMutation,
  usePostLeaveApprovalManagerMutation,
  useGetAllEmployeesQuery,
} = hcmApi;

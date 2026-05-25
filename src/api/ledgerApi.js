import { baseApi } from './baseApi';

export const ledgerApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getGLAccountInquiry: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { from_date, to_date, company, account, person_id } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('from_date', from_date);
        formData.append('to_date', to_date);
        formData.append('company', activeCompany);
        formData.append('person_id', person_id || '');
        formData.append('account', account || '');
        formData.append('dimension_id', body.dimension_id || '');

        const result = await baseQuery({
          url: 'ledger/gl_account_inquiry.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getCustomerAging: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, customer_id, from_date, to_date } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('customer_id', customer_id);
        if (from_date) formData.append('from_date', from_date);
        if (to_date) formData.append('to_date', to_date);
        formData.append('dimension_id', body.dimension_id || '');

        const result = await baseQuery({
          url: 'ledger/customer_aging.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getSupplierAging: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, supplier_id, from_date, to_date } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('supplier_id', supplier_id);
        if (from_date) formData.append('from_date', from_date);
        if (to_date) formData.append('to_date', to_date);
        formData.append('dimension_id', body.dimension_id || '');

        const result = await baseQuery({
          url: 'ledger/supplier_aging.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getCustomerBalanceDetails: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, customer_id, from_date, to_date } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('customer_id', customer_id);
        formData.append('from_date', from_date);
        formData.append('to_date', to_date);
        formData.append('dimension_id', body.dimension_id || '');

        const result = await baseQuery({
          url: 'ledger/customer_balance_details.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getSupplierBalanceDetails: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, supplier_id, from_date, to_date } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('supplier_id', supplier_id);
        formData.append('from_date', from_date);
        formData.append('to_date', to_date);
        formData.append('dimension_id', body.dimension_id || '');

        const result = await baseQuery({
          url: 'ledger/supplier_balance_details.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getGLAccountDropdown: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company } = body;
        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);

        const result = await baseQuery({
          url: 'dropdown/gl_account.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getCounterPartyDropdown: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, account } = body;
        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('account', account);

        const result = await baseQuery({
          url: 'dropdown/counter_party.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getTrailBalance: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, from_date, to_date, show_zero } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('from_date', from_date);
        formData.append('to_date', to_date);
        formData.append('show_zero', show_zero || 0);
        formData.append('dimension_id', body.dimension_id || 0);

        const result = await baseQuery({
          url: 'ledger/trail_balance.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getBalanceSheet: builder.mutation({
      queryFn: async (body, api, extraOptions, baseQuery) => {
        const { company, to_date, dimension_id } = body;

        const state = api.getState();
        const activeCompany = company || state.auth.company;

        const formData = new FormData();
        formData.append('company', activeCompany);
        formData.append('to_date', to_date);
        formData.append('dimension_id', dimension_id || 0);

        const result = await baseQuery({
          url: 'ledger/balance_sheet.php',
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
  useGetGLAccountInquiryMutation,
  useGetCustomerAgingMutation,
  useGetSupplierAgingMutation,
  useGetCustomerBalanceDetailsMutation,
  useGetSupplierBalanceDetailsMutation,
  useGetGLAccountDropdownMutation,
  useGetCounterPartyDropdownMutation,
  useGetTrailBalanceMutation,
  useGetBalanceSheetMutation,
} = ledgerApi;

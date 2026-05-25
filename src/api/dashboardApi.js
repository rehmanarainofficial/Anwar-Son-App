import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getIncomeExpense: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('from_date', body.from_date);
        formData.append('to_date', body.to_date);
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');

        return {
          url: 'dashboard/income_and_expense.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getParentAccountDetail: builder.mutation({
      async queryFn(body, queryApi, _extraOptions, baseQuery) {
        const state = queryApi.getState();
        const company = body.company || state.auth.company;

        const formData = new FormData();
        formData.append('from_date', body.from_date);
        formData.append('to_date', body.to_date);
        formData.append('account_type', body.account_type);
        formData.append('company', company);
        formData.append('dimension_id', body.dimension_id || '');

        const result = await baseQuery({
          url: 'dashboard/parent_account_detail.php',
          method: 'POST',
          body: formData,
        });

        return result.data ? { data: result.data } : { error: result.error };
      },
    }),
    getFinancialOverview: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');

        return {
          url: 'dashboard/financial_overview.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    getDashReceivable: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');
        return {
          url: 'dashboard/dash_receivable.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    getDashPayable: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');
        return {
          url: 'dashboard/dash_payable.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    getDashBanks: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');
        return {
          url: 'dashboard/dash_banks.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    getDashCategoryWiseValution: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');
        return {
          url: 'dashboard/dash_category_wise_valution.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    getDashLocationWiseValution: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');
        return {
          url: 'dashboard/dash_location_wise_valution.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
    getDashItemWiseValution: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('dimension_id', body.dimension_id || '');
        return {
          url: 'dashboard/dash_item_wise_valution.php',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetIncomeExpenseMutation,
  useGetParentAccountDetailMutation,
  useGetFinancialOverviewMutation,
  useGetDashReceivableMutation,
  useGetDashPayableMutation,
  useGetDashBanksMutation,
  useGetDashCategoryWiseValutionMutation,
  useGetDashLocationWiseValutionMutation,
  useGetDashItemWiseValutionMutation,
} = dashboardApi;

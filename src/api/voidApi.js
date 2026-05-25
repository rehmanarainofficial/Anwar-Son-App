import { baseApi } from './baseApi';

export const voidApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getVoidTransactionData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('from_date', body.from_date);
        formData.append('to_date', body.to_date);
        formData.append('type', body.type);
        formData.append('dimension_id', body.dimension_id || '');
        formData.append('ref', body.ref || '');
        formData.append('trans_no', body.trans_no || '');

        return {
          url: 'access/void_transaction_data.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getViewData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('trans_no', body.trans_no);
        formData.append('type', body.type);

        return {
          url: 'view/view_data.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getViewGL: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('trans_no', body.trans_no);
        formData.append('type', body.type);

        return {
          url: 'view/view_gl.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    voidTransaction: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('trans_no', body.trans_no);
        formData.append('type', body.type);
        formData.append('user_id', body.user_id);

        return {
          url: 'access/void_api.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetVoidTransactionDataMutation,
  useGetViewDataMutation,
  useGetViewGLMutation,
  useVoidTransactionMutation,
} = voidApi;

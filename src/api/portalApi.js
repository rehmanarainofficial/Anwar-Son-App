import { baseApi } from './baseApi';

export const portalApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getDebtorsMaster: builder.query({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company?.trim()?.toUpperCase());
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'portal/debtors_master.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    postServicePurchSale: builder.mutation({
      query: body => {
        const formData = new FormData();
        Object.keys(body).forEach(key => {
          if (key === 'image' && body[key]) {
            formData.append(key, {
              uri: body[key].uri,
              type: body[key].type,
              name: body[key].fileName || 'image.jpg',
            });
          } else if (key === 'purch_order_details') {
            const details =
              typeof body[key] === 'string'
                ? body[key]
                : JSON.stringify(body[key]);
            formData.append(key, details);
          } else {
            formData.append(key, body[key]);
          }
        });

        return {
          url: 'portal/post_service_purch_sale.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getOrderShippingInfo: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('user_id', body.user_id);
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'portal/order_shiping_info.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getOrderStatusListing: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('user_id', body.user_id);
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'portal/order_status_listing.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getOutstandingReport: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('customer_id', body.customer_id);
        return {
          url: 'portal/outstanding_report.php',
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
    postPayment: builder.mutation({
      query: body => {
        const formData = new FormData();
        Object.keys(body).forEach(key => {
          if (key === 'filename' && body[key]) {
            formData.append(key, {
              uri: body[key].uri,
              type: body[key].type,
              name: body[key].fileName || 'payment.jpg',
            });
          } else if (key === 'gl_detail') {
            formData.append(
              key,
              typeof body[key] === 'string'
                ? body[key]
                : JSON.stringify(body[key]),
            );
          } else {
            formData.append(key, body[key]);
          }
        });
        return {
          url: 'portal/post_service_payments.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getContactsData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id);
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        if (body.contact_tier !== undefined && body.contact_tier !== null) {
          formData.append('contact_tier', body.contact_tier);
        }
        if (body.surgical_speciality !== undefined && body.surgical_speciality !== null) {
          formData.append('surgical_speciality', body.surgical_speciality);
        }
        return {
          url: 'portal/get_contacts_data.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getHospitalData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        Object.keys(body).forEach(key => {
          if (
            key !== 'company' &&
            body[key] !== undefined &&
            body[key] !== null
          ) {
            formData.append(key, body[key]);
          }
        });
        return {
          url: 'portal/get_hospital_data.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesTarget: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('user_id', body.user_id);
        formData.append('sub_user_id', body.sub_user_id);
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        if (body.years !== undefined && body.years !== null) {
          formData.append('years', body.years);
        }
        if (body.month !== undefined && body.month !== null) {
          formData.append('month', body.month);
        }
        if (body.quater !== undefined && body.quater !== null) {
          formData.append('quater', body.quater);
        }
        if (body.salesman_name !== undefined && body.salesman_name !== null) {
          formData.append('salesman', body.salesman_name);
        }
        return {
          url: 'portal/get_salesman_target_sales.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getQuarterDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company || '');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'dropdown/quater.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getYearsDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company || '');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'dropdown/years.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getMonthDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body?.company || 'CRM');
        return {
          url: 'dropdown/month.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesmanDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('user_id', body.user_id || '');
        formData.append('company', body.company || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '');
        return {
          url: 'dropdown/salesman.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesmanProductSalesAverage: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company || '');
        formData.append('category_id', body.category_id || '');
        formData.append('product_id', body.product_id || '');
        formData.append('salesman', body.salesman || '');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'portal/get_salesman_product_sales_average.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesmanProductSalesAverageCustomer: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company || '');
        formData.append('salesman', body.salesman || '');
        formData.append('category_id', body.category_id || '');
        formData.append('debtor_no', body.debtor_no || '');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'portal/get_salesman_product_sales_average_customer.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getLiveTracking: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('emp_code', body?.emp_code || '');
        formData.append(
          'date',
          body?.date || new Date().toISOString().split('T')[0],
        );
        return {
          url: 'portal/get_live_tracking.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    updateLiveTrackingPost: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('code', body?.code || body?.emp_code || '');
        formData.append('latitude', body?.latitude || '');
        formData.append('longitude', body?.longitude || '');
        formData.append('current_location', body?.current_location || '');
        formData.append(
          'ActivityDate',
          body?.ActivityDate || new Date().toISOString().split('T')[0],
        );
        formData.append('ActivityTime', body?.ActivityTime || '');
        return {
          url: 'portal/update_live_tracking_post.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesmanFuelSummary: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('emp_code', body.emp_code || '');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        if (body.year !== undefined && body.year !== null) {
          formData.append('year', String(body.year));
        }
        if (body.month !== undefined && body.month !== null) {
          formData.append('month', String(body.month));
        }
        return {
          url: 'portal/get_salesman_fuel_summary.php',
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
  useGetDebtorsMasterQuery,
  useLazyGetDebtorsMasterQuery,
  usePostServicePurchSaleMutation,
  useGetOrderShippingInfoMutation,
  useGetOrderStatusListingMutation,
  useGetOutstandingReportMutation,
  useGetViewDataMutation,
  usePostPaymentMutation,
  useGetContactsDataMutation,
  useGetHospitalDataMutation,
  useGetSalesTargetMutation,
  useGetQuarterDropdownMutation,
  useGetYearsDropdownMutation,
  useGetMonthDropdownMutation,
  useGetSalesmanDropdownMutation,
  useGetSalesmanProductSalesAverageMutation,
  useGetSalesmanProductSalesAverageCustomerMutation,
  useGetLiveTrackingMutation,
  useUpdateLiveTrackingPostMutation,
  useGetSalesmanFuelSummaryMutation,
} = portalApi;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@env';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const baseUrl = API_BASE_URL;
    try {
      const result = await fetchBaseQuery({
        baseUrl: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      })(args, api, extraOptions);
      if (result.error) {
        console.log('[baseApi Response Error]', result.error);
      } else {
        console.log('[baseApi Response Success]');
      }
      return result;
    } catch (err) {
      console.error('[baseApi Catch Error]', err);
      throw err;
    }
  },
  tagTypes: ['User', 'Auth', 'Dashboard', 'Dimension'],
  keepUnusedDataFor: 600, // 10 minutes cache
  endpoints: builder => ({
    getFunctionalityCheck: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);

        return {
          url: 'access/functionality_checks.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getDimensionDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);

        return {
          url: 'dropdown/dimension1.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getStockMasterDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        if (body.price_list) {
          formData.append('price_list', body.price_list);
        }

        return {
          url: 'dropdown/stock_master.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesCategory: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');

        return {
          url: 'dropdown/sales_category.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesActivity: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('sales_category', body.sales_category);

        return {
          url: 'dropdown/sales_activity.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getHospital: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.id);

        return {
          url: 'dropdown/hospital.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      transformResponse: response => {
        if (response.status === 'true' && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map(item => ({
              ...item,
              name: (item.name || '').replace(/&amp;/g, '&'),
            })),
          };
        }
        return response;
      },
    }),
    getHospitalContacts: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('hospital_id', body.hospital_id);
        formData.append('user_id', body.user_id);

        return {
          url: 'dropdown/hospital_contacts.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getDailyWorkingPlan: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id);
        formData.append('date', body.date);

        return {
          url: 'portal/get_daily_working_plan.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    addDailyWorkingPlan: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('id', body.id || '0');
        formData.append('user_id', body.user_id);
        formData.append('activity_date', body.activity_date);
        formData.append('category', body.category);
        formData.append('activity', body.activity);
        formData.append('hospital_name', body.hospital_name);
        formData.append('contact_person', body.contact_person);
        formData.append(
          'progress_status',
          body.progress_status !== undefined ? body.progress_status : '0',
        );
        formData.append('created_by', body.created_by);
        formData.append('evening_remarks', body.evening_remarks || '');
        formData.append('longitude', body.longitude || '');
        formData.append('latitude', body.latitude || '');
        formData.append('current_location', body.location_name || '');
        formData.append('ActivityTime', body.ActivityTime || '');
        if (body.code) {
          formData.append('code', body.code);
        }
        if (body.product_category) {
          formData.append('product_category', body.product_category);
        }

        return {
          url: 'portal/daily_working_plan.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesProgressStatus: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('activity', body.activity);

        return {
          url: 'dropdown/sales_activity_progress_status.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getCustBranchDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('person_id', body.person_id);

        return {
          url: 'dropdown/cust_branch.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    deleteDailyWorkingPlan: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('id', body.id);

        return {
          url: 'portal/delete_daily_working_plan.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    toggleErpStatus: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('activate', body.activate);

        return {
          url: 'access/erp_on_off.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getBankNames: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);

        return {
          url: 'dropdown/bank_name.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getShippers: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        return {
          url: 'dropdown/shippers.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getBranchAddress: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', body.company);
        formData.append('branch_code', body.branch_code);
        return {
          url: 'dropdown/branch_address.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getCityDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.id);
        if (body.city) {
          formData.append('city', body.city);
        }
        return {
          url: 'dropdown/city.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getTitleDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.id);
        return {
          url: 'dropdown/title.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getCommunityDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('community', body.community !== undefined ? body.community : '');
        return {
          url: 'dropdown/community.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getAdministrativeRoleDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('administrative_role', body.administrative_role !== undefined ? body.administrative_role : '');
        return {
          url: 'dropdown/administrative_role.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    addHospitalContact: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id);
        formData.append('title', body.title);
        formData.append('person_name', body.person_name);
        formData.append('city', body.city);
        formData.append('personal_email', body.personal_email);
        formData.append('cell_no', body.cell_no);
        formData.append('hospital', body.hospital);
        formData.append('community', body.community !== undefined ? body.community : '');
        formData.append('administrative_role', body.administrative_role !== undefined ? body.administrative_role : '');

        if (body.profile_pic_name) {
          formData.append('profile_pic_name', {
            uri: body.profile_pic_name.uri,
            type: body.profile_pic_name.type || 'image/jpeg',
            name: body.profile_pic_name.fileName || 'profile.jpg',
          });
        }
        if (body.business_card_name) {
          formData.append('business_card_name', {
            uri: body.business_card_name.uri,
            type: body.business_card_name.type || 'image/jpeg',
            name: body.business_card_name.fileName || 'business_card.jpg',
          });
        }

        return {
          url: 'portal/hospital_contact_post.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getStockMasterMainDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/stock_master_main.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getDepartmentDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        if (body.department) {
          formData.append('department', body.department);
        }
        return {
          url: 'dropdown/department.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getSurgicalSpecialityDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        if (body.surgical_speciality) {
          formData.append('surgical_speciality', body.surgical_speciality);
        }
        return {
          url: 'dropdown/surgical_speciality.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getProductPlanCategoryDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id);
        return {
          url: 'dropdown/product_plan_category.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    postSampleData: builder.mutation({
      query: body => {
        const formData = new FormData();
        Object.keys(body).forEach(key => {
          if (key === 'purch_order_details') {
            formData.append(
              key,
              typeof body[key] === 'string'
                ? body[key]
                : JSON.stringify(body[key]),
            );
          } else if (key === 'memo') {
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
          url: 'portal/post_sample_data.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getPaymentTermsDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/payment_terms.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
      transformResponse: response => {
        if (response.status === 'true' && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map(item => {
              const cleanedItem = {};
              Object.keys(item).forEach(key => {
                cleanedItem[key.trim()] = item[key];
              });
              return cleanedItem;
            }),
          };
        }
        return response;
      },
    }),
    getCustomerTypeDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/customer_type.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
      transformResponse: response => {
        if (response.status === 'true' && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map(item => {
              const cleanedItem = {};
              Object.keys(item).forEach(key => {
                cleanedItem[key.trim()] = item[key];
              });
              return cleanedItem;
            }),
          };
        }
        return response;
      },
    }),
    addHospital: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id);
        formData.append('name', body.name);
        formData.append('address', body.address || '');
        formData.append('city', body.city || '');
        formData.append('cust_type', body.cust_type);
        formData.append('beds', body.beds);
        formData.append('payment_terms', body.payment_terms);
        formData.append('segment', body.segment);

        return {
          url: 'portal/hospital_post.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
  }),
});

export const {
  useGetFunctionalityCheckMutation,
  useGetDimensionDropdownMutation,
  useGetStockMasterDropdownMutation,
  useGetSalesCategoryMutation,
  useGetSalesActivityMutation,
  useGetHospitalMutation,
  useGetHospitalContactsMutation,
  useGetDailyWorkingPlanMutation,
  useAddDailyWorkingPlanMutation,
  useGetSalesProgressStatusMutation,
  useGetCustBranchDropdownMutation,
  useDeleteDailyWorkingPlanMutation,
  useToggleErpStatusMutation,
  useGetBankNamesMutation,
  useGetShippersMutation,
  useGetBranchAddressMutation,
  useGetCityDropdownMutation,
  useGetTitleDropdownMutation,
  useGetCommunityDropdownMutation,
  useGetAdministrativeRoleDropdownMutation,
  useAddHospitalContactMutation,
  useGetStockMasterMainDropdownMutation,
  useGetDepartmentDropdownMutation,
  useGetProductPlanCategoryDropdownMutation,
  useGetSurgicalSpecialityDropdownMutation,
  usePostSampleDataMutation,
  useGetPaymentTermsDropdownMutation,
  useGetCustomerTypeDropdownMutation,
  useAddHospitalMutation,
} = baseApi;

export default baseApi;

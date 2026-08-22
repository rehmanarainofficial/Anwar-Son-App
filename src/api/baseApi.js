import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@env';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const baseUrl = API_BASE_URL;
    try {
      if (args) {
        const url = typeof args === 'string' ? args : args.url;
        let payload = {};
        if (args.body && args.body._parts) {
          args.body._parts.forEach(([key, val]) => {
            payload[key] = val;
          });
        } else if (args.body && typeof args.body === 'object') {
          payload = args.body;
        }
        console.log(`🚀 [API POST REQUEST] URL: ${url}`, JSON.stringify(payload, null, 2));
      }

      const result = await fetchBaseQuery({
        baseUrl: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      })(args, api, extraOptions);

      const requestUrl = typeof args === 'string' ? args : args?.url;
      if (result.error) {
        console.log(`❌ [API Error] URL: ${requestUrl}`, result.error);
      } else {
        console.log(`✅ [API Success] URL: ${requestUrl}`, result.data);
      }
      return result;
    } catch (err) {
      console.error('[baseApi Catch Error]', err);
      throw err;
    }
  },
  tagTypes: ['User', 'Auth', 'Dashboard', 'Dimension'],
  keepUnusedDataFor: 600,
  endpoints: builder => ({
    getFunctionalityCheck: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'ANS');

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
        formData.append('company', body?.company || 'ANS');

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
        formData.append('company', body?.company || 'ANS');
        if (body?.price_list) {
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
    getStockCategory: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }

        return {
          url: 'dropdown/stock_category.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getSalesTargetCategory: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }

        return {
          url: 'dropdown/sales_target_category.php',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getStockMasterCode: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('category_id', body.category_id || '');
        formData.append('company', body.company || '');

        return {
          url: 'dropdown/stock_master_code.php',
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
        formData.append('user_id', body.id || body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }

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
        if (body?.user_id) formData.append('user_id', body.user_id);
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        if (body?.hospital_id) formData.append('hospital_id', body.hospital_id);
        if (body?.community_id) formData.append('community_id', body.community_id);

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
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
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
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
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
        formData.append('company', 'ANS');
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
        formData.append('user_id', body.id || body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
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
        formData.append('user_id', body.id || body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
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
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        formData.append('title', body.title || '');
        formData.append('person_name', body.person_name || '');
        formData.append('city', body.city || '');
        formData.append('personal_email', body.personal_email || '');
        formData.append('cell_no', body.cell_no || '');
        formData.append('hospital', body.hospital || '');
        formData.append('community', body.community || '');
        formData.append('department', body.department || '');
        formData.append('surgical_speciality', body.surgical_speciality || '');
        formData.append('procedure_focus', body.procedure_focus || '');
        formData.append('surgical_role', body.surgical_role || '');
        formData.append('administrative_role', body.administrative_role || '');
        formData.append('contact_tier', body.contact_tier || '');
        formData.append('focus_product', body.focus_product || '');

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
        if (body.community_id) {
          formData.append('community_id', body.community_id);
        }
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
    getHospitalCategoryDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/hospital_category.php',
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
        if (body.department_id) {
          formData.append('department_id', body.department_id);
        }
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
    getHospitalDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || body.id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
        return {
          url: 'dropdown/hospital.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getProcedureFocusDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('surgery_id', body.surgery_id);
        return {
          url: 'dropdown/procedure_focus.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getSurgicalRoleDropdown: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('community_id', body.community_id);
        return {
          url: 'dropdown/surgical_role.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getContactTierDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/contact_tier.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getFocusProductDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/focus_product.php',
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
        formData.append('user_id', body.user_id || '');
        if (body?.role_id !== undefined && body?.role_id !== null) {
          formData.append('role_id', String(body.role_id));
        }
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
    getHospitalTierDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/hospital_tier.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getProductOpportunityDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/product_opportunity.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    addHospital: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        Object.keys(body).forEach(key => {
          if (key !== 'company' && body[key] !== undefined && body[key] !== null) {
            if (Array.isArray(body[key])) {
              formData.append(key, JSON.stringify(body[key]));
            } else {
              formData.append(key, body[key]);
            }
          }
        });

        return {
          url: 'portal/hospital_post.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getPromotionalActivityTypeDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/promotional_activity_type.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getPromotionalPurposeDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/promotional_purpose.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getFieldActivityStatusDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/field_activity_status.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getPromotionalData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');
        return {
          url: 'field_activity/promotional_data_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    postPromotionalData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('id', body.id !== undefined ? String(body.id) : '0');
        formData.append('tran_date', body.tran_date || '');
        formData.append('hospital_id', body.hospital_id || '');
        formData.append('community_id', body.community_id || '');
        formData.append('contact_id', body.contact_id || '');
        formData.append('activity_type_id', body.activity_type_id || '');
        formData.append('purpose_id', body.purpose_id || '');
        formData.append('remarks', body.remarks || '');
        formData.append('amount', body.amount || '');
        formData.append('status_id', body.status_id !== undefined ? String(body.status_id) : '1');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');

        if (body.manager_remarks !== undefined && body.manager_remarks !== null) {
          formData.append('manager_remarks', body.manager_remarks);
        }

        if (body.receipt_file) {
          if (typeof body.receipt_file === 'object' && body.receipt_file.uri) {
            formData.append('receipt_file', {
              uri: body.receipt_file.uri,
              type: body.receipt_file.type || 'image/jpeg',
              name: body.receipt_file.fileName || body.receipt_file.name || 'receipt.jpg',
            });
          } else if (typeof body.receipt_file === 'string' && body.receipt_file.length > 0) {
            formData.append('receipt_file', body.receipt_file);
          }
        }

        return {
          url: 'field_activity/promotional_post_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getGiveawayData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');
        return {
          url: 'field_activity/giveaway_data_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    postGiveawayData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('id', body.id !== undefined ? String(body.id) : '0');
        formData.append('tran_date', body.tran_date || '');
        formData.append('hospital_id', body.hospital_id || '');
        formData.append('community_id', body.community_id || '');
        formData.append('contact_id', body.contact_id || '');
        formData.append('stock_id', body.stock_id || '');
        formData.append('qty_requested', body.qty_requested || '');
        formData.append('unit_price', body.unit_price || '');
        formData.append('remarks', body.remarks || '');
        formData.append('status_id', body.status_id !== undefined ? String(body.status_id) : '1');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');

        if (body.manager_remarks !== undefined && body.manager_remarks !== null) {
          formData.append('manager_remarks', body.manager_remarks);
        }

        return {
          url: 'field_activity/giveaway_post_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getGiveawayCategoryDropdown: builder.mutation({
      query: () => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        return {
          url: 'dropdown/giveaway_category.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getWorkshopData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');
        if (body.id !== undefined && body.id !== null) {
          formData.append('id', String(body.id));
        }
        return {
          url: 'field_activity/workshop_get_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    postWorkshopData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('id', body.id !== undefined ? String(body.id) : '0');
        formData.append('title', body.title || '');
        formData.append('date', body.date || '');
        formData.append('hospital_id', body.hospital_id || '');
        formData.append('venue', body.venue || '');
        formData.append('hospital_depart', body.hospital_depart || '');
        formData.append('workshop_type', body.workshop_type || '');
        formData.append('product_segment', body.product_segment || '');
        formData.append('objectives', body.objectives || '');

        formData.append(
          'key_products',
          typeof body.key_products === 'string'
            ? body.key_products
            : JSON.stringify(body.key_products || []),
        );
        formData.append(
          'audience',
          typeof body.audience === 'string'
            ? body.audience
            : JSON.stringify(body.audience || []),
        );
        formData.append(
          'materials',
          typeof body.materials === 'string'
            ? body.materials
            : JSON.stringify(body.materials || []),
        );
        formData.append(
          'budget',
          typeof body.budget === 'string'
            ? body.budget
            : JSON.stringify(body.budget || []),
        );

        formData.append('status_id', body.status_id !== undefined ? String(body.status_id) : '1');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');

        if (body.manager_remarks !== undefined && body.manager_remarks !== null) {
          formData.append('manager_remarks', body.manager_remarks);
        }

        return {
          url: 'field_activity/workshop_post_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    getConferenceData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');
        if (body.id !== undefined && body.id !== null) {
          formData.append('id', String(body.id));
        }
        return {
          url: 'field_activity/conference_get_api.php',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        };
      },
    }),
    postConferenceData: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('company', 'CRM');
        formData.append('id', body.id !== undefined ? String(body.id) : '0');
        formData.append('activity_type', body.activity_type || '1');
        formData.append('event_name', body.event_name || '');
        formData.append('start_date', body.start_date || '');
        formData.append('end_date', body.end_date || '');
        formData.append('venue', body.venue || '');
        formData.append('organized_by', body.organized_by || '');
        formData.append('lead_organiser_name', body.lead_organiser_name || '');
        formData.append('mode', body.mode || '1');
        formData.append('web_link', body.web_link || '');
        formData.append('purpose', body.purpose || '');
        formData.append('benefits', body.benefits || '');

        formData.append(
          'key_products',
          typeof body.key_products === 'string'
            ? body.key_products
            : JSON.stringify(body.key_products || []),
        );
        formData.append(
          'audience',
          typeof body.audience === 'string'
            ? body.audience
            : JSON.stringify(body.audience || []),
        );
        formData.append(
          'materials',
          typeof body.materials === 'string'
            ? body.materials
            : JSON.stringify(body.materials || []),
        );
        formData.append(
          'budget',
          typeof body.budget === 'string'
            ? body.budget
            : JSON.stringify(body.budget || []),
        );
        formData.append(
          'attendance',
          typeof body.attendance === 'string'
            ? body.attendance
            : JSON.stringify(body.attendance || []),
        );

        formData.append('status_id', body.status_id !== undefined ? String(body.status_id) : '1');
        formData.append('user_id', body.user_id || '');
        formData.append('role_id', body.role_id !== undefined ? String(body.role_id) : '2');

        if (body.manager_remarks !== undefined && body.manager_remarks !== null) {
          formData.append('manager_remarks', body.manager_remarks);
        }

        return {
          url: 'field_activity/conference_save_api.php',
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
  useGetHospitalCategoryDropdownMutation,
  useGetProductPlanCategoryDropdownMutation,
  useGetSurgicalSpecialityDropdownMutation,
  usePostSampleDataMutation,
  useGetPaymentTermsDropdownMutation,
  useGetCustomerTypeDropdownMutation,
  useGetHospitalTierDropdownMutation,
  useGetProductOpportunityDropdownMutation,
  useAddHospitalMutation,
  useGetHospitalDropdownMutation,
  useGetProcedureFocusDropdownMutation,
  useGetSurgicalRoleDropdownMutation,
  useGetContactTierDropdownMutation,
  useGetFocusProductDropdownMutation,
  useGetStockCategoryMutation,
  useGetSalesTargetCategoryMutation,
  useGetStockMasterCodeMutation,
  useGetPromotionalActivityTypeDropdownMutation,
  useGetPromotionalPurposeDropdownMutation,
  useGetFieldActivityStatusDropdownMutation,
  useGetPromotionalDataMutation,
  usePostPromotionalDataMutation,
  useGetGiveawayDataMutation,
  usePostGiveawayDataMutation,
  useGetGiveawayCategoryDropdownMutation,
  useGetWorkshopDataMutation,
  usePostWorkshopDataMutation,
  useGetConferenceDataMutation,
  usePostConferenceDataMutation,
} = baseApi;

export default baseApi;

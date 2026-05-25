import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { selectIsAuthenticated, restoreSession } from '@store/slices/authSlice';

import LoginScreen from '@screens/auth/LoginScreen';
import MainScreen from '@screens/MainScreen';
import DashboardScreen from '@screens/dashboard/DashboardScreen';
import ApprovalsScreen from '@screens/approvals/ApprovalsScreen';
import SalesScreen from '@screens/sales/SalesScreen';
import PurchaseScreen from '@screens/purchase/PurchaseScreen';
import InventoryScreen from '@screens/inventory/InventoryScreen';
import HCMScreen from '@screens/hcm/HCMScreen';
import ManufacturingScreen from '@screens/manufacturing/ManufacturingScreen';
import CRMScreen from '@screens/crm/CRMScreen';
import CRMAddLeadScreen from '@screens/crm/CRMAddLeadScreen';
import CRMContactListScreen from '@screens/crm/CRMContactListScreen';
import CRMHospitalListScreen from '@screens/crm/CRMHospitalListScreen';
import CRMAddHospitalScreen from '@screens/crm/CRMAddHospitalScreen';
import CRMMonthlyExpenseScreen from '@screens/crm/CRMMonthlyExpenseScreen';
import CRMSampleRequestScreen from '@screens/crm/CRMSampleRequestScreen';
import CRMGiveawayRequestScreen from '@screens/crm/CRMGiveawayRequestScreen';
import CRMWorkshopRequestScreen from '@screens/crm/CRMWorkshopRequestScreen';
import CRMApprovalDashboard from '@screens/crm/CRMApprovalDashboard';
import CRMMonthlyExpenseApprovalScreen from '@screens/crm/CRMMonthlyExpenseApprovalScreen';
import CRMSampleApprovalScreen from '@screens/crm/CRMSampleApprovalScreen';
import CRMWorkshopApprovalScreen from '@screens/crm/CRMWorkshopApprovalScreen';
import CRMGiveawayApprovalScreen from '@screens/crm/CRMGiveawayApprovalScreen';
import SalesCRMScreen from '@screens/crm/SalesCRMScreen';
import SalesGenerateOrderScreen from '@screens/crm/SalesGenerateOrderScreen';
import SaleManagementScreen from '@screens/crm/SaleManagementScreen';
import SalesOrderStatusScreen from '@screens/crm/SalesOrderStatusScreen';
import SalesAddCustomerScreen from '@screens/crm/SalesAddCustomerScreen';
import SalesOrderFormScreen from '@screens/crm/SalesOrderFormScreen';
import SalesPaymentScreen from '@screens/crm/SalesPaymentScreen';
import SaleTaskScreen from '@screens/crm/SaleTaskScreen';
import SupplyInfoScreen from '@screens/crm/SupplyInfoScreen';
import CustomerBalanceScreen from '@screens/crm/CustomerBalanceScreen';
import CRMSalesVsTargetScreen from '@screens/crm/CRMSalesVsTargetScreen';
import FinanceScreen from '@screens/finance/FinanceScreen';
import AccountDetailScreen from '@screens/dashboard/AccountDetailScreen';
import LedgerScreen from '@components/ledger/LedgerScreen';
import CustomerAgingScreen from '@components/aging/CustomerAgingScreen';
import CustomerBalanceDetailsScreen from '@components/aging/CustomerBalanceDetailsScreen';
import FinancialDetailScreen from '@screens/dashboard/FinancialDetailScreen';
import InventoryValuationScreen from '@screens/dashboard/InventoryValuationScreen';
import ReportingScreen from '@screens/reporting/ReportingScreen';
import ReportPersonSelectScreen from '@screens/reporting/ReportPersonSelectScreen';
import VoidTransactionsScreen from '@screens/voidTransactions/VoidTransactionsScreen';
import VoidTransactionDetailScreen from '@screens/voidTransactions/VoidTransactionDetailScreen';
import TrailBalanceReportScreen from '@screens/reporting/TrailBalanceReportScreen';
import BalanceSheetReportScreen from '@screens/reporting/BalanceSheetReportScreen';
import AttendanceScreen from '@screens/hcm/AttendanceScreen';
import ExpenseClaimInquiryScreen from '@screens/hcm/ExpenseClaimInquiryScreen';
import ExpenseClaimScreen from '@screens/hcm/ExpenseClaimScreen';
import { LoadingSpinner, CustomHeader } from '@components/common';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLoading, setIsLoading] = React.useState(true);

  // Restore session on app start
  useEffect(() => {
    const restoreUserSession = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const company = await AsyncStorage.getItem('company');

        if (userJson) {
          const user = JSON.parse(userJson);
          dispatch(restoreSession({ user, company }));
        }
      } catch (error) {
        console.log('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreUserSession();
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          header: props => <CustomHeader {...props} />,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainScreen"
              component={MainScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="AccountDetail"
              component={AccountDetailScreen}
            />
            <Stack.Screen name="Ledger" component={LedgerScreen} />
            <Stack.Screen
              name="CustomerAging"
              component={CustomerAgingScreen}
            />
            <Stack.Screen
              name="CustomerBalanceDetails"
              component={CustomerBalanceDetailsScreen}
            />
            <Stack.Screen
              name="FinancialDetail"
              component={FinancialDetailScreen}
            />
            <Stack.Screen
              name="InventoryValuation"
              component={InventoryValuationScreen}
            />
            <Stack.Screen name="Approvals" component={ApprovalsScreen} />
            <Stack.Screen name="Reporting" component={ReportingScreen} />
            <Stack.Screen
              name="ReportPersonSelect"
              component={ReportPersonSelectScreen}
            />
            <Stack.Screen
              name="VoidTransactions"
              component={VoidTransactionsScreen}
            />
            <Stack.Screen
              name="VoidTransactionDetail"
              component={VoidTransactionDetailScreen}
            />
            <Stack.Screen
              name="TrailBalanceReport"
              component={TrailBalanceReportScreen}
            />
            <Stack.Screen
              name="BalanceSheetReport"
              component={BalanceSheetReportScreen}
              options={{ title: 'Balance Sheet' }}
            />
            <Stack.Screen name="Sales" component={SalesScreen} />
            <Stack.Screen name="Purchase" component={PurchaseScreen} />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="HCM" component={HCMScreen} />
            <Stack.Screen
              name="Manufacturing"
              component={ManufacturingScreen}
            />
            <Stack.Screen name="CRM" component={CRMScreen} />
            <Stack.Screen name="SalesCRM" component={SalesCRMScreen} />
            <Stack.Screen
              name="SalesGenerateOrderScreen"
              component={SalesGenerateOrderScreen}
              options={{ title: 'Sale Generate Order' }}
            />
            <Stack.Screen
              name="SaleManagement"
              component={SaleManagementScreen}
            />
            <Stack.Screen
              name="SaleTask"
              component={SaleTaskScreen}
              options={{ title: 'Task Today' }}
            />
            <Stack.Screen
              name="SupplyInfoScreen"
              component={SupplyInfoScreen}
              options={{ title: 'Supply Information' }}
            />
            <Stack.Screen
              name="CustomerBalanceScreen"
              component={CustomerBalanceScreen}
              options={{ title: 'Customer Balance' }}
            />
            <Stack.Screen name="Finance" component={FinanceScreen} />
            {/* Placeholder screens for module quick actions */}
            <Stack.Screen
              name="SalesGenerateOrder"
              component={
                require('@screens/crm/SalesGenerateOrderScreen').default
              }
              options={{ title: 'Generate Order' }}
            />
            <Stack.Screen
              name="SalesAddCustomer"
              component={SalesAddCustomerScreen}
              options={{ title: 'Add Customer' }}
            />
            <Stack.Screen
              name="SalesOrderForm"
              component={SalesOrderFormScreen}
              options={{ title: 'Take Order' }}
            />
            <Stack.Screen
              name="SalesPayment"
              component={SalesPaymentScreen}
              options={{ title: 'Payment' }}
            />
            <Stack.Screen name="SalesDelivery" component={FinanceScreen} />
            <Stack.Screen
              name="SalesTrackOrderStatus"
              component={SalesOrderStatusScreen}
              options={{ title: 'Order Status Dashboard' }}
            />
            <Stack.Screen name="SalesReceivable" component={FinanceScreen} />
            <Stack.Screen name="SalesCostCenter" component={FinanceScreen} />
            <Stack.Screen name="SalesTransactions" component={FinanceScreen} />

            <Stack.Screen
              name="PurchaseAddSupplier"
              component={FinanceScreen}
            />
            <Stack.Screen name="PurchaseGRNAgainPO" component={FinanceScreen} />
            <Stack.Screen name="PurchasePDCDetail" component={FinanceScreen} />
            <Stack.Screen
              name="PurchasePayableSummary"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="PurchaseTransactions"
              component={FinanceScreen}
            />

            <Stack.Screen name="InventoryAddItem" component={FinanceScreen} />
            <Stack.Screen
              name="InventorySearchItem"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="InventoryItemMovement"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="InventoryLocationTransfer"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="InventoryAdjustment"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="InventoryDatedStockSheet"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="InventoryTransactions"
              component={FinanceScreen}
            />

            <Stack.Screen name="HCMAttendance" component={AttendanceScreen} />
            <Stack.Screen
              name="HCMExpenseClaim"
              component={ExpenseClaimInquiryScreen}
            />
            <Stack.Screen name="ExpenseClaim" component={ExpenseClaimScreen} />
            <Stack.Screen name="HCMDVRInquiry" component={FinanceScreen} />
            <Stack.Screen name="HCMLocalPurchase" component={FinanceScreen} />

            <Stack.Screen
              name="MfgElectricalJobCards"
              component={FinanceScreen}
            />
            <Stack.Screen
              name="MfgMechanicalJobCards"
              component={FinanceScreen}
            />
            <Stack.Screen name="MfgTransactions" component={FinanceScreen} />

            <Stack.Screen
              name="CRMContactList"
              component={CRMContactListScreen}
            />
            <Stack.Screen name="CRMAddLead" component={CRMAddLeadScreen} />
            <Stack.Screen
              name="CRMHospitalList"
              component={CRMHospitalListScreen}
            />
            <Stack.Screen
              name="CRMAddHospital"
              component={CRMAddHospitalScreen}
            />
            <Stack.Screen
              name="CRMSalesVsTarget"
              component={CRMSalesVsTargetScreen}
              options={{ title: 'Sales vs Target' }}
            />
            <Stack.Screen
              name="CRMMonthlyExpense"
              component={CRMMonthlyExpenseScreen}
            />
            <Stack.Screen
              name="CRMSampleRequest"
              component={CRMSampleRequestScreen}
            />
            <Stack.Screen
              name="CRMGiveawayRequest"
              component={CRMGiveawayRequestScreen}
            />
            <Stack.Screen
              name="CRMWorkshopRequest"
              component={CRMWorkshopRequestScreen}
            />
            <Stack.Screen
              name="CRMApprovalDashboard"
              component={CRMApprovalDashboard}
              options={{ title: 'Approval Dashboard' }}
            />
            <Stack.Screen
              name="CRMMonthlyExpenseApproval"
              component={CRMMonthlyExpenseApprovalScreen}
              options={{ title: 'Expense Approval' }}
            />
            <Stack.Screen
              name="CRMSampleApproval"
              component={CRMSampleApprovalScreen}
              options={{ title: 'Samples Approval' }}
            />
            <Stack.Screen
              name="CRMWorkshopApproval"
              component={CRMWorkshopApprovalScreen}
              options={{ title: 'Workshops Approval' }}
            />
            <Stack.Screen
              name="CRMGiveawayApproval"
              component={CRMGiveawayApprovalScreen}
              options={{ title: 'Give away Approval' }}
            />
            <Stack.Screen name="CRMViewLead" component={FinanceScreen} />
            <Stack.Screen name="CRMScheduleMeeting" component={FinanceScreen} />
            <Stack.Screen name="CRMLeadToOrder" component={FinanceScreen} />

            <Stack.Screen name="FinanceViewLedger" component={FinanceScreen} />
            <Stack.Screen
              name="FinanceTransactions"
              component={FinanceScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

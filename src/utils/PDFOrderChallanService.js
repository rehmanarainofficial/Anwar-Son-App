export const generateAndShareOrderChallanPDF = async (
  pdfType = 'Sales Order',
  headerData = {},
  detailData = [],
) => {
  let generatePDF, RNShare;
  try {
    generatePDF = require('react-native-html-to-pdf').generatePDF;
    RNShare = require('react-native-share').default;
  } catch (err) {
    throw new Error(
      'Native PDF modules are not linked correctly on iOS. Please run pod install.',
    );
  }
  console.log("Detail ", detailData);
  

  const isChallan = pdfType === 'Delivery Challan';

  const dateStr = headerData.trans_date || '';
  const refNo = headerData.reference || '';
  const po_no = headerData.po_no || '';
  const po_date = headerData.po_date || '';
  const ship_to = headerData.ship_to || '';
  const ship_via = headerData.ship_via || '';

  const customerName = headerData.name || '';
  const customerAddress = headerData.address || '';
  const customerNtn = headerData.cust_ntn || '';
  const customerStrn = headerData.cust_strn || '';
  const branchName = headerData.branch_name || '';

  const companyName = headerData?.company_name || '';
  const paymentTerms = headerData?.payment_terms || '';

  const shipAddress = headerData?.ship_address || '';

  const bankName = headerData?.company_bank_name || '';
  const bankTitle = headerData?.company_bank_title || '';
  const bankAccount = headerData?.company_bank_account_no || '';

  let htmlContent = '';

  if (isChallan) {
    // Delivery Challan layout
    const rowsHtml =
      detailData.length > 0
        ? detailData
            .map((row, index) => {
              return `<tr>
        <td>${index + 1}</td>
        <td>${row.stock_id || ''}</td>
        <td>${row.description || ''}</td>
        <td>${row.manufacturer || ''}</td>
        <td>Lot:${row.lot_no || ''} Exp:${
                row.exp_date || ''
              }</td>
        <td>${row.unit || ''}</td>
        <td>${parseFloat(row.quantity || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}</td>
      </tr>`;
            })
            .join('')
        : '<tr><td colspan="7" style="text-align: center;">No items found</td></tr>';

    htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; font-size: 11px; }
          .header-title { text-align: center; font-size: 20px; font-weight: bold; }
          .flex-between { display: flex; justify-content: space-between; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #e5e7eb; }
          .mb-10 {
            margin-bottom: 40px; 
          }
        </style>
      </head>
      <body>
        <table>
          <thead style="display: table-header-group;">
            <tr>
              <td colspan="7" style="border: none; padding: 0;">
                <div class="header-title mb-10">DELIVERY CHALLAN</div>
                <div class="flex-between">
                  <div style="width: 50%; ">
                    <div class="bold" style="font-size: 14px;">CUSTOMER</div>
                    <div>${customerName}</div>
                    <div>NTN: ${customerNtn} STRN: ${customerStrn}</div>
                    <br/>
                    <div>${branchName}</div>
                  </div>
                  <div style="width: 40%;">
                    <div class="flex-between bold"><div>DC No</div><div>${refNo}</div></div>
                    <div class="flex-between bold"><div>DC Date</div><div>${dateStr}</div></div>
                    <hr style="margin: 2px 0;"/>
                    <div class="flex-between"><div>Customer PO#:</div><div>${po_no}</div></div>
                    <div class="flex-between"><div>PO Date</div><div>${po_date}</div></div>
                    <hr style="margin: 2px 0;"/>
                    <div class="flex-between"><div>Shipping via:</div><div>${ship_via}</div></div>
                    <hr style="margin: 2px 0;"/>
                    <div class="flex-between"><div>Ship To:</div><div>${ship_to}</div></div>
                    <div style="text-align: right; margin-bottom: 40px;">${shipAddress}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>Sr.No</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Manufacturer</th>
              <th>Lot Number</th>
              <th>U/M</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
    `;
  } else {
    // Sales Order layout
    let subTotal = 0;
    const rowsHtml =
      detailData.length > 0
        ? detailData
            .map(row => {
              const price = parseFloat(row.unit_price || 0);
              const qty = parseFloat(row.quantity || 0);
              const rowTotal = price * qty;
              subTotal += rowTotal;
              return `<tr>
        <td>${row.stock_id || ''}</td>
        <td>${row.description || ''}</td>
        <td>${row.lot_no || ''}</td>
        <td>${row.exp_date || ''}</td>
        <td style="text-align: right;">${qty.toLocaleString()}</td>
        <td>${row.unit || ''}</td>
        <td style="text-align: right;">${price.toLocaleString(undefined, {
          minimumFractionDigits: 0,
        })}</td>
        <td style="text-align: right;">${rowTotal.toLocaleString(undefined, {
          minimumFractionDigits: 0,
        })}</td>
      </tr>`;
            })
            .join('')
        : '<tr><td colspan="8" style="text-align: center;">No items found</td></tr>';

    const customerTaxes = headerData.taxes || [];
    let calculatedTaxes = [];
    let sumOfNonWhtTaxes = 0;

    // First calculate all taxes that do not start with "WHT" (since they are calculated from subTotal)
    customerTaxes.forEach(tax => {
      const isWht = tax.tax_name && tax.tax_name.trim().toUpperCase().startsWith('WHT');
      if (!isWht) {
        const rate = parseFloat(tax.tax_rate || 0);
        const taxValue = subTotal * (rate / 100);
        sumOfNonWhtTaxes += taxValue;
      }
    });

    // Calculate final tax values
    calculatedTaxes = customerTaxes.map(tax => {
      const isWht = tax.tax_name && tax.tax_name.trim().toUpperCase().startsWith('WHT');
      const rate = parseFloat(tax.tax_rate || 0);
      let taxValue = 0;

      if (isWht) {
        taxValue = sumOfNonWhtTaxes * (rate / 100);
      } else {
        taxValue = subTotal * (rate / 100);
      }

      return {
        ...tax,
        calculatedValue: taxValue,
      };
    });

    const finalGrandTotal = subTotal + calculatedTaxes.reduce((sum, t) => sum + t.calculatedValue, 0);

    let taxHtml = '';
    if (calculatedTaxes.length > 0) {
      taxHtml += `
      <tr>
        <td colspan="7" style="text-align: right; padding: 6px;">Sub Total</td>
        <td style="text-align: right; padding: 6px;">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
      </tr>
      `;
      
      calculatedTaxes.forEach(tax => {
        if (tax.calculatedValue > 0) {
          taxHtml += `
          <tr>
            <td colspan="7" style="text-align: right; padding: 6px;">${tax.tax_name || 'Tax'} (${tax.tax_rate}%)</td>
            <td style="text-align: right; padding: 6px;">${tax.calculatedValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          </tr>
          `;
        }
      });
    }

    htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; font-size: 11px; }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 28px; font-weight: bold; }
          .doc-type { font-size: 28px; color: #a0aec0; font-weight: bold; }
          .flex-between { display: flex; justify-content: space-between; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #a0aec0; padding: 6px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead style="display: table-header-group;">
            <tr>
              <td colspan="8" style="border: none; padding: 0;">
                <div class="header-row">
                  <div>
                    <div class="logo">${companyName}</div>
                  </div>
                  <div>
                    <div class="doc-type">SALES ORDER</div>
                    <div style="margin-top: 40px;">
                      <div class="flex-between" style="width: 200px;"><span>Date</span><span>${dateStr}</span></div>
                      <div class="flex-between" style="width: 200px;"><span>Order No.</span><span>${refNo}</span></div>
                      <div class="flex-between" style="width: 200px;"><span>Page #</span><span>1</span></div>
                    </div>
                  </div>
                </div>
                
                <hr style="border: 1px solid #cbd5e1; margin: 20px 0;" />
                
                <div class="flex-between">
                  <div style="width: 45%;">
                    <div class="bold">Charge To</div>
                    <div style="margin-top: 5px;">${customerName}</div>
                    <div>${customerAddress}</div>
                    <div style="margin-top: 15px;">${customerName}</div>
                    <div style="font-style: italic; margin-top: 15px;">Payment Terms: ${paymentTerms}</div>
                  </div>
                  <div style="width: 50%;">
                    <div class="bold">${companyName} BANKING DETAILS</div>
                    <div style="margin-top: 5px;">${bankName}</div>
                    <div>Account Title: ${bankTitle}</div>
                    <div>Account # ${bankAccount}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>Item Code</th>
              <th>Item Description</th>
              <th>LOT</th>
              <th>Exp.Date</th>
              <th style="text-align: right;">Quantity</th>
              <th>U/M</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${taxHtml}
            <tr>
              <td colspan="7" style="text-align: right; font-weight: bold; padding: 10px;">GRAND TOTAL</td>
              <td style="text-align: right; font-weight: bold; padding: 10px;">${finalGrandTotal.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                },
              )}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
    `;
  }

  try {
    const options = {
      html: htmlContent,
      fileName: `${pdfType.replace(/ /g, '_')}_${refNo.replace(
        /[^a-zA-Z0-9]/g,
        '_',
      )}`,
    };
    const file = await generatePDF(options);

    const filePath = file.filePath.startsWith('file://')
      ? file.filePath
      : `file://${file.filePath}`;
    const encodedPath = encodeURI(filePath);

    await RNShare.open({
      url: encodedPath,
      title: `Share ${pdfType}`,
      type: 'application/pdf',
    });
  } catch (e) {
    console.log('Error generating PDF', e);
    throw e;
  }
};

export const generateBalanceSheetHTML = (reportData, toDate) => {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  let html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #E87F24; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
          th { background-color: #E87F24; color: #FFFFFF; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-size: 12px; }
          td { padding: 10px 8px; border: 1px solid #ddd; font-size: 11px; word-wrap: break-word; }
          .class-row { background-color: #FFF3E0; font-weight: bold; font-size: 13px; }
          .group-row { background-color: #FAFAFA; font-weight: bold; font-size: 12px; }
          .account-row { background-color: #FFFFFF; }
          .num { text-align: right; }
          .indent-1 { padding-left: 20px; }
          .indent-2 { padding-left: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BALANCE SHEET REPORT</h1>
          <p>As of: ${formatDate(toDate)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 70%;">Account Description</th>
              <th style="width: 30%;" class="num">Balance</th>
            </tr>
          </thead>
          <tbody>
  `;

  Object.entries(reportData).forEach(([className, groups]) => {
    // Calculate class total
    const classTotal = groups.reduce((acc, grp) => {
      return acc + grp.accounts.reduce((a, b) => a + parseFloat(b.balance || 0), 0);
    }, 0);

    html += `
      <tr class="class-row">
        <td>${className}</td>
        <td class="num">${classTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    `;

    groups.forEach(grp => {
      const groupTotal = grp.accounts.reduce((a, b) => a + parseFloat(b.balance || 0), 0);
      html += `
        <tr class="group-row">
          <td class="indent-1">${grp.type_name}</td>
          <td class="num">${groupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
      `;

      grp.accounts.forEach(acc => {
        html += `
          <tr class="account-row">
            <td class="indent-2">${acc.account_name}</td>
            <td class="num">${parseFloat(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        `;
      });
    });
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  return html;
};

export const mapBalanceSheetToExcel = (reportData) => {
  const data = [['Account Description', 'Balance']];

  Object.entries(reportData).forEach(([className, groups]) => {
    const classTotal = groups.reduce((acc, grp) => {
      return acc + grp.accounts.reduce((a, b) => a + parseFloat(b.balance || 0), 0);
    }, 0);

    data.push([className, classTotal]);

    groups.forEach(grp => {
      const groupTotal = grp.accounts.reduce((a, b) => a + parseFloat(b.balance || 0), 0);
      data.push([`    ${grp.type_name}`, groupTotal]);

      grp.accounts.forEach(acc => {
        data.push([`        ${acc.account_name}`, parseFloat(acc.balance || 0)]);
      });
    });
  });

  return data;
};

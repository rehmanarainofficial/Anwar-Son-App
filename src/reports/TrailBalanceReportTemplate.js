export const generateTrailBalanceHTML = (reportData, reportType, fromDate, toDate, isSummary) => {
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
          <h1>${reportType.replace('_', ' ').toUpperCase()} REPORT</h1>
          <p>Period: ${formatDate(fromDate)} to ${formatDate(toDate)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Account Description</th>
              <th style="width: 15%;" class="num">Opening</th>
              ${!isSummary ? `
              <th style="width: 15%;" class="num">Debit</th>
              <th style="width: 15%;" class="num">Credit</th>
              <th style="width: 20%;" class="num">Closing</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>
  `;

  reportData.forEach(cls => {
    html += `
      <tr class="class-row">
        <td>${cls.class_name}</td>
        <td class="num">${cls.total.opening.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        ${!isSummary ? `
        <td class="num">${cls.total.debit.toLocaleString()}</td>
        <td class="num">${cls.total.credit.toLocaleString()}</td>
        <td class="num">${cls.total.closing.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        ` : ''}
      </tr>
    `;

    cls.groups.forEach(grp => {
      html += `
        <tr class="group-row">
          <td class="indent-1">${grp.group_name}</td>
          <td class="num">${grp.total.opening.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          ${!isSummary ? `
          <td class="num">${grp.total.debit.toLocaleString()}</td>
          <td class="num">${grp.total.credit.toLocaleString()}</td>
          <td class="num">${grp.total.closing.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          ` : ''}
        </tr>
      `;

      grp.accounts.forEach(acc => {
        html += `
          <tr class="account-row">
            <td class="indent-2">${acc.code} - ${acc.name}</td>
            <td class="num">${acc.opening.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            ${!isSummary ? `
            <td class="num">${acc.debit.toLocaleString()}</td>
            <td class="num">${acc.credit.toLocaleString()}</td>
            <td class="num">${acc.closing.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            ` : ''}
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

export const mapTrailBalanceToExcel = (reportData, isSummary) => {
  const data = [];
  const header = ['Account Description', 'Opening'];
  if (!isSummary) {
    header.push('Debit', 'Credit', 'Closing');
  }
  data.push(header);

  reportData.forEach(cls => {
    const clsRow = [cls.class_name, cls.total.opening];
    if (!isSummary) clsRow.push(cls.total.debit, cls.total.credit, cls.total.closing);
    data.push(clsRow);

    cls.groups.forEach(grp => {
      const grpRow = [`    ${grp.group_name}`, grp.total.opening];
      if (!isSummary) grpRow.push(grp.total.debit, grp.total.credit, grp.total.closing);
      data.push(grpRow);

      grp.accounts.forEach(acc => {
        const accRow = [`        ${acc.code} - ${acc.name}`, acc.opening];
        if (!isSummary) accRow.push(acc.debit, acc.credit, acc.closing);
        data.push(accRow);
      });
    });
  });

  return data;
};

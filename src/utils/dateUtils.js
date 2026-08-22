export const formatToAsiaDateTime = (dateInput, includeTime = true) => {
  if (
    !dateInput ||
    dateInput === '0000-00-00 00:00:00' ||
    dateInput === '0000-00-00' ||
    dateInput === 'null' ||
    dateInput === 'undefined' ||
    dateInput === '0'
  ) {
    return 'N/A';
  }

  try {
    const str = String(dateInput).trim();

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(str)) {
      return str;
    }

    let dateObj;

    if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/.test(str)) {
      const hasOffset = str.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(str);
      const isoStr = hasOffset ? str : str.replace(' ', 'T') + 'Z';
      dateObj = new Date(isoStr);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(str.replace(' ', 'T'));
      }
    } else {
      dateObj = new Date(str);
    }

    if (isNaN(dateObj.getTime())) {
      return str;
    }

    const options = {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }
        : {}),
    };

    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(dateObj);

    let day = '', month = '', year = '', hour = '', minute = '', second = '';
    parts.forEach(p => {
      if (p.type === 'day') day = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'year') year = p.value;
      if (p.type === 'hour') hour = p.value;
      if (p.type === 'minute') minute = p.value;
      if (p.type === 'second') second = p.value;
    });

    if (includeTime && hour) {
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateInput);
  }
};

export const getAsiaCurrentDate = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

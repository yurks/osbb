const reCache = {};
const render = (csv, template) => {
  let out = '';
  if (csv && csv.trim()) {
    const data = csv.split('\n');
    let firstRow;
    data.forEach((item, i) => {
      if (!i && !~~item[0]) {
        firstRow = item.split('\t');
        return;
      }

      let outItem = template;
      data[i] = item.split('\t');

      let key = 'pay-until-visibility';
      reCache[key] = reCache[key] || new RegExp(`%${key}%`, 'g');

      if (!firstRow) {
        outItem = outItem.replace(reCache[key], 'visibility: hidden;');
      } else {
        outItem = outItem.replace(reCache[key], '');
        key = 'pay-until';
        reCache[key] = reCache[key] || new RegExp(`%${key}%`, 'g');
        outItem = outItem.replace(reCache[key], firstRow[21]);
      }

      data[i].forEach((value, key) => {
        reCache[key] = reCache[key] || new RegExp(`%key-${key}%`, 'g');
        outItem = outItem.replace(reCache[key], value === '0' && key < 12 ? '' : value);
      });

      ['display-water', 'display-canal', 'total-count', 'total-vnesok-pay', 'info'].forEach((key) => {
        reCache[key] = reCache[key] || new RegExp(`%${key}%`, 'g');
        switch (key) {
          case 'total-vnesok-pay':
            outItem = outItem.replace(
              reCache[key],
              (parseFloat(data[i][17] || 0) - parseFloat(data[i][8] || 0) - parseFloat(data[i][11] || 0)).toFixed(2)
            );
            break;
          case 'total-count':
            outItem = outItem.replace(
              reCache[key],
              (parseFloat(data[i][5] || 0) + parseFloat(data[i][8] || 0) + parseFloat(data[i][11] || 0)).toFixed(2)
            );
            break;
          case 'info':
            outItem = outItem.replace(
              reCache[key],
              data[i][22] || '<b>Пожалуйста, указывайте номер квартиры при оплате!</b>'
            );
            break;
        }
      });
      if (data[i][8] !== '0') {
        // return;
      }
      out += outItem;
    });
  }

  return out;
};

export default render;

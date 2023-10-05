const title = 'Продовжувати?';

const generateTable = (customDate) => {
  const $$users = SpreadsheetApp.openById(process.env.SHEET_USERS);
  const $$water = SpreadsheetApp.openById(process.env.SHEET_WATER);

  const $users = $$users.getSheetByName('People');
  let users = $users.getDataRange().getValues();
  users = users.slice(1);

  const $prices = $$users.getSheetByName('Prices');
  const prices = $prices.getDataRange().getValues().slice(1);

  const uiMessage = [];

  const formatDate = (date) => `${(date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1)}.${date.getFullYear()}`;

  const formatDateForSheetName = (date) =>
    `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? '0' : ''}${date.getMonth() + 1}`;

  const date = customDate || new Date();
  date.setDate(1);

  const month = formatDate(date);
  uiMessage.push(`поточний місяць: ${month}`);

  date.setMonth(date.getMonth() - 1);
  const curMonthSheetName = formatDateForSheetName(date);
  const curMonthForUser = formatDate(date);

  date.setMonth(date.getMonth() - 1);
  const prevMonthSheetName = formatDateForSheetName(date);
  uiMessage.push(`листи: ${curMonthSheetName} -- ${prevMonthSheetName}`);

  const re_waterSheetDate = /\d{2}\.\d{4}/;
  const _waterSheets = $$water.getSheets();
  let monthWater;
  let water;
  let waterPrevMonth;

  for (const n in _waterSheets) {
    const _waterSheet = _waterSheets[n];
    const _waterSheetPrev = _waterSheets[~~n + 1];
    monthWater = `${re_waterSheetDate.exec(_waterSheet.getName())}`;
    if (monthWater === month) {
      water = _waterSheet.getDataRange().getValues().slice(3);
      waterPrevMonth = _waterSheetPrev.getDataRange().getValues().slice(3);
      uiMessage.push(`вода, дати: ${monthWater} -- ${re_waterSheetDate.exec(_waterSheetPrev.getName())}`);
      uiMessage.push(`вода, листи: ${_waterSheet.getName()} -- ${_waterSheetPrev.getName()}`);
      break;
    }
  }

  const ui = SpreadsheetApp.getUi();

  if (!water || !waterPrevMonth) {
    uiMessage.push('\nНе знайдено показників водопостачання!\nВкажіть інший місяць у форматі YYYY-MM:\n\n');

    const response = ui.prompt(title, uiMessage.join('\n'), ui.ButtonSet.OK_CANCEL);
    const responseText = response.getResponseText()

    if (response.getSelectedButton() === ui.Button.OK && responseText) {
      Logger.log('The user clicked "Ok"');
      Logger.log(`The user entered "${responseText}"`);
      const date = new Date(responseText)
      if (!isFinite(date.getTime())) {
        throw new Error('Невірна дата! Дозволений формат YYYY-MM')
      }
      return generateTable(date)
    }
    return
  } else {
    const response = ui.alert(title, uiMessage.join('\n'), ui.ButtonSet.YES_NO)

    if (response === ui.Button.YES) {
      Logger.log('The user clicked "Yes"');
    } else {
      return;
    }
  }

  Logger.log($users.getName());
  Logger.log(prices);
  Logger.log(users[0]);
  Logger.log(water[0]);
  Logger.log(waterPrevMonth[0]);

  const waterDataCheck = function (i, j, kv) {
    const currIsNumber = typeof water[i][j] === 'number';
    const prevIsNumber = typeof waterPrevMonth[i][j] === 'number';
    if (!currIsNumber && prevIsNumber) {
      throw new Error(`неверные показания, кв: ${kv}, ячейка: ${j + 1}`);
    }
    return currIsNumber && prevIsNumber;
  };

  const data = [
    [
      'o/р',
      'кв',
      'ПІБ',
      'площ',
      'взнос',
      'нарах',
      'вдпст',
      '',
      'нарах.',
      'вдвдв',
      '',
      'нарах',
      'електр',
      'нарах',
      'пільга',
      'субсидія',
      'коригув.',
      '  разом',
      '    борг',
      'підсумок',
      'до сплати',
      'сплачено',
      'коментар',
      'дата',
      'ліфт',
      'нарах'
    ]
  ];

  function sumAndCheck(row, col, kv) {
    const n = water[row][col] - waterPrevMonth[row][col];
    if (n < 0) {
      throw new Error(`неверная разница показаний (${n}), кв: ${kv}, ячейка: ${col + 1}`);
    }
    return n;
  }

  let priceWater;
  let priceCanal;
  for (let i = 0; i < users.length; i++) {
    priceWater = priceCanal = 0;
    try {
      if (month === monthWater) {
        if (water[i] && waterPrevMonth[i] && users[i][0] === water[i][0] && waterPrevMonth[i][0] === water[i][0]) {
          if (waterDataCheck(i, 2, users[i][0])) {
            priceWater += sumAndCheck(i, 2, users[i][0]);
          }
          if (waterDataCheck(i, 4, users[i][0])) {
            priceWater += sumAndCheck(i, 4, users[i][0]);
          }
          if (waterDataCheck(i, 6, users[i][0])) {
            priceWater += sumAndCheck(i, 6, users[i][0]);
          }
          if (waterDataCheck(i, 3, users[i][0])) {
            priceCanal += sumAndCheck(i, 3, users[i][0]);
          }
          if (waterDataCheck(i, 5, users[i][0])) {
            priceCanal += sumAndCheck(i, 5, users[i][0]);
          }
          if (waterDataCheck(i, 7, users[i][0])) {
            priceCanal += sumAndCheck(i, 7, users[i][0]);
          }
          priceCanal += priceWater;
          if (waterDataCheck(i, 8, users[i][0])) {
            priceCanal = prices[1][4] * water[i][8];
            priceWater = prices[2][4] * water[i][8];
          }
        }
      }
    } catch (e) {
      ui.alert('Stopped', `${e}`, ui.ButtonSet.OK);
      return;
    }

    const index = i + 2;

    const secondFloorId = 5;
    const podvalId = 45;
    const isFirstFlooor = typeof users[i][4] === 'number' && users[i][4] < secondFloorId;
    const isPodval = typeof users[i][4] !== 'number';

    data.push([
      users[i][0],
      users[i][4],
      `${users[i][1]} ${users[i][2]} ${users[i][3]}`,
      users[i][5],
      isPodval ? prices[0][3] : isFirstFlooor ? prices[0][2] : prices[0][1],
      `=ROUND(D${index}*E${index},2)`,
      priceWater,
      prices[1][1],
      `=ROUND(G${index}*H${index},2)`,
      priceCanal,
      prices[2][1],
      `=ROUND(J${index}*K${index},2)`,
      isPodval
        ? ''
        : isFirstFlooor
        ? `=ROUND((M1*SUM(D2:D${secondFloorId})/SUM(D${secondFloorId + 1}:D${podvalId})/${
            prices[3][2]
          }/10)/SUM(D2:D${secondFloorId}),3)`
        : `=ROUND((M1-(M1*SUM(D2:D${secondFloorId})/SUM(D${secondFloorId + 1}:D${podvalId})/${prices[3][2]}/10))/SUM(D${
            secondFloorId + 1
          }:D${podvalId}),3)`,
      `=ROUND(D${index}*M${index},2)`,
      '',
      '',
      '',

      `=ROUND(F${index}+I${index}+L${index}+N${index}+Z${index}-O${index}-P${index}+Q${index},2)`,
      `=ROUND('${prevMonthSheetName}'!T${index}-V${index},2)`,
      `=ROUND(R${index}+S${index},2)`,
      `=MAX(T${index},0)`,
      '',
      '',
      // eslint-disable-next-line no-irregular-whitespace
      `${curMonthForUser} `,
      '',
      `=ROUND(D${index}*Y${index},2)`
    ]);
  }

  const $$active = SpreadsheetApp.getActiveSpreadsheet();
  const $active = $$active.insertSheet(0);

  $active.setName(curMonthSheetName);

  $active.getRange(1, 1, data.length, data[0].length).setValues(data); // write new data to sheet, overwriting old data

  $active.autoResizeColumn(1);
  for (let i = 3; i <= data[0].length; i++) {
    $active.autoResizeColumn(i);
  }
};

generateTable.appMenu = 'создать таблицу';
export default generateTable;

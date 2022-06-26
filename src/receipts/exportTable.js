const exportTable = () => {
  const $$users = SpreadsheetApp.openById(process.env.SHEET_USERS);
  const $config = $$users.getSheetByName('Config');
  const config = $config
    .getDataRange()
    .getValues()
    .map((row) => row.join('\t'))
    .join('\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  let range = sheet.getActiveRange();
  if (range.getColumn() !== 1 || range.getNumColumns() < 22) {
    range = sheet.getDataRange();
  }

  let skip = false;
  return {
    config,
    name: sheet.getName(),
    data: range
      .getValues()
      .filter((row) => {
        if (!row[0]) {
          skip = true;
        }
        return !skip;
      })
      .map((row) =>
        row
          .map((cell) => {
            if (typeof cell === 'number' && cell % 1 !== 0) {
              cell = cell.toFixed(3);
              if (cell.charAt(cell.length - 1) === '0') {
                cell = cell.slice(0, cell.length - 1);
              }
            }
            return cell;
          })
          .join('\t')
      )
      .join('\n')
  };
};

exportTable.appMenu = false;
export default exportTable;

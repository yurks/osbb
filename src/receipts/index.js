const title = 'Квитанції';

const generateReceipts = () => {
  const html = HtmlService.createHtmlOutputFromFile(process.env.APP_CONFIG.receipts.htmlFile)
    .setWidth(750)
    .setHeight(400);

  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
    .showModalDialog(html, title);
};

generateReceipts.appMenu = 'печатать квитанции';

export default generateReceipts;

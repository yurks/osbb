import menuReceipts from './receipts';
import menuTable from './table';
import exportTable from './receipts/exportTable';

const bootstrap = (...menu) => {
  const ui = SpreadsheetApp.getUi();

  return menu.reduce((o, fn) => {
    if (fn.appMenu) {
      console.log(`Menu item '${fn.appMenu}' added: ${fn.name}()`);
      return o.addItem(fn.appMenu, fn.name);
    }
    return o;
  }, ui.createMenu('osbb'));
};

const onOpen = () => {
  bootstrap(menuTable, menuReceipts, exportTable).addToUi();
};

onOpen.dummy = () => {};
onOpen.dummy();

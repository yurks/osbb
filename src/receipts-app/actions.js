import './actions.scss';
import render from 'wsk-utils/dom/element/render';

const renderActions = (actions) =>
  render(
    Object.entries(actions || {})
      .map(([id, { label }]) =>
        render(
          label,
          {
            action: id
          },
          'button'
        )
      )
      .join(''),
    { 'print-cloak': '', classname: 'app-actions' }
  );

export default renderActions;

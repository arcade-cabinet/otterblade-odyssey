/** @jsxImportSource solid-js */
import { render } from 'solid-js/web';
import OtterbladeGame from './game/OtterbladeGame';

const rootElement = document.getElementById('root');
if (rootElement) {
  render(() => <OtterbladeGame />, rootElement);
}

import { render } from 'solid-js/web';
import OtterbladeGame from './game/OtterbladeGame';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

render(() => OtterbladeGame(), rootElement);

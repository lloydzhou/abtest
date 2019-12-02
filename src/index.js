import dva from 'dva';
import './index.css';
import { createBrowserHistory as createHistory } from 'history';

export const history = createHistory()

// 1. Initialize
const app = dva({
  history: history,
});

// 2. Plugins
// app.use({});

// 3. Model
app.model(require('./models/common').default);

// 4. Router
app.router(require('./routes').default);

// 5. Start
app.start('#root');

export const dispatch = app._store.dispatch

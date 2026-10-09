import './styles/main.css';
import { startPwa } from './pwa';
import { createRouter, lazy } from './router';
import { render as home } from './views/home';
import { render as item } from './views/item';
import { render as notFound } from './views/notFound';
import { render as parent } from './views/parent';
import { render as browse } from './views/browse';

const root = document.getElementById('app')!;
createRouter(root, {
  home,
  item,
  scan: lazy(() => import('./views/scan')), // camera + QR decoder load only when scanning
  browse,
  parent,
  labels: lazy(() => import('./views/labels')), // keeps the QR generator out of the child-facing bundle
  notFound,
}).start();

startPwa();

import './styles/main.css';
import { createRouter, lazy } from './router';
import { render as home } from './views/home';
import { render as item } from './views/item';
import { render as notFound } from './views/notFound';

const root = document.getElementById('app')!;
createRouter(root, {
  home,
  item,
  labels: lazy(() => import('./views/labels')), // keeps the QR generator out of the child-facing bundle
  notFound,
}).start();

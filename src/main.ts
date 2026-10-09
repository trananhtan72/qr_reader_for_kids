import './styles/main.css';
import { createRouter } from './router';
import { render as home } from './views/home';
import { render as item } from './views/item';
import { render as notFound } from './views/notFound';

const root = document.getElementById('app')!;
createRouter(root, { home, item, notFound }).start();

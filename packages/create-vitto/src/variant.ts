import { styleText } from 'node:util';

type ColorFunction = (text: string) => string;

export interface TemplateVariant {
  name: string;
  display: string;
  color: ColorFunction;
  customCommand?: string;
}

const frameworkVariants: TemplateVariant[] = [
  {
    name: 'basic',
    display: 'Basic',
    color: (text: string) => styleText('cyan', text),
  },
  {
    name: 'alpinejs',
    display: 'Alpine.js',
    color: (text: string) => styleText('magenta', text),
  },
  {
    name: 'htmx',
    display: 'HTMX',
    color: (text: string) => styleText('blue', text),
  },
  {
    name: 'tailwindcss',
    display: 'Tailwind CSS',
    color: (text: string) => styleText('cyan', text),
  },
  {
    name: 'blog',
    display: 'Blog (Tailwind + Pagination)',
    color: (text: string) => styleText('green', text),
  },
  {
    name: 'full',
    display: 'Full (Docs + Blog + Tailwind)',
    color: (text: string) => styleText('white', text),
  },
];

export { frameworkVariants };

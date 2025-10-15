import './styles/global.css'

import typescriptLogo from '/typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 text-neutral-100 dark:bg-gradient-to-b dark:from-neutral-900 dark:to-neutral-950 dark:text-neutral-100">
    <div class="flex gap-4 mb-6">
      <a href="https://vite.dev" target="_blank" rel="noopener">
        <img src="${viteLogo}" class="h-24 p-6 transition duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
      </a>
      <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener">
        <img src="${typescriptLogo}" class="h-24 p-6 transition duration-300 hover:drop-shadow-[0_0_2em_#3178c6aa]" alt="TypeScript logo" />
      </a>
    </div>
    <h1 class="text-5xl font-bold mb-6 text-center">Vite + TypeScript</h1>
    <div class="card p-8 bg-neutral-800/60 rounded-xl shadow-lg mb-6 w-auto min-w-sm flex justify-center">
      <button
        id="counter"
        type="button"
        class="rounded-lg border border-transparent px-4 py-2 text-base font-medium bg-neutral-900 hover:border-[#646cff] focus:outline-none focus:ring-4 focus:ring-blue-400 transition-colors"
      >
        Counter
      </button>
    </div>
    <p class="text-gray-400 text-center">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

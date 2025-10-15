import type { Plugin } from 'vite'
import { _console } from './logger'
import { DEFAULT_OPTS, type VentoPluginOptions } from './options'

export default function ventoPlugin(opts: VentoPluginOptions = DEFAULT_OPTS): Plugin {
  return {
    name: 'vite-vento-plugin',
    configResolved(config) {
      _console.log('Vite config resolved:', config.root)
    },
    buildStart() {
      _console.log('Vento plugin options:', opts)
    },
    closeBundle() {
      _console.log('Build finished!')
    },
  }
}

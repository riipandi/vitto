import type { ConsolaReporter, LogObject } from 'consola'
import { createConsola } from 'consola'

const simpleReporter: ConsolaReporter = {
  log(logObj: LogObject) {
    const message = logObj.args.join(' ')
    const stream = logObj.level < 2 ? process.stderr : process.stdout
    stream.write(`${message}\n`)
  },
}

const _console = createConsola({
  reporters: [simpleReporter],
  formatOptions: {
    date: false,
    compact: true,
    colors: true,
  },
})

export default _console

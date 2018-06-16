const fs = require('fs')
const glob = require('glob')
const acorn = require('acorn')

const acornOpts = { ecmaVersion: 5, silent: true }
const errArray = []

// pattern => glob or array
const globbedFiles = glob.sync('dist/*.js', { nodir: true })

globbedFiles.forEach(file => {
  const code = fs.readFileSync(file, 'utf8')

  try {
    acorn.parse(code, acornOpts)
  } catch (err) {
    console.log(`ES-Check: failed to parse file: ${file} \n - error: ${err}`)
    const errorObj = {
      err,
      stack: err.stack,
      file
    }
    errArray.push(errorObj)
  }
})

if (errArray.length > 0) {
  console.log(
    `ES-Check: there were ${errArray.length} ES version matching errors.`
  )
  errArray.forEach(o => {
    console.info(`
          ES-Check Error:
          ----
          · erroring file: ${o.file}
          · error: ${o.err}
          · see the printed err.stack below for context
          ----\n
          ${o.stack}
        `)
  })
  process.exit(1)
}

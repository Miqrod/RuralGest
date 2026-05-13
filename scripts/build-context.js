const fs = require('fs')

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

const base = read('./context.md')

const context = base
  .replace('{{decisions}}', read('./documentacion/memory/decisions.md'))
  .replace('{{patterns}}', read('./documentacion/memory/patterns.md'))
  .replace('{{mistakes}}', read('./documentacion/memory/mistakes.md'))
  .replace('{{glossary}}', read('./documentacion/memory/glossary.md'))

fs.writeFileSync('./context.generated.md', context)

console.log('✅ context.generated.md generado')
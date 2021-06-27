const netlifyBuild = require('@netlify/build')
const test = require('ava')

const NETLIFY_CONFIG = `${__dirname}/../netlify.toml`

test('Netlify Build should not fail', async (t) => {
  const { success, logs } = await netlifyBuild({
    config: NETLIFY_CONFIG,
    buffer: true,
  })

  // Netlify Build output
  console.log([logs.stdout.join('\n'), logs.stderr.join('\n')].filter(Boolean).join('\n\n'))

  // Check that build succeeded
  t.true(success)
})

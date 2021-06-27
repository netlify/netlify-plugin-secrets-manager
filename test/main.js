const netlifyBuild = require('@netlify/build')
const test = require('ava')

const NETLIFY_CONFIG = `${__dirname}/../netlify.toml`

test('Netlify Build fails when missing NETLIFY_AWS_ACCESS_KEY_ID env variable', async (t) => {
  const { success, logs } = await netlifyBuild({
    env: {},
    config: NETLIFY_CONFIG,
    buffer: true,
  })

  t.is(success, false)

  const output = logs.stdout.join('')
  t.true(output.includes('Missing environment variable NETLIFY_AWS_ACCESS_KEY_ID'))
})

test('Netlify Build fails when missing NETLIFY_AWS_SECRET_ACCESS_KEY env variable', async (t) => {
  const { success, logs } = await netlifyBuild({
    env: { NETLIFY_AWS_ACCESS_KEY_ID: 'test' },
    config: NETLIFY_CONFIG,
    buffer: true,
  })

  t.is(success, false)

  const output = logs.stdout.join('')
  t.true(output.includes('Missing environment variable NETLIFY_AWS_SECRET_ACCESS_KEY'))
})

test('Netlify Build fails when NETLIFY_AWS_ACCESS_KEY_ID and NETLIFY_AWS_SECRET_ACCESS_KEY are invalid', async (t) => {
  const { success, logs } = await netlifyBuild({
    env: { NETLIFY_AWS_ACCESS_KEY_ID: 'test', NETLIFY_AWS_SECRET_ACCESS_KEY: 'test' },
    config: NETLIFY_CONFIG,
    buffer: true,
  })

  t.is(success, false)

  const output = logs.stdout.join('')
  t.true(output.includes('The security token included in the request is invalid'))
})

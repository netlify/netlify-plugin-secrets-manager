const process = require('process')

const { SecretsManagerClient, ListSecretsCommand, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager')
const chalk = require('chalk')

const listSecrets = async ({ client, nextToken, secrets = [] }) => {
  const response = await client.send(new ListSecretsCommand({ NextToken: nextToken }))

  const newSecrets = [...secrets, ...response.SecretList]
  if (response.NextToken) {
    return [...newSecrets, ...(await listSecrets({ client, nextToken: response.NextToken, secrets }))]
  }

  return newSecrets
}

const normalizeSecretValue = async ({ client, secret }) => {
  try {
    // SecretString is a JSON string representation of the secret, e.g. '{"SECRET_NAME":"SECRET_VALUE"}'
    const { SecretString: secretString } = await client.send(new GetSecretValueCommand({ SecretId: secret.ARN }))
    const parsedValue = JSON.parse(secretString)
    return parsedValue
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      return console.log(chalk.dim(`Skipping restricted AWS secret ${chalk.yellow(secret.Name)}`))
    }
    throw error
  }
}

const normalizeSecrets = async ({ client, secrets }) => {
  const values = await Promise.all(secrets.map((secret) => normalizeSecretValue({ client, secret })))
  return Object.assign({}, ...values)
}

const SECRET_PREFIX = process.env.NETLIFY_AWS_SECRET_PREFIX || 'NETLIFY_AWS_SECRET_'

const getPrefixedKey = (key) => `${SECRET_PREFIX}${key}`

module.exports = {
  async onPreBuild({ utils }) {
    const {
      NETLIFY_AWS_ACCESS_KEY_ID: accessKeyId,
      NETLIFY_AWS_SECRET_ACCESS_KEY: secretAccessKey,
      NETLIFY_AWS_DEFAULT_REGION: region = 'us-east-1',
    } = process.env
    if (!accessKeyId) {
      return utils.build.failBuild(`Missing environment variable NETLIFY_AWS_ACCESS_KEY_ID`)
    }

    if (!secretAccessKey) {
      return utils.build.failBuild(`Missing environment variable NETLIFY_AWS_SECRET_ACCESS_KEY`)
    }

    const client = new SecretsManagerClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
    const secrets = await listSecrets({ client })
    const normalizedSecrets = await normalizeSecrets({ client, secrets })

    const entries = Object.entries(normalizedSecrets)
    entries.forEach(([key]) => {
      console.log(
        `${chalk.bold('Injecting AWS secret')} ${chalk.magenta(`${key}`)} as ${chalk.green(getPrefixedKey(key))}`,
      )
    })

    const prefixedSecrets = Object.fromEntries(entries.map(([key, value]) => [getPrefixedKey(key), value]))

    Object.assign(process.env, prefixedSecrets)
  },
}

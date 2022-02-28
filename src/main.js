const process = require('process')

const {
  SecretsManagerClient,
  ListSecretsCommand,
  GetSecretValueCommand,
  DescribeSecretCommand,
} = require('@aws-sdk/client-secrets-manager')
const chalk = require('chalk')

const listSecrets = async ({ client, nextToken, secrets = [] }) => {
  const response = await client.send(new ListSecretsCommand({ NextToken: nextToken }))

  const newSecrets = [...secrets, ...response.SecretList]
  if (response.NextToken) {
    return [...newSecrets, ...(await listSecrets({ client, nextToken: response.NextToken, secrets }))]
  }

  return newSecrets
}

const getSecretContext = async ({ client, secret }) => {
  try {
    const { Tags: tags = [] } = await client.send(new DescribeSecretCommand({ SecretId: secret.ARN }))
    const context = tags.find(({ Key: key }) => key === 'NETLIFY_CONTEXT')
    return context && context.Value
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      return console.log(
        chalk.dim(`Does not have permissions to retrieve context for secret ${chalk.yellow(secret.Name)}`),
      )
    }
  }
}

const getSecretsValue = async ({ client, secret }) => {
  try {
    // SecretString is a JSON string representation of the secret, e.g. '{"SECRET_NAME":"SECRET_VALUE"}'
    const { SecretString: secretString } = await client.send(new GetSecretValueCommand({ SecretId: secret.ARN }))
    const context = await getSecretContext({ client, secret })
    const parsedValue = JSON.parse(secretString)
    return Object.entries(parsedValue).map(([key, value]) => ({ key, value, context }))
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      console.log(chalk.dim(`Skipping restricted secret ${chalk.yellow(secret.Name)}`))
      return []
    }
    throw error
  }
}

const getSecretsValues = async ({ client, secrets }) => {
  const secretsWithValues = await Promise.all(secrets.map((secret) => getSecretsValue({ client, secret })))
  return secretsWithValues.flat()
}

const SECRET_PREFIX = process.env.NETLIFY_AWS_SECRET_PREFIX || 'NETLIFY_AWS_SECRET_'

const getPrefixedKey = (key) => `${SECRET_PREFIX}${key}`

module.exports = {
  async onPreBuild({ netlifyConfig, utils }) {
    const {
      NETLIFY_AWS_ACCESS_KEY_ID: accessKeyId,
      NETLIFY_AWS_SECRET_ACCESS_KEY: secretAccessKey,
      NETLIFY_AWS_DEFAULT_REGION: region = 'us-east-1',
      CONTEXT,
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
    const secretsWithValues = await getSecretsValues({ client, secrets })
    secretsWithValues.forEach(({ key, value, context }) => {
      const prefixedKey = getPrefixedKey(key)

      // no context, inject to all
      if (!context) {
        console.log(`${chalk.bold('Injecting AWS secret')} ${chalk.magenta(`${key}`)} as ${chalk.green(prefixedKey)}`)
        // eslint-disable-next-line no-param-reassign
        netlifyConfig.build.environment[prefixedKey] = value
        return
      }

      // inject only to matching context
      if (CONTEXT === context) {
        console.log(
          `${chalk.bold('Injecting AWS secret')} ${chalk.magenta(`${key}`)} as ${chalk.green(
            prefixedKey,
          )} to context ${chalk.yellow(context)}`,
        )
        /* eslint-disable-next-line no-param-reassign */
        netlifyConfig.build.environment[prefixedKey] = value
      }
    })
  },
}

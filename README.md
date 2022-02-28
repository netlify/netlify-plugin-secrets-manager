[![Build](https://github.com/netlify-labs/netlify-plugin-secrets-manager/workflows/Build/badge.svg)](https://github.com/netlify-labs/netlify-plugin-secrets-manager/actions)
[![Node](https://img.shields.io/node/v/@netlify/plugin-secrets-manager.svg?logo=node.js)](https://www.npmjs.com/package/@netlify/plugin-secrets-manager)

# Netlify Plugin Secrets Manager

Inject secrets from AWS Secrets Manager into the Netlify build process.

## Prerequisites

- `NETLIFY_AWS_ACCESS_KEY_ID` and `NETLIFY_AWS_SECRET_ACCESS_KEY` set as build environment variables with proper
  permissions, e.g.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
        "Sid": "VisualEditor0",
        "Effect": "Allow",
        "Action": "secretsmanager:GetSecretValue",
        "Resource": "arn:aws:secretsmanager:us-east-1:534156574994:secret:netlify/plugin/*"
    },
    {
        "Sid": "VisualEditor1",
        "Effect": "Allow",
        "Action": "secretsmanager:DescribeSecret",
        "Resource": "arn:aws:secretsmanager:us-east-1:534156574994:secret:netlify/plugin/*"
    },
    {
        "Sid": "VisualEditor2",
        "Effect": "Allow",
        "Action": "secretsmanager:ListSecrets",
        "Resource": "*"
    }
  ]
}
```

> You can scope the `GetSecretValue` permission to a path, but the `ListSecrets` must be a wildcard `*`.
> `DescribeSecret` is required for context based secrets (we use secret tags to get the context)

## Usage

You can install this plugin in the Netlify UI from this
[direct in-app installation link](https://app.netlify.com/plugins/@netlify/plugin-secrets-manager/install) or from the
[Plugins directory](https://app.netlify.com/plugins).

You can also install it manually:

From your project's base directory, use npm, yarn, or any other Node.js package manager to add the plugin to
`devDependencies` in `package.json`.

```bash
npm install -D @netlify/plugin-secrets-manager
```

Then add the plugin to your `netlify.toml` configuration file:

```toml
[[plugins]]
package = "@netlify/plugin-secrets-manager"
```

## Additional configuration

- By default the plugin injects the secrets with a `NETLIFY_AWS_SECRET_` prefix. You can override the default prefix
  using the `NETLIFY_AWS_SECRET_PREFIX` environment variable.
- The plugin defaults to the `us-east-1` region. You can override the default region using the
  `NETLIFY_AWS_DEFAULT_REGION` environment variable.

## Contributors

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to set up and work on this repository. Thanks
for contributing!

# Launchr Web plugin

Launchr Web plugin is an extenstion to [Launchr](https://github.com/launchrctl/launchr) to run actions via Web UI.
The plugin consists of a Backend API and a Frontend client.

## Table of contents

* [Usage](#usage)
* [Development](#development)
* [Web UI Customization](#web-ui-customization)

## Usage

Build `launchr` from source locally. Build dependencies:
1. `go >=1.21`, see [installation guide](https://go.dev/doc/install)
2. `nodejs 20`, see [NVM](https://github.com/nvm-sh/nvm) or [Volta](https://github.com/volta-cli/volta)
3. `make`

Build the `launchr` tool:
```shell
make
bin/launchr web --help
```

The documentation for `launchr` usage can be found in [the main project](https://github.com/launchrctl/launchr).

@todo update readme
## To build the client:
### Node
```shell
cd client
# Install yarn 4 https://yarnpkg.com/getting-started/install yarn set version stable

# Fetch dependencies
yarn
# Build the project
yarn build
# Start client dev server
yarn dev
```
### Docker
```shell
make front-install front-build
```

See [client readme](client/README.MD) for more information.

To run Launchr Web server:
```shell
# Run web server on http://localhost:8080
bin/launchr web
# To use example as base dir for actions discovery.
LAUNCHR_ACTIONS_PATH=example bin/launchr web
# Run web server on http://localhost:3000
bin/launchr web -p 3000
# Serve swagger-ui and swagger.json
# Paths /api/swagger.json and /api/swagger-ui
bin/launchr web --swagger-ui
# To proxy requests to client dev server
bin/launchr web --swagger-ui --proxy-client=http://localhost:5173/
```

By default, Launchr HTTP server provides client files from `client/dist`.
But as shown above, launchr may be a reverse proxy server for `yarn dev` with `--proxy-client` flag.

If you face any issues with `launchr`:
1. Open an issue in the repo.
2. Share the app version with `launchr --version`

## Development

The `launchr`  can be built with a `make` to `bin` directory:
```shell
make
```
It is also supported to make a build to use with `dlv` for debug:
```shell
make DEBUG=1
```

Useful make commands:
1. Fetch dependencies - `make deps`
2. Test the code - `make test`
3. Lint the code - `make lint`

@todo review
## Test for release

```shell
make front-install front-build
make EMBED=1
```

## To push new client release.

```shell
git tag v0.0.X
git push --tags
```
and wait for github action will finished.

## Web UI Customization

Launchr provides several options to customize the web user interface according to your needs.

You can customize the web UI by adding a `web` section to your `.binary/config.yaml` file with the following options:

```yaml
web:
  # Exclude specific actions from appearing in the web interface
  excluded_actions:
    - web
    - other-action-to-hide

  # Path to a YAML file containing variables to be passed to the frontend
  vars_file: path/to/vars.yaml

  # List of variable names that should be exposed to the UI
  variables:
    - plasmactl_web_ui_platform_name
    - plasmactl_web_ui_platform_page_name
    - plasmactl_web_ui_platform_header_name
    - plasmactl_web_ui_platform_favicon
```
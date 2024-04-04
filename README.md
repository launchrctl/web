# Launchr Web plugin

Launchr Web plugin is an extenstion to [Launchr](https://github.com/launchrctl/launchr) to run actions via Web UI.
The plugin consists of a Backend API and a Frontend client.

## Table of contents

* [Usage](#usage)
* [Development](#development)

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

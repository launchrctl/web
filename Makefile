GOPATH?=$(HOME)/go
FIRST_GOPATH:=$(firstword $(subst :, ,$(GOPATH)))

NODE_TAG=22 # Always use LTS
SWAGGER_UI_DIR:=./swagger-ui

# Build available information.
GIT_HASH:=$(shell git log --format="%h" -n 1 2> /dev/null)
GIT_BRANCH:=$(shell git rev-parse --abbrev-ref HEAD)
APP_VERSION:="$(GIT_BRANCH)-$(GIT_HASH)"
GOPKG:=github.com/launchrctl/launchr

DEBUG?=0
ifeq ($(DEBUG), 1)
    LDFLAGS_EXTRA=
    BUILD_OPTS=-gcflags "all=-N -l"
else
    LDFLAGS_EXTRA=-s -w
    BUILD_OPTS=-trimpath
endif

BUILD_ENVPARMS:=CGO_ENABLED=0

GOBIN:=$(FIRST_GOPATH)/bin
LOCAL_BIN:=$(CURDIR)/bin

# Linter config.
GOLANGCI_BIN:=$(LOCAL_BIN)/golangci-lint
GOLANGCI_TAG:=1.64.5

.PHONY: all
all: deps front test build

# Install go dependencies
.PHONY: deps
deps:
	$(info Installing go dependencies...)
	go mod download

# Build front dependencies.
.PHONY: front
front: front-install front-build
	@if [ ! -d "$(SWAGGER_UI_DIR)" ]; then \
		echo "Downloading Swagger UI..."; \
		curl -Ss https://api.github.com/repos/swagger-api/swagger-ui/releases/latest | grep tarball_url | cut -d '"' -f 4 |\
    		xargs curl -LsS -o swagger-ui.tar.gz; \
		rm -rf $(SWAGGER_UI_DIR) $(SWAGGER_UI_DIR)-tmp && mkdir $(SWAGGER_UI_DIR)-tmp; \
		tar xzf swagger-ui.tar.gz -C $(SWAGGER_UI_DIR)-tmp --strip=1; \
		mv $(SWAGGER_UI_DIR)-tmp/dist $(SWAGGER_UI_DIR); \
		rm -rf $(SWAGGER_UI_DIR)-tmp && rm swagger-ui.tar.gz; \
		sed -i.bkp "s|https://petstore.swagger.io/v2/swagger.json|/api/swagger.json|g" $(SWAGGER_UI_DIR)/swagger-initializer.js; \
	fi

# Run all tests
.PHONY: test
test:
	$(info Running tests...)
	go test ./...

# Build launchr
.PHONY: build
build:
	$(info Building launchr...)
# Application related information available on build time.
	$(eval LDFLAGS:=-X '$(GOPKG).name=launchr' -X '$(GOPKG).version=$(APP_VERSION)' $(LDFLAGS_EXTRA))
	$(eval BIN?=$(LOCAL_BIN)/launchr)
	go generate ./...
	$(BUILD_ENVPARMS) go build -ldflags "$(LDFLAGS)" $(BUILD_OPTS) -o $(BIN) ./cmd/launchr

# Install launchr
.PHONY: install
install: all
install:
	$(info Installing launchr to GOPATH...)
	cp $(LOCAL_BIN)/launchr $(GOBIN)/launchr

# Install and run linters
.PHONY: lint
lint: .install-lint .lint

# Install golangci-lint binary
.PHONY: .install-lint
.install-lint:
ifeq ($(wildcard $(GOLANGCI_BIN)),)
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(LOCAL_BIN) v$(GOLANGCI_TAG)
endif

# Runs linters
.PHONY: .lint
.lint:
	$(info Running lint...)
	$(GOLANGCI_BIN) run --fix ./...

# Front tasks.
front-install:
	docker run --rm -it -v $(PWD)/client:/usr/src/app -w /usr/src/app node:$(NODE_TAG)  sh -c "corepack install && corepack enable && yarn install"

front-build:
	docker run --rm -it -v $(PWD)/client:/usr/src/app -w /usr/src/app node:$(NODE_TAG) sh -c "corepack install && corepack enable && yarn build"

front-dev:
	docker run --rm -it -v $(PWD)/client:/usr/src/app -p 5173:5173 -w /usr/src/app node:$(NODE_TAG) sh -c "corepack install && corepack enable && yarn dev -- --host"

front-lint-fix:
	docker run --rm -it -v $(PWD)/client:/usr/src/app -w /usr/src/app node:$(NODE_TAG) sh -c "corepack install && corepack enable && yarn lint --fix"

dev:
	DEV=1 make build && LAUNCHR_ACTIONS_PATH=example ./bin/launchr web --foreground -vvvv
export GOSUMDB=off

GOPATH?=$(HOME)/go
FIRST_GOPATH:=$(firstword $(subst :, ,$(GOPATH)))

NODE_TAG=21-alpine3.19

# Build available information.
GIT_HASH:=$(shell git log --format="%h" -n 1 2> /dev/null)
GIT_BRANCH:=$(shell git branch 2> /dev/null | grep '*' | cut -f2 -d' ')
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
DEV?=0
ifeq ($(DEV), 1)
	BUILD_OPTS+=-tags dev
endif

BUILD_ENVPARMS:=CGO_ENABLED=0

GOBIN:=$(FIRST_GOPATH)/bin
LOCAL_BIN:=$(CURDIR)/bin

# Linter config.
GOLANGCI_BIN:=$(LOCAL_BIN)/golangci-lint
GOLANGCI_TAG:=1.55.2

SWAGGER_UI_DIR:=cmd/launchr/assets/github.com/launchrctl/web/swagger-ui
DIST_DIR_SOURCE:=./client/dist
DIST_DIR_DEST:=cmd/launchr/assets/github.com/launchrctl/web

.PHONY: all
all: clean deps copy-front-build test build

# clean assets folder
.PHONY: clean
clean:
	$(info Cleaning assets folder...)
	@sudo rm -rf cmd/launchr/assets

# Install go dependencies
.PHONY: deps
deps:
	$(info Installing go dependencies...)
	go mod download
	@if [ ! -d "$(SWAGGER_UI_DIR)" ]; then \
		echo "Downloading Swagger UI..."; \
		curl -Ss https://api.github.com/repos/swagger-api/swagger-ui/releases/latest | grep tarball_url | cut -d '"' -f 4 |\
        	xargs curl -LsS -o swagger-ui.tar.gz; \
		rm -rf $(SWAGGER_UI_DIR) $(SWAGGER_UI_DIR)-tmp && mkdir -p $(SWAGGER_UI_DIR)-tmp; \
		tar xzf swagger-ui.tar.gz -C $(SWAGGER_UI_DIR)-tmp --strip=1; \
		mv $(SWAGGER_UI_DIR)-tmp/dist $(SWAGGER_UI_DIR) && rm -rf $(SWAGGER_UI_DIR)-tmp && rm swagger-ui.tar.gz; \
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
ifeq ($(DEV),1)
		@echo "development mode"
endif
# Application related information available on build time.
	$(eval LDFLAGS:=-X '$(GOPKG).name=launchr' -X '$(GOPKG).version=$(APP_VERSION)' $(LDFLAGS_EXTRA))
	$(eval BIN?=$(LOCAL_BIN)/launchr)
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
	docker run --rm -it -v $(PWD)/client:/usr/src/app -w /usr/src/app node:$(NODE_TAG) sh -c "corepack install && corepack enable && yarn build" \

copy-front-build:
ifeq ($(DEV),0)
	$(info Copying front-build into assets...)
	@if [ ! -d "$(DIST_DIR_DEST)" ]; then \
         echo "Creating assets folder"; \
		 mkdir -p "$(DIST_DIR_DEST)"; \
	fi
	@sudo cp -r "$(DIST_DIR_SOURCE)" "$(DIST_DIR_DEST)";
endif

front-dev:
	docker run --rm -it -v $(PWD)/client:/usr/src/app -p 5173:5173 -w /usr/src/app node:$(NODE_TAG) sh -c "corepack install && corepack enable && yarn dev -- --host"

front-lint-fix:
	docker run --rm -it -v $(PWD)/client:/usr/src/app -w /usr/src/app node:$(NODE_TAG) sh -c "corepack install && corepack enable && yarn lint --fix"
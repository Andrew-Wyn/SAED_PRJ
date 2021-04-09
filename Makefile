.PHONY: all help requirements compose destroy rebuild start stop restart angular-build angular-install deploy

all: help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

requirements: ## Check if docker binaries exist
	$(MAKE) -C saed_site $@

compose: ## Create docker envirornment
	$(MAKE) -C saed_site $@

destroy: ## Clean up docker environment
	$(MAKE) -C saed_site $@

rebuild: destroy compose ## Recreate docker environment
	$(MAKE) -C saed_site $@

start: ## Start services
	$(MAKE) -C saed_site $@

stop: ## Stop services
	$(MAKE) -C saed_site $@

restart: stop start ## Restart services
	$(MAKE) -C saed_site $@

node_modules: package.json
	@echo "=========== Installing angular's dependencies... "
	@npm install

angular-install: node_modules ## Install angular in project directory

saed_site/frontend: node_modules src angular.json
	@echo "=========== Building angular app... "
	@npm run ng build

angular-build: saed_site/frontend ## Build frontend

TARGET_PORT = $$(echo '$(DEPLOY_TARGET)' | sed 's/.*://')
TARGET_SERV = $$(echo '$(DEPLOY_TARGET)' | sed 's/:.*//')

deploy: saed_site/frontend ## Deploy project on remote server
	@if [ 'x$(DEPLOY_TARGET)' = x ]; then \
		echo; \
		echo "Please set the DEPLOY_TARGET variable with the deployment server's"; \
		echo "address and credentials. E.g.:"; \
		echo "$$ make deploy DEPLOY_TARGET=username@server.address:port"; \
		echo; \
		exit 1; \
	fi
	@rsync -avzP --delete-before -e "ssh -p$(TARGET_PORT)" saed_site/ "$(TARGET_SERV)":saed_site
	@ssh -p"$(TARGET_PORT)" "$(TARGET_SERV)" 'make -C saed_site rebuild'

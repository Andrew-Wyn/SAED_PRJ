.PHONY: all help requirements compose destroy rebuild start stop restart angular-build

all: help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

requirements: ## Check if docker binaries exist
	@echo '============ Checking if docker binaries exist...'
	@docker --version
	@docker-compose --version
	@echo '============ OK!'

compose: ## Create docker envirornment
	@echo '============ Creating docker environment...'
	@cd saed_site
	docker-compose build --pull
	docker-compose up -d
	@echo '============ Docker environment for your project successfully created.'

destroy: ## Clean up docker environment
	@echo '============ Cleaning up docker environment...'
	@cd saed_site
	docker-compose down -v
	docker-compose kill
	docker-compose rm -vf
	@echo '============ Docker environment for your project successfully destroyed.'

rebuild: destroy compose ## Recreate docker environment

start: ## Start services
	@cd saed_site
	docker-compose start

stop: ## Stop services
	@cd saed_site
	docker-compose stop

restart: stop start ## Restart services

angular-build: ## Build frontend
	@echo "=========== Building angular app... "
	ng build

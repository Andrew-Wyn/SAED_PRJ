.PHONY: help

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
	docker-compose build --pull
	docker-compose up -d
	@echo '============ Docker environment for your project successfully created.'

destroy: ## Cleaning up docker environment
	@echo "============ Cleaning up docker environment..."
	docker-compose down -v
	docker-compose kill
	docker-compose rm -vf

start: ## Start services 
	docker-compose start

stop: ## Stop services
	docker-compose stop

restart: destroy compose ## Restart environment

build_angular: ## Build angular project inside frontend directory
	@echo "=========== Building angular app... "
	@cd frontend && ng build
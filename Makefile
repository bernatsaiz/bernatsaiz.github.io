.PHONY: install
install:
	@npm install
	@pre-commit install

.PHONY: run
run:
	@hugo server --buildDrafts --logLevel debug

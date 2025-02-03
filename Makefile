.PHONY: run
run:
	@hugo server --buildDrafts --disableFastRender

.PHONY: clean
clean:
	@rm -rf public
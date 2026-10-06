# macOS 27 SDK của Command Line Tools làm linker của Go/cgo báo "unknown architecture"
# → build bằng SDK 26.5 (đổi nếu máy có SDK khác).
SDKROOT ?= /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk
export SDKROOT
WAILS ?= $(HOME)/go/bin/wails

.PHONY: dev build test

dev:
	$(WAILS) dev

build:
	$(WAILS) build -clean -trimpath

test:
	go vet ./... && go test ./...
	cd frontend && npm run build

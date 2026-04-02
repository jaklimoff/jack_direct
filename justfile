# jack.direct blog

# List available commands
default:
    @just --list

# Start development server (port 1234)
dev:
    npm run dev

# Type-check and build for production
build:
    npm run build

# Preview production build (port 4321)
preview:
    npm run preview

# Run Astro type checker
check:
    npx astro check

# Format code with prettier
format:
    npm run prettier

# Run e2e tests
test:
    npm run test:e2e

# Run e2e tests with UI
test-ui:
    npm run test:e2e:ui

# Run e2e tests in debug mode
test-debug:
    npm run test:e2e:debug

# Create a new blog post (just new "Title" --draft --tags a,b)
new title *FLAGS:
    npm run new-post -- "{{title}}" {{FLAGS}}

# Create a new draft post (just draft "Title" --tags a,b --featured)
draft title *FLAGS:
    npm run new-post -- "{{title}}" --draft {{FLAGS}}

# Clean build output
clean:
    rm -rf dist .astro

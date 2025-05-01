# mech-invoice
Basic invoicing SPA for automotive mechanic.
Built in my spare time to help out a neighbour and learn. This is should be considered
a proof of concept with many issues. Don't use this professionally!

# How to build
```
python ./build.py
```

# How to run the unit tests
## Pull the Playwright docker
```
docker pull mcr.microsoft.com/playwright:v1.50.1-noble
```
## Run the tests
```
cd testing
docker run --rm --net=host  -v $(pwd):/workspace -w /workspace --ipc=host mcr.microsoft.com/playwright:v1.50.1-noble /bin/bash -c "npm install && npx playwright install && npx playwright test"
```

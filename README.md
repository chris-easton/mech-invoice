# mech-invoice
Basic invoicing SPA for automotive mechanic.
Built in my spare time to help out a neighbour and learn. This is should be considered
a proof of concept with many issues. Don't use this professionally!

# How to build
```
python ./build.py
```

# Host the site locally
An easy way to host the site locally for testing is:
```
cd dist/
python -m http.server 8000
```
This won't allow the use of the Google API for sending emails or uploading to
Google drive. All other functionality will be unaffected.

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

# Google API
To allow this application to send emails or upload to Google drive a Google
cloud project needs to be set up and a client ID needs to be created. The
details of doing this can be found elsewhere.

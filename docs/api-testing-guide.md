# API testing guide

## What I worked on

My part was testing the owners, pets and visits API. The API is the part behind the website that reads and saves the clinic records.

The main check was: create an owner, add their pet, book a visit, then retrieve the records to check the details saved correctly. I also tested missing details, incorrect phone numbers, invalid dates and IDs that do not exist.

## What the terms mean

| Term | Meaning |
| --- | --- |
| GET | Read a record |
| POST | Add a record |
| 200 | The request worked |
| 201 | A record was created |
| 400 | The request contains invalid details |
| 404 | The record was not found |
| 500 | Something went wrong on the server |
| Schema check | Check the returned fields and data types against the API documentation |
| Quality gate | Run the tests and stop the pipeline if a check fails |

## What each file does

| File | Purpose |
| --- | --- |
| `tests/api/fixtures.json` | Fictional names, pet details and other test data |
| `tests/api/run.mjs` | Sends requests, checks the answers and writes the results |
| `tests/api/gate.sh` | Starts a fresh API, runs the checks and stops it afterwards |
| `.github/workflows/api-quality-gate.yml` | Runs these checks in GitHub Actions |

The script uses the IDs returned by the API. It does not assume a particular owner or pet already exists.

## How to run it

With Java 25 and Node 24 installed, open Terminal in the project folder and run:

```bash
bash tests/api/gate.sh
```

This starts a separate API on port 19966 with fresh test data. It leaves the API used by Swagger on port 9966 alone.

If the API is already running and you just want to run the checks:

```bash
node tests/api/run.mjs
```

Results are saved in `tests/api/reports`. The script creates fictional records; running it against an existing API leaves those records there. The full gate uses a temporary database instead.

## What happened

The main journey worked. The automated run had 50 checks pass and 32 fail. Several failures came from the same issue, so that does not mean 32 different bugs. See [the results](api-automated-results.md) for the breakdown and [the test plan](api-test-plan.md) for the manual checks.

Some failures were about what the API did. Others were about its answers not matching the documentation. Both are useful findings.

## A short explanation for the team

“I tested creating owners, adding pets and booking visits. I checked the saved details and tried invalid requests as well. I then added automated checks and ran them in GitHub Actions. The main journey worked, but the tests found some issues with owner links, invalid dates and the API documentation.”

The next step is for a teammate to review the branch and help agree which findings need fixing.

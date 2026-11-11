# API testing: results and handover

## What this work checks

The API saves clinic records behind the website. The main journey creates a fictional owner, adds their pet, books a visit and retrieves the records to check that the details and links were saved correctly. Negative tests check that invalid requests are rejected. Contract checks compare response status, content type and JSON structure against the live OpenAPI specification.

## Files and commands

| File | Purpose |
| --- | --- |
| `tests/api/fixtures.json` | Fictional input data, separate from test logic |
| `tests/api/run.mjs` | Sequential API requests, behaviour assertions, OpenAPI response checks and report generation |
| `tests/api/gate.sh` | Build and start a fresh API on port 19966, wait for health, run checks and stop that process |
| `.github/workflows/api-quality-gate.yml` | Run the API gate on branch changes and pull requests; upload reports |

From the repository root, with Java 25 and Node 24 installed:

```bash
bash tests/api/gate.sh
```

To test an already running local API without resetting it:

```bash
node tests/api/run.mjs
```

The runner creates its own owners and captures their returned IDs. It never assumes owner 11 or 12 exists. The full gate starts a separate process with fresh seeded in-memory data, so it does not reset the service being used manually in Swagger. There are no automatic test retries. Readiness polling is only used while starting the API.

Reports are written to `tests/api/reports/results.json`, `summary.md` and `openapi.json`. Build and startup logs are preserved by the full gate. Any failed behaviour or contract assertion returns exit code 1. The gate also checks that a deliberate failure returns nonzero. Review the first error before classifying a failure as product, contract, test, environment or data.

## Manual Swagger results

Run date: 11 November 2026, approximately 11:38–11:41 London time. Target: `http://localhost:9966/petclinic`. These 34 requests were executed through Swagger UI in Safari. They are distinct from the automated gate results.

Created owner **12**, pet **14**, valid visit **5**. A wrong-owner request unexpectedly created visit **7**. These IDs apply only to this local run.

| ID | Request/check | HTTP status | Observation |
| --- | --- | --- | --- |
| API-01 | List owners | 200 | Expected behaviour observed |
| API-02 | Search Franklin | 200 | Expected behaviour observed |
| API-03 | Search NoSuchApiOwner | 404 | Undocumented response; DEF-03 |
| API-04 | Create owner | 201 | Expected behaviour observed |
| API-05 | Owner missing firstName | 400 | Expected behaviour observed |
| API-06 | Owner missing lastName | 400 | Expected behaviour observed |
| API-07 | Owner missing address | 400 | Expected behaviour observed |
| API-08 | Owner missing city | 400 | Expected behaviour observed |
| API-09 | Owner missing telephone | 400 | Expected behaviour observed |
| API-10 | Invalid telephone 123456789 | 400 | Expected behaviour observed |
| API-11 | Invalid telephone 12345678901 | 400 | Expected behaviour observed |
| API-12 | Invalid telephone abcdefghij | 400 | Expected behaviour observed |
| API-13 | List pet types | 200 | Expected behaviour observed |
| API-14 | Create pet | 201 | Expected behaviour observed |
| API-15 | Pet missing name | 400 | Expected behaviour observed |
| API-16 | Pet missing birthDate | 400 | Expected behaviour observed |
| API-17 | Pet missing type | 400 | Expected behaviour observed |
| API-18 | Pet blank name | 400 | Expected behaviour observed |
| API-19 | Pet invalid date | 500 | Unexpected server error; DEF-02 |
| API-20 | Pet unknown type | 404 | Resource rejected/not found; inspect error contract |
| API-21 | Add pet to missing owner | 404 | Resource rejected/not found; inspect error contract |
| API-22 | Create visit | 201 | Expected behaviour observed |
| API-23 | Visit missing date | 400 | Expected behaviour observed |
| API-24 | Visit missing description | 400 | Expected behaviour observed |
| API-25 | Visit blank description | 400 | Expected behaviour observed |
| API-26 | Visit invalid date | 500 | Unexpected server error; DEF-02 |
| API-27 | Visit missing pet | 404 | Resource rejected/not found; inspect error contract |
| API-28 | Visit wrong owner | 201 | Unexpected creation; DEF-01 |
| API-29 | GET /api/owners/{ownerId} ID 12 | 200 | Expected behaviour observed |
| API-30 | GET /api/owners/{ownerId} ID 2147483647 | 404 | Resource rejected/not found; inspect error contract |
| API-31 | GET /api/pets/{petId} ID 14 | 200 | Expected behaviour observed |
| API-32 | GET /api/pets/{petId} ID 2147483647 | 404 | Resource rejected/not found; inspect error contract |
| API-33 | GET /api/visits/{visitId} ID 5 | 200 | Expected behaviour observed |
| API-34 | GET /api/visits/{visitId} ID 2147483647 | 404 | Resource rejected/not found; inspect error contract |

The successful owner retrieval included pet 14 and visit 5. Pet retrieval confirmed ownerId 12 and both visits 5 and 7. Visit 5 retrieval matched the submitted date and description.

## Defects and contract findings

### DEF-01: a visit can be created using the wrong owner

- Classification: reproduced product behaviour inconsistent with the documented owner/pet relationship.
- Provisional severity: High, pending team triage.
- Steps: create an owner and pet; note pet.ownerId; POST a valid visit to `/api/owners/{differentOwnerId}/pets/{petId}/visits`. In the manual run, pet 14 belonged to owner 12, but owner 1 was used in the URL.
- Expected: 404, as documented by Swagger: pet not found for this owner; no visit created.
- Actual: 201; visit 7 was created for pet 14. GET `/api/pets/14` confirmed ownerId 12 and visit 7.
- Status: reproduced locally; owner assignment and final severity require team triage.

### DEF-02: malformed dates produce server errors

- Classification: product error handling; expected 400 is a proposed validation expectation to confirm with the product owner.
- Provisional severity: Medium.
- Steps: submit an otherwise valid pet with birthDate `not-a-date`; repeat for a visit with date `not-a-date`.
- Expected: controlled client validation response, proposed 400.
- Actual: 500 with title `HttpMessageNotReadableException` on both endpoints.
- Status: reproduced locally on both endpoints; automated checks keep the proposed 400 expectation visible.

### DEF-03: no-match surname search returns an undocumented status

- Classification: OpenAPI contract mismatch; product behaviour needs clarification.
- Provisional severity: Low.
- Steps: GET `/api/owners?lastName=NoSuchApiOwner`.
- Actual: 404 with empty body; Swagger labels it Undocumented. The operation documents 200, 304 and 500.
- Expected: a documented response. Ask the product owner whether no matches should be 200 with an empty list or a documented 404.
- Status: reproduced locally. The behaviour check records the observed 404, while the contract check fails because that status is undocumented.

### DEF-04: error media type differs from the contract

- Classification: OpenAPI contract mismatch.
- Provisional severity: Low.
- Steps: POST an owner missing firstName, or another required field.
- Expected: the error media type declared by OpenAPI (`application/json` in the observed contract).
- Actual: `application/problem+json`. The request is correctly rejected with 400, but the media type is not documented.
- Status: reproduced locally; the schema itself may still be correct. Do not describe this as accepting invalid data.

### DEF-05: missing records have an empty error body

- Classification: OpenAPI contract mismatch.
- Provisional severity: Low.
- Steps: GET `/api/owners/2147483647`, `/api/pets/2147483647` or `/api/visits/2147483647`. Also observed when adding a pet to a nonexistent owner.
- Expected: the documented 404 JSON error representation.
- Actual: 404 with content-length 0 and no content type.
- Status: reproduced locally; compare against the saved live OpenAPI snapshot in automated reports.

## Scope and limits

The automated runner covers 40 API scenarios with separate behaviour and contract results, plus contract loading and validator self-checks. Schema validation supports the keywords currently used in these Pet Clinic responses: local references, required fields, types, arrays, nested objects, allOf, enum, length, numeric bounds, patterns and the date/date-time/URI/integer formats. Unsupported keywords or formats fail explicitly. This is a focused validator, not a general-purpose implementation of every JSON Schema keyword.

Deletion and update endpoints, authentication roles, load testing, UI, accessibility and ZAP are outside this API core gate. Coordinate role tests with the security owner. The runner leaves generated records in an existing manually started service; the full gate discards its isolated in-memory database when its process stops.

Outstanding product-owner questions: future pet birth dates, past visit dates, duplicate owners and desired no-match search behaviour. No invented business rules are enforced for the first three.

## How to explain it

“I checked the complete owner, pet and visit journey, then tried invalid inputs and missing records. I checked both the response codes and the saved data links. I added repeatable checks against the API documentation and a gate that reports failures. The main journey worked, but I found a wrong-owner visit issue, server errors for malformed dates and differences between the API and its documentation.”

A test failure is useful evidence: it means the quality gate caught a problem. It does not mean the tests should be weakened to get a green result. The branch still needs human review and the team must agree defect ownership and severity before merging.

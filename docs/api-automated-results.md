# API test results

Date: 11 November 2026

Branch: `api-testing`

## Summary

The API built and started successfully in GitHub Actions. The tests ran against fresh seeded data. The main owner, pet and visit journey worked.

| Checks | Passed | Failed | Total |
| --- | --- | --- | --- |
| What the API does: status codes and saved details | 37 | 3 | 40 |
| Whether responses match the API documentation | 11 | 29 | 40 |
| Loading the documentation and checking the test helper | 2 | 0 | 2 |
| Total | 50 | 32 | 82 |

There are 40 API scenarios. Each has a behaviour check and a documentation check. The 32 failed checks come from the five findings below, not 32 different bugs.

## Issues found

### 1. A visit can be added using the wrong owner

Create an owner and pet, then book a visit using a different owner ID with that pet ID. In the manual test, pet 14 belonged to owner 12, but the request used owner 1.

Expected: 404 and no visit created, as described in Swagger. Actual: 201 and visit 7 was saved. Retrieving pet 14 confirmed the wrong-owner request had added the visit. Proposed severity: High; the team needs to confirm it.

### 2. Invalid dates cause server errors

Send `not-a-date` as a pet birthDate or visit date, with the other details valid. Both returned 500 with `HttpMessageNotReadableException`.

The tests expect a validation response of 400. Confirm that expectation with the product owner. Proposed severity: Medium.

### 3. A search with no matches returns an undocumented 404

GET `/api/owners?lastName=NoSuchApiOwner` returned 404 with an empty body. That status is not listed for this request in Swagger.

Ask whether no matches should return an empty list with 200, or a documented 404. The behaviour test records the observed 404; the documentation check fails. Proposed severity: Low.

### 4. Error responses use a different format from the documentation

Send an owner request without firstName. The API correctly rejects it with 400, but returns content type `application/problem+json`. Swagger lists `application/json`. This also affects other invalid requests.

The error format and documentation need to agree. Proposed severity: Low.

### 5. Missing records return an empty error response

GET an owner, pet or visit with ID `2147483647`. Each returned 404 with an empty body, although Swagger describes a JSON error body. The same happened when adding a pet to a missing owner.

Agree whether the API should return the JSON error or the documentation should describe an empty response. Proposed severity: Low.

## Evidence

- [GitHub Actions run](https://github.com/spartaglobal/petclinic-2026-team-remote/actions/runs/43014729529)
- [Detailed logs](https://github.com/spartaglobal/petclinic-2026-team-remote/actions/runs/43014729529/job/130502828036)
- [Download reports](https://github.com/spartaglobal/petclinic-2026-team-remote/actions/runs/43014729529/artifacts/13851852393), available while GitHub retains the artifact
- Tested commit: `5f8dff3595aa5dd1f72098b6616b7b3ee3c6122b`

The reports include the individual results, API documentation snapshot, build/startup logs and a deliberate failure check. The job returned exit code 1 because checks failed. The application was not changed to make tests pass.

## Next steps

Review the branch with a teammate, agree the findings with the product owner, and give the pipeline person the command `bash tests/api/gate.sh`. The branch has not been merged. See [the guide](api-testing-guide.md) for how the files work.

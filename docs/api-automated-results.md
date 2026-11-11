# Automated API results

## Verified clean run

- Date: 11 November 2026.
- Branch: `api-testing`.
- Tested commit: `5f8dff3595aa5dd1f72098b6616b7b3ee3c6122b`.
- [GitHub Actions run](https://github.com/spartaglobal/petclinic-2026-team-remote/actions/runs/43014729529).
- [Detailed job logs](https://github.com/spartaglobal/petclinic-2026-team-remote/actions/runs/43014729529/job/130502828036).
- [Evidence artifact](https://github.com/spartaglobal/petclinic-2026-team-remote/actions/runs/43014729529/artifacts/13851852393): results JSON, Markdown summary, live OpenAPI snapshot, build log, startup log and intentional gate-failure proof. Artifact availability follows the repository retention policy.

The application built and started successfully in a fresh GitHub runner. Tests ran against a separate API process on port 19966 with fresh seeded data. The job ended with exit code 1 because assertions failed, and the evidence artifact was uploaded successfully. No application changes were made to make tests pass.

| Check group | Passed | Failed | Total |
| --- | --- | --- | --- |
| Behaviour: response codes and saved data | 37 | 3 | 40 |
| OpenAPI: response contract | 11 | 29 | 40 |
| Contract loading and validator self-check | 2 | 0 | 2 |
| Total assertions | 50 | 32 | 82 |

These are assertion counts, not unique defect counts. The 32 failures map to the five finding groups documented in [the handover guide](api-testing-guide.md).

## What passed

- Create owner, pet and visit, then retrieve all three with matching saved details.
- Owner/pet/visit links are present in the successful journey.
- Search finds the created owner.
- Missing and blank required owner fields and invalid telephone numbers are rejected.
- Missing pet and visit fields are rejected.
- Nonexistent record IDs return 404.
- Successful responses match the supported keywords in the live OpenAPI schemas.
- Validator mutation checks reject missing fields, wrong types, bad patterns and invalid dates.
- Deliberately failing an assertion returns a nonzero exit code, and real failures stop the quality gate.

## What failed

| Finding | Evidence | Next decision |
| --- | --- | --- |
| DEF-01: wrong-owner visit | Expected 404; got 201 | Team to triage reproduced relationship bug |
| DEF-02: malformed pet and visit dates | Proposed validation status 400; got 500 on both | Confirm expected validation response with product owner; triage error handling |
| DEF-03: no-match search | 404 is not documented for the operation | Agree desired behaviour and align the contract |
| DEF-04: error media types | application/problem+json returned where application/json is declared | Align documentation with intended error format |
| DEF-05: missing-record error body | Empty response where a JSON error is declared | Agree whether to return JSON or document an empty response |

The no-match behaviour check records the observed 404; the separate contract check fails. It is not a decision that 404 is the desired product behaviour. Likewise, a 400 behaviour pass can coexist with a contract failure when the error media type differs from its documentation.

## Handover

Run `bash tests/api/gate.sh` from the repository root with Java 25 and Node 24. See [the guide](api-testing-guide.md) for the test files, manual results, reproduction steps and scope. The pipeline owner can call the same command inside the combined team pipeline. This separate API job is not the UI, accessibility or ZAP gate.

Remaining work is team review, defect triage and product-owner clarification. Authentication-role tests belong with the security owner. Update/delete endpoints and performance testing are outside this core API gate. The branch has not been merged into main.

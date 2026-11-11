# API Test Plan and Manual Results

## Scope

Check owners, pets and visits through the local Pet Clinic API. Automate the core journey, validate responses against OpenAPI, and provide an API quality gate.

- Tester: Syed Hamdani
- Date: 11 November 2026
- Environment: local API at `http://localhost:9966/petclinic/api`
- Method so far: manual requests through Swagger UI
- Data: fictional test records only

## Checks completed

| ID | Check | Expected result | Observed result | Status |
| --- | --- | --- | --- | --- |
| API-01 | GET `/owners` | 200 and owner records | 200; owner records returned | Passed |
| API-02 | POST `/owners` with valid fictional details | 201 and a new owner ID | 201; Test ApiCheck created with ID 11 | Passed |
| API-03 | GET `/owners/11` | 200 and details matching the created owner | 200; all five submitted fields matched; pets was an empty array | Passed |
| API-04 | POST `/owners` with an 11-digit telephone | Reject input that does not satisfy the documented telephone constraint | 400; validation message required exactly 10 digits | Rejection observed; confirm constraint against OpenAPI |

The 11-digit telephone was initially intended as valid test data. The API rejected it, and it was corrected to a fictional 10-digit value before successful creation. This was a test-data correction, not a confirmed product defect.

## Successful owner request

```json
{
  "firstName": "Test",
  "lastName": "ApiCheck",
  "address": "12 Example Road",
  "city": "Leeds",
  "telephone": "0123456789"
}
```

Owner ID 11 is evidence from this run only. Capture returned IDs in automated tests rather than hardcoding them. Restarting the default seeded API resets these records.

## Next checks — not yet executed

- [ ] Confirm required fields, validation constraints and status codes in OpenAPI and the team acceptance criteria. Record product-owner answers for unclear business rules.
- [ ] Add a pet to the test owner using a valid pet type. Retrieve it and verify the owner relationship.
- [ ] Book a visit for that pet. Retrieve it and verify the pet relationship.
- [ ] Test missing required fields, invalid values and nonexistent owner, pet and visit IDs.
- [ ] Automate the owner → pet → visit journey with test data separate from test logic.
- [ ] Validate owner, pet and visit responses against the OpenAPI specification.
- [ ] Connect the API test command to the team pipeline; verify a failed assertion makes the gate fail.
- [ ] Run from a fresh service reset without manual data fixes.

## Evidence and review

The results above are a written summary of observed Swagger responses; no automated suite or schema validation has been completed yet. Confirm failures as product, test, environment or data issues before logging defects.

AI assisted the Swagger requests and drafted this document. Human review of this document and any generated test code is pending; record that review in the team agent log before merging.

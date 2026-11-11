# API test plan

Tester: Syed Hamdani

Date: 11 November 2026

Branch: `api-testing`

## Aim

Check that owners, pets and visits can be created and retrieved correctly, and that invalid requests are handled properly. Only fictional data is used.

## Work completed

- [x] Explore the API in Swagger.
- [x] Create an owner, add a pet and book a visit.
- [x] Retrieve the records and check the details and links.
- [x] Try missing fields, invalid phone numbers and dates, and missing records.
- [x] Add automated checks with test data in a separate file.
- [x] Check responses against the live OpenAPI documentation.
- [x] Run the API checks in GitHub Actions with fresh seeded data.
- [x] Check that a failed test makes the API gate fail.
- [x] Save the results and record the issues found.

The API gate is available for the pipeline owner to include in the team’s combined test command. Connecting it to the other team checks still needs coordination.

## Manual checks in Swagger

These 34 requests were run in Safari at about 11:38–11:41. The API was running at `http://localhost:9966/petclinic`.

Owner 12, pet 14 and visit 5 were created for the main journey. A request with the wrong owner unexpectedly created visit 7. These IDs are just for this run; the automated tests capture new IDs each time.

| ID | Check | HTTP status | Note |
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

The saved owner included pet 14 and visit 5. Retrieving pet 14 confirmed that it belonged to owner 12 and included visits 5 and 7. Retrieving visit 5 returned the submitted date and description.

Earlier setup checks also created Test ApiCheck as owner 11 and retrieved it successfully. An 11-digit phone number was rejected; the live API documentation confirms that this demo requires exactly 10 digits.

## Still to agree

- [ ] Review the test code with a teammate.
- [ ] Agree the severity and owner of each finding.
- [ ] Ask the product owner about no-match searches, past visits, future pet birth dates and duplicate owners.
- [ ] Coordinate authentication checks with the security person.
- [ ] Include this API gate in the combined team pipeline.

Update/delete endpoints, load testing and the other team roles are outside these core API checks. The schema checker covers the rules used in the current responses; it fails if it meets a rule it does not support. Tests do not automatically retry.

See [the results](api-automated-results.md) and [the simple guide](api-testing-guide.md).

## Review record

AI assisted the Swagger requests and drafted this document. Human review of this document and any generated test code is pending; record that review in the team agent log before merging.

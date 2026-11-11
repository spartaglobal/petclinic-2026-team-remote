# API screenshot evidence

Tester: Syed Hamdani  
Date: 11 November 2026  
Tool: Swagger UI in Safari  
Environment: `http://localhost:9966/petclinic`

This selection supports the [API test plan](api-test-plan.md). Screenshots show observed responses; they do not represent a new automated test run or complete coverage of all 34 manual checks. Only fictional test data was used.

| Test | Scenario | Observed status | Evidence |
| --- | --- | --- | --- |
| API-01 | List owners | 200 | [Screenshot](API-01-List-Owners.png) |
| API-03 | Search for NoSuchApiOwner | 404 | [Screenshot](API-03-Search-NoMatch.png) |
| API-04 | Create an owner with valid details | 201 | [Screenshot](API-04-Create-Owner.png) |
| API-05 | Create owner without firstName | 400 | [Screenshot](API-05-Owner-Missing-firstName.png) |
| API-12 | Telephone contains letters | 400 | [Screenshot](API-12-Owner-Phone-Letters.png) |
| API-13 | List pet types | 200 | [Screenshot](API-13-List-PetTypes.png) |
| API-14 | Create a pet with valid details | 201 | [Screenshot](API-14-Create-Pet.png) |
| API-15 | Create pet without name | 400 | [Screenshot](API-15-Pet-Missing-name.png) |
| API-18 | Create pet with empty name | 400 | [Screenshot](API-18-Pet-Blank-name.png) |

## Findings and interpretation

Valid requests returned the expected success statuses. Missing firstName, missing pet name, empty pet name and a telephone containing letters were rejected with 400 responses and field validation details.

The no-match owner search returned 404, labelled Undocumented in Swagger. This supports the existing DEF-03 documentation finding; it should not be reported as a passing contract check. See [the existing results and findings](api-automated-results.md) for the wider test outcomes.

## Run-specific details

These screenshots were captured around 13:07–13:12 and supplement the earlier manual run recorded in the test plan. The owner creation screenshot shows owner 12; the pet creation screenshot shows pet 14 linked to owner 11. These are separate requests and must not be presented as one linked owner-to-pet journey. Record IDs may differ between runs.

## Handover

The selected screenshot evidence is recorded on `api-testing`. Teammate review, finding ownership and combined pipeline coordination remain as listed in the test plan.

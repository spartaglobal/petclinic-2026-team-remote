---
name: write-test
description: Write a single test for the Petclinic app that follows the project's existing conventions. Use when the user asks to add or write a test for a class, component, endpoint or behaviour.
argument-hint: "<what to test>"
# TODO: decide which tools this skill may use without asking, e.g.
# allowed-tools: Read, Grep, Glob, Edit, Write, Bash(./mvnw *)
---

# Write a test

Write **one** focused test for: `$ARGUMENTS`

If that's empty or too vague to test, ask the user what behaviour they want
covered before writing anything.

## 1. Find the right kind of test

Work out which layer the code belongs to, then open the example test for that
layer and copy its setup. Don't invent a new style.

| Layer                        | Example to copy                                                                                                             | Run with                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Backend controller (MockMvc) | `spring-petclinic-rest/src/test/java/org/springframework/samples/petclinic/rest/controller/OwnerRestControllerV1Tests.java` | `./mvnw test -Dtest=<ClassName>` |
| Backend service / DB         | TODO                                                                                                                        | TODO                             |
| Backend validation           | TODO                                                                                                                        | TODO                             |
| Angular component            | TODO                                                                                                                        | TODO                             |
| Angular service              | TODO                                                                                                                        | TODO                             |
| Playwright E2E               | TODO                                                                                                                        | TODO                             |

<!-- TODO: add rows for the API (Postman) and performance (JMeter) tests if
     this skill should cover them too. -->

## 2. Write the test

- Put it next to the closest existing test for the same code, or in a new file
  named like the others in that folder.
- Name it after the behaviour, not the method. For example,
  `shouldReturnNotFoundWhenOwnerMissing`, not `testGetOwner2`.
- Assert the outcome a user or caller would see: status code, response body,
  rendered text, saved data.

<!-- TODO: add the project-specific conventions that matter here, e.g.
     - which security role to use with @WithMockUser
     - which test helpers in spring-petclinic-angular/src/app/testing to reuse
     - how to set up test data -->

## 3. Run it

Run only the new test using the command from the table above.

- If it fails, decide whether the test or the code is wrong. Fix the test if
  the test is wrong. If the code is wrong, **don't change it**: tell the user
  what you found.
- TODO: should the skill also check the test fails when the behaviour breaks
  (e.g. by temporarily changing an expected value)?

## 4. Report back

TODO: decide what the summary should include.

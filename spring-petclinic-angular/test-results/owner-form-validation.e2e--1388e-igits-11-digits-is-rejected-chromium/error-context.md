# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: owner-form-validation.e2e-spec.ts >> Telephone (must be exactly 10 digits) >> 11 digits is rejected
- Location: e2e/owner-form-validation.e2e-spec.ts:62:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Phone number must be exactly 10 digits')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Phone number must be exactly 10 digits') with timeout 5000ms
  - waiting for getByText('Phone number must be exactly 10 digits')

```

```yaml
- navigation "Main navigation":
  - link "Spring Petclinic home":
    - /url: /petclinic/welcome
  - list:
    - listitem:
      - link "Home":
        - /url: /petclinic/welcome
    - listitem:
      - button "Owners"
    - listitem:
      - button "Veterinarians"
    - listitem:
      - link "Pet Types":
        - /url: /petclinic/pettypes
    - listitem:
      - link "Specialties":
        - /url: /petclinic/specialties
- main:
  - heading "New Owner" [level=2]
  - text: First Name
  - textbox "First Name": Jane
  - text: Last Name
  - textbox "Last Name": Smith
  - text: Address
  - textbox "Address": 1 High Street
  - text: City
  - textbox "City": Birmingham
  - text: Telephone
  - textbox "Telephone": "0121555123"
  - button "Back"
  - button "Add Owner"
- contentinfo:
  - img "Angular"
  - img "Sponsored by Pivotal"
```

# Test source

```ts
  1   | import { expect, Page, test } from "@playwright/test";
  2   | import { API, mockBackend } from "./support/mock-backend";
  3   | 
  4   | const validOwner = {
  5   |   firstName: "Jane",
  6   |   lastName: "Smith",
  7   |   address: "1 High Street",
  8   |   city: "Birmingham",
  9   |   telephone: "0121555123",
  10  | };
  11  | 
  12  | async function fillOwnerForm(
  13  |   page: Page,
  14  |   values: Partial<typeof validOwner> = {},
  15  | ) {
  16  |   const owner = { ...validOwner, ...values };
  17  |   await page.getByLabel("First Name").fill(owner.firstName);
  18  |   await page.getByLabel("Last Name").fill(owner.lastName);
  19  |   await page.getByLabel("Address").fill(owner.address);
  20  |   await page.getByLabel("City").fill(owner.city);
  21  |   await page.getByLabel("Telephone").fill(owner.telephone);
  22  | }
  23  | 
  24  | const submitButton = (page: Page) =>
  25  |   page.getByRole("button", { name: "Add Owner" });
  26  | 
  27  | test.beforeEach(async ({ page }) => {
  28  |   await mockBackend(page);
  29  |   await page.goto("/owners/add");
  30  |   await expect(page.getByRole("heading", { name: "New Owner" })).toBeVisible();
  31  | });
  32  | 
  33  | test("Add Owner is disabled while the form is empty", async ({ page }) => {
  34  |   await expect(submitButton(page)).toBeDisabled();
  35  | });
  36  | 
  37  | test("a valid owner is sent to the API and the user returns to the list", async ({
  38  |   page,
  39  | }) => {
  40  |   await fillOwnerForm(page);
  41  |   await expect(submitButton(page)).toBeEnabled();
  42  | 
  43  |   const postRequest = page.waitForRequest(
  44  |     (req) => req.method() === "POST" && req.url() === `${API}/owners`,
  45  |   );
  46  |   await submitButton(page).click();
  47  | 
  48  |   const body = (await postRequest).postDataJSON();
  49  |   expect(body).toMatchObject(validOwner);
  50  |   await expect(page).toHaveURL(/\/owners$/);
  51  | });
  52  | 
  53  | test.describe("Telephone (must be exactly 10 digits)", () => {
  54  |   test("9 digits is rejected", async ({ page }) => {
  55  |     await fillOwnerForm(page, { telephone: "012155512" });
  56  |     await expect(
  57  |       page.getByText("Phone number must be exactly 10 digits"),
  58  |     ).toBeVisible();
  59  |     await expect(submitButton(page)).toBeDisabled();
  60  |   });
  61  | 
  62  |   test("11 digits is rejected", async ({ page }) => {
  63  |     await fillOwnerForm(page, { telephone: "01215551234" });
  64  |     await expect(
  65  |       page.getByText("Phone number must be exactly 10 digits"),
> 66  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  67  |     await expect(submitButton(page)).toBeDisabled();
  68  |   });
  69  | 
  70  |   test("letters are rejected", async ({ page }) => {
  71  |     await fillOwnerForm(page, { telephone: "01215551ab" });
  72  |     await expect(
  73  |       page.getByText("Phone number only accepts digits"),
  74  |     ).toBeVisible();
  75  |     await expect(submitButton(page)).toBeDisabled();
  76  |   });
  77  | 
  78  |   test("exactly 10 digits is accepted", async ({ page }) => {
  79  |     await fillOwnerForm(page, { telephone: "0121555123" });
  80  |     await expect(page.getByLabel("Telephone")).toHaveClass(/is-valid/);
  81  |     await expect(submitButton(page)).toBeEnabled();
  82  |   });
  83  | });
  84  | 
  85  | test.describe("First name (letters only, max 30)", () => {
  86  |   test("30 characters is accepted (boundary)", async ({ page }) => {
  87  |     await fillOwnerForm(page, { firstName: "a".repeat(30) });
  88  |     await expect(page.getByLabel("First Name")).toHaveClass(/is-valid/);
  89  |     await expect(submitButton(page)).toBeEnabled();
  90  |   });
  91  | 
  92  |   test("31 characters is rejected (just past the boundary)", async ({
  93  |     page,
  94  |   }) => {
  95  |     await fillOwnerForm(page, { firstName: "a".repeat(31) });
  96  |     await expect(
  97  |       page.getByText("First name may be at most 30 characters long"),
  98  |     ).toBeVisible();
  99  |     await expect(submitButton(page)).toBeDisabled();
  100 |   });
  101 | 
  102 |   test("digits are rejected", async ({ page }) => {
  103 |     await fillOwnerForm(page, { firstName: "Max2" });
  104 |     await expect(
  105 |       page.getByText("First name must consist of letters only"),
  106 |     ).toBeVisible();
  107 |   });
  108 | 
  109 |   // Documents CURRENT behaviour: real surnames like O'Brien or Smith-Jones are rejected
  110 |   // by the /^[a-zA-Z]*$/ pattern. Worth raising as a defect for triage.
  111 |   test("names with apostrophes or hyphens are currently rejected", async ({
  112 |     page,
  113 |   }) => {
  114 |     await fillOwnerForm(page, { lastName: "O'Brien" });
  115 |     await expect(
  116 |       page.getByText("Last name must consist of letters only"),
  117 |     ).toBeVisible();
  118 |   });
  119 | });
  120 | 
  121 | test("whitespace-only address is treated as invalid", async ({ page }) => {
  122 |   await fillOwnerForm(page, { address: "    " });
  123 |   await expect(page.getByLabel("Address")).toHaveClass(/is-invalid/);
  124 |   await expect(submitButton(page)).toBeDisabled();
  125 | });
  126 | 
  127 | test("a server error is shown to the user instead of failing silently", async ({
  128 |   page,
  129 | }) => {
  130 |   await page.route(`${API}/owners`, async (route) => {
  131 |     if (route.request().method() === "POST") {
  132 |       await route.fulfill({ status: 500, body: "boom" });
  133 |     } else {
  134 |       await route.fallback();
  135 |     }
  136 |   });
  137 | 
  138 |   await fillOwnerForm(page);
  139 |   await submitButton(page).click();
  140 | 
  141 |   await expect(page.locator(".alert-danger")).toContainText("500");
  142 |   await expect(page).toHaveURL(/\/owners\/add$/);
  143 | });
  144 | 
```
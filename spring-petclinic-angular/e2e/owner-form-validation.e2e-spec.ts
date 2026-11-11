import { expect, Page, test } from "@playwright/test";
import { API, mockBackend } from "./support/mock-backend";

const validOwner = {
  firstName: "Jane",
  lastName: "Smith",
  address: "1 High Street",
  city: "Birmingham",
  telephone: "0121555123",
};

async function fillOwnerForm(
  page: Page,
  values: Partial<typeof validOwner> = {},
) {
  const owner = { ...validOwner, ...values };
  await page.getByLabel("First Name").fill(owner.firstName);
  await page.getByLabel("Last Name").fill(owner.lastName);
  await page.getByLabel("Address").fill(owner.address);
  await page.getByLabel("City").fill(owner.city);
  await page.getByLabel("Telephone").fill(owner.telephone);
}

const submitButton = (page: Page) =>
  page.getByRole("button", { name: "Add Owner" });

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
  await page.goto("/owners/add");
  await expect(page.getByRole("heading", { name: "New Owner" })).toBeVisible();
});

test("Add Owner is disabled while the form is empty", async ({ page }) => {
  await expect(submitButton(page)).toBeDisabled();
});

test("a valid owner is sent to the API and the user returns to the list", async ({
  page,
}) => {
  await fillOwnerForm(page);
  await expect(submitButton(page)).toBeEnabled();

  const postRequest = page.waitForRequest(
    (req) => req.method() === "POST" && req.url() === `${API}/owners`,
  );
  await submitButton(page).click();

  const body = (await postRequest).postDataJSON();
  expect(body).toMatchObject(validOwner);
  await expect(page).toHaveURL(/\/owners$/);
});

test.describe("Telephone (must be exactly 10 digits)", () => {
  test("9 digits is rejected", async ({ page }) => {
    await fillOwnerForm(page, { telephone: "012155512" });
    await expect(
      page.getByText("Phone number must be exactly 10 digits"),
    ).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
  });

  test("11 digits cannot be entered – input stops at 10", async ({ page }) => {
    await fillOwnerForm(page, { telephone: "01215551234" });
    const telephone = page.getByLabel("Telephone");
    await expect(telephone).toHaveAttribute("maxlength", "10");
    await expect(telephone).toHaveValue("0121555123");
  });

  test("letters are rejected", async ({ page }) => {
    await fillOwnerForm(page, { telephone: "01215551ab" });
    await expect(
      page.getByText("Phone number only accepts digits"),
    ).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
  });

  test("exactly 10 digits is accepted", async ({ page }) => {
    await fillOwnerForm(page, { telephone: "0121555123" });
    await expect(page.getByLabel("Telephone")).toHaveClass(/is-valid/);
    await expect(submitButton(page)).toBeEnabled();
  });
});

test.describe("First name (letters only, max 30)", () => {
  test("30 characters is accepted (boundary)", async ({ page }) => {
    await fillOwnerForm(page, { firstName: "a".repeat(30) });
    await expect(page.getByLabel("First Name")).toHaveClass(/is-valid/);
    await expect(submitButton(page)).toBeEnabled();
  });

  test("31 characters cannot be entered – input stops at 30", async ({
    page,
  }) => {
    await fillOwnerForm(page, { firstName: "a".repeat(31) });
    const firstName = page.getByLabel("First Name");
    await expect(firstName).toHaveAttribute("maxlength", "30");
    await expect(firstName).toHaveValue("a".repeat(30));
  });

  test("digits are rejected", async ({ page }) => {
    await fillOwnerForm(page, { firstName: "Max2" });
    await expect(
      page.getByText("First name must consist of letters only"),
    ).toBeVisible();
  });

  // Documents CURRENT behaviour: real surnames like O'Brien or Smith-Jones are rejected
  // by the /^[a-zA-Z]*$/ pattern. Worth raising as a defect for triage.
  test("names with apostrophes or hyphens are currently rejected", async ({
    page,
  }) => {
    await fillOwnerForm(page, { lastName: "O'Brien" });
    await expect(
      page.getByText("Last name must consist of letters only"),
    ).toBeVisible();
  });
});

test("whitespace-only address is treated as invalid", async ({ page }) => {
  await fillOwnerForm(page, { address: "    " });
  await expect(page.getByLabel("Address")).toHaveClass(/is-invalid/);
  await expect(submitButton(page)).toBeDisabled();
});

test("a server error is shown to the user instead of failing silently", async ({
  page,
}) => {
  await page.route(`${API}/owners`, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 500, body: "boom" });
    } else {
      await route.fallback();
    }
  });

  await fillOwnerForm(page);
  await submitButton(page).click();

  await expect(page.locator(".alert-danger")).toContainText("500");
  await expect(page).toHaveURL(/\/owners\/add$/);
});

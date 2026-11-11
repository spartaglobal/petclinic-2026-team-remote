import { expect, test } from "@playwright/test";
import { API, mockBackend } from "./support/mock-backend";

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

test.describe("Owners list", () => {
  test("shows all owners when the page loads", async ({ page }) => {
    await page.goto("/owners");

    await expect(page.getByRole("heading", { name: "Owners" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "George Franklin" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Betty Davis" })).toBeVisible();
  });

  test("searching by last name sends the right request and filters the list", async ({
    page,
  }) => {
    await page.goto("/owners");

    const searchRequest = page.waitForRequest(
      (req) =>
        req.url().startsWith(`${API}/owners`) &&
        new URL(req.url()).searchParams.get("lastName") === "Fra",
    );
    await page.getByLabel("Last name").fill("Fra");
    await page.getByRole("button", { name: "Find Owner" }).click();
    await searchRequest;

    await expect(
      page.getByRole("link", { name: "George Franklin" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Betty Davis" })).toHaveCount(
      0,
    );
  });

  test("shows a helpful message when no owner matches", async ({ page }) => {
    await page.goto("/owners");

    await page.getByLabel("Last name").fill("Nobody");
    await page.getByRole("button", { name: "Find Owner" }).click();

    await expect(
      page.getByText('No owners with LastName starting with "Nobody"'),
    ).toBeVisible();
  });
});

test.describe("Owner details", () => {
  test("clicking an owner opens their details with pets", async ({ page }) => {
    await page.goto("/owners");
    await page.getByRole("link", { name: "George Franklin" }).click();

    await expect(page).toHaveURL(/\/owners\/1$/);
    await expect(
      page.getByRole("heading", { name: "Owner Information" }),
    ).toBeVisible();
    await expect(page.locator(".ownerFullName")).toHaveText("George Franklin");
    await expect(page.getByText("110 W. Liberty St.")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Leo" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "cat" })).toBeVisible();
  });

  test("owner with no pets shows an empty-state message", async ({ page }) => {
    await page.goto("/owners/2");

    await expect(page.locator(".ownerFullName")).toHaveText("Betty Davis");
    await expect(page.getByText("This owner has no pets yet.")).toBeVisible();
  });
});

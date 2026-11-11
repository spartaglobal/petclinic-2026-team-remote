import { expect, test } from "@playwright/test";
import { mockBackend } from "./support/mock-backend";

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

test("Pet Types link in the nav bar opens the pet types page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pet Types" }).click();

  await expect(page).toHaveURL(/\/pettypes$/);
  await expect(page.getByRole("heading", { name: "Pet Types" })).toBeVisible();

  const typeInputs = page.locator("#pettypes input");
  await expect(typeInputs).toHaveCount(2);
  await expect(typeInputs.nth(0)).toHaveValue("cat");
  await expect(typeInputs.nth(1)).toHaveValue("dog");
});

test("Specialties link in the nav bar opens the specialties page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Specialties" }).click();
  await expect(page).toHaveURL(/\/specialties$/);
});

test("vets page lists vets with their specialties", async ({ page }) => {
  await page.goto("/vets");

  await expect(
    page.getByRole("heading", { name: "Veterinarians" }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "James Carter" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Linda Douglas" })).toBeVisible();
  await expect(page.getByText("surgery")).toBeVisible();
  await expect(page.getByText("dentistry")).toBeVisible();
});

test("unknown URL shows the 404 page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Not Found - 404 error" }),
  ).toBeVisible();
});

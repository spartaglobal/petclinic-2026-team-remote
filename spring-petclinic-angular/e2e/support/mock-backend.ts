import { Page } from "@playwright/test";

export const API = "http://localhost:9966/petclinic/api";

export const georgeFranklin = {
  id: 1,
  firstName: "George",
  lastName: "Franklin",
  address: "110 W. Liberty St.",
  city: "Madison",
  telephone: "6085551023",
  pets: [
    {
      id: 1,
      name: "Leo",
      birthDate: "2010-09-07",
      type: { id: 1, name: "cat" },
      visits: [],
    },
  ],
};

export const bettyDavis = {
  id: 2,
  firstName: "Betty",
  lastName: "Davis",
  address: "638 Cardinal Ave.",
  city: "Sun Prairie",
  telephone: "6085551749",
  pets: [],
};

export const owners = [georgeFranklin, bettyDavis];

export const vets = [
  { id: 1, firstName: "James", lastName: "Carter", specialties: [] },
  {
    id: 2,
    firstName: "Linda",
    lastName: "Douglas",
    specialties: [
      { id: 2, name: "surgery" },
      { id: 3, name: "dentistry" },
    ],
  },
];

export const petTypes = [
  { id: 1, name: "cat" },
  { id: 2, name: "dog" },
];
export const specialties = [
  { id: 1, name: "radiology" },
  { id: 2, name: "surgery" },
  { id: 3, name: "dentistry" },
];

/**
 * Fakes the REST API so UI tests run without the backend.
 * Tests can register their own page.route() afterwards to override one call —
 * Playwright runs the most recently registered route first.
 */
export async function mockBackend(page: Page) {
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const resource = url.pathname.replace("/petclinic/api/", "");

    if (request.method() === "POST") {
      await route.fulfill({
        status: 201,
        json: { id: 99, ...request.postDataJSON() },
      });
      return;
    }

    if (resource === "owners") {
      const lastName = url.searchParams.get("lastName");
      const matches = lastName
        ? owners.filter((o) =>
            o.lastName.toLowerCase().startsWith(lastName.toLowerCase()),
          )
        : owners;
      // The real API answers 404 when a last-name search finds nothing
      await route.fulfill(
        matches.length ? { json: matches } : { status: 404, body: "" },
      );
      return;
    }

    const ownerMatch = resource.match(/^owners\/(\d+)$/);
    if (ownerMatch) {
      const owner = owners.find((o) => o.id === Number(ownerMatch[1]));
      await route.fulfill(owner ? { json: owner } : { status: 404, body: "" });
      return;
    }

    if (resource === "vets") return route.fulfill({ json: vets });
    if (resource === "pettypes") return route.fulfill({ json: petTypes });
    if (resource === "specialties") return route.fulfill({ json: specialties });

    await route.fulfill({ json: [] });
  });
}

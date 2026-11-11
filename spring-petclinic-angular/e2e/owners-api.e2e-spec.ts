import { expect, test } from "@playwright/test";

const ROOT = "http://localhost:9966/petclinic";
const API = `${ROOT}/api`;

const randomLetters = (n = 8) =>
  Array.from({ length: n }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join("");

const newOwner = () => ({
  firstName: "Test",
  lastName: "Api" + randomLetters(),
  address: "1 Test Street",
  city: "Testville",
  telephone: "0123456789",
});

const createdOwnerIds: number[] = [];

test.beforeEach(async ({ request }) => {
  const health = await request.get(`${ROOT}/actuator/health`).catch(() => null);
  test.skip(
    !health || !health.ok(),
    "API is not running – start it with `docker compose up`",
  );
});

test.afterEach(async ({ request }) => {
  while (createdOwnerIds.length) {
    await request.delete(`${API}/owners/${createdOwnerIds.pop()}`);
  }
});

test("GET /owners returns a list of owners", async ({ request }) => {
  const res = await request.get(`${API}/owners`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
});

test("POST /owners creates an owner that can then be fetched", async ({
  request,
}) => {
  const owner = newOwner();
  const createRes = await request.post(`${API}/owners`, { data: owner });
  expect(createRes.status()).toBe(201);

  const created = await createRes.json();
  createdOwnerIds.push(created.id);
  expect(created).toMatchObject(owner);

  const getRes = await request.get(`${API}/owners/${created.id}`);
  expect(getRes.status()).toBe(200);
  expect(await getRes.json()).toMatchObject(owner);
});

test("searching by last name finds the newly created owner", async ({
  request,
}) => {
  const owner = newOwner();
  const created = await (
    await request.post(`${API}/owners`, { data: owner })
  ).json();
  createdOwnerIds.push(created.id);

  const res = await request.get(`${API}/owners`, {
    params: { lastName: owner.lastName },
  });
  expect(res.status()).toBe(200);
  const results = await res.json();
  expect(results.map((o: { id: number }) => o.id)).toContain(created.id);
});

test("GET /owners/{id} for a missing owner returns 404", async ({
  request,
}) => {
  const res = await request.get(`${API}/owners/999999`);
  expect(res.status()).toBe(404);
});

test("POST /owners with a blank first name is rejected with 400", async ({
  request,
}) => {
  const res = await request.post(`${API}/owners`, {
    data: { ...newOwner(), firstName: "" },
  });
  expect(res.status()).toBe(400);
});

test("POST /owners with a 9-digit telephone is rejected with 400", async ({
  request,
}) => {
  const res = await request.post(`${API}/owners`, {
    data: { ...newOwner(), telephone: "012345678" },
  });
  expect(res.status()).toBe(400);
});

test("DELETE /owners/{id} removes the owner", async ({ request }) => {
  const created = await (
    await request.post(`${API}/owners`, { data: newOwner() })
  ).json();

  const del = await request.delete(`${API}/owners/${created.id}`);
  expect(del.status()).toBe(204);

  const getAfter = await request.get(`${API}/owners/${created.id}`);
  expect(getAfter.status()).toBe(404);
});

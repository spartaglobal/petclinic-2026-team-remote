import { expect, Page, test } from '@playwright/test';

const owner = {
  id: 1,
  firstName: 'George',
  lastName: 'Franklin',
  address: '110 W. Liberty St.',
  city: 'Madison',
  telephone: '6085551023',
  pets: [
    {
      id: 1,
      name: 'Leo',
      birthDate: '2010-09-07',
      type: { id: 1, name: 'cat' },
      visits: []
    }
  ]
};

const vets = [
  {
    id: 1,
    firstName: 'James',
    lastName: 'Carter',
    specialties: [{ id: 1, name: 'radiology' }]
  }
];

async function mockBackend(page: Page) {
  await page.route('http://localhost:9966/petclinic/api/**', async route => {
    const url = new URL(route.request().url());
    const resource = url.pathname.replace('/petclinic/api/', '');

    if (resource === 'owners' || resource.startsWith('owners?')) {
      await route.fulfill({ json: [owner] });
      return;
    }
    if (resource === 'owners/1') {
      await route.fulfill({ json: owner });
      return;
    }
    if (resource === 'vets') {
      await route.fulfill({ json: vets });
      return;
    }
    if (resource === 'specialties') {
      await route.fulfill({ json: [{ id: 1, name: 'radiology' }] });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

test('displays the Petclinic welcome page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Petclinic' })).toBeVisible();
});

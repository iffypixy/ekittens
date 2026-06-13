import { type Page, expect, test } from "@playwright/test";

const guestAndQueue = async (page: Page, name: string): Promise<void> => {
  await page.goto("/");
  await page.getByPlaceholder("Display name").fill(name);
  await page.getByRole("button", { name: "Play as guest" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Find a match" }).click();
};

const driveUntilOver = async (page: Page): Promise<void> => {
  for (let step = 0; step < 400; step++) {
    if ((await page.getByText(/You win|You exploded/).count()) > 0) return;
    const insert = page.getByRole("button", { name: /Slip the kitten/ });
    const defuse = page.getByRole("button", { name: /Defuse the kitten/ });
    const draw = page.getByRole("button", { name: /Draw a card/ });
    if ((await insert.count()) > 0) await insert.first().click();
    else if ((await defuse.count()) > 0) await defuse.first().click();
    else if ((await draw.count()) > 0) await draw.first().click();
    await page.waitForTimeout(120);
  }
};

test("two guests matchmake into a game and play through to a result", async ({ browser }) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();

  await guestAndQueue(alice, "Alice");
  await guestAndQueue(bob, "Bob");

  await expect(alice).toHaveURL(/\/match\//, { timeout: 20_000 });
  await expect(bob).toHaveURL(/\/match\//, { timeout: 20_000 });

  await Promise.all([driveUntilOver(alice), driveUntilOver(bob)]);

  // Exactly one player wins; the other explodes.
  const aliceOver = (await alice.getByText(/You win|You exploded/).count()) > 0;
  const bobOver = (await bob.getByText(/You win|You exploded/).count()) > 0;
  expect(aliceOver && bobOver).toBe(true);
});

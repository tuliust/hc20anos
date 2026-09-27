import { expect, test } from "@playwright/test";

const personId = "00000000-0000-4000-8000-000000009001";

test.describe("/buscar privacy boundary", () => {
  test("public visitor sees only the public roster and can contribute once", async ({ page }) => {
    let saveCalls = 0;
    await page.route("**/rest/v1/rpc/**", async (route) => {
      const url = new URL(route.request().url());
      const rpc = url.pathname.split("/").at(-1);
      if (rpc === "get_contact_research_directory") {
        await route.fulfill({ json: [{ person_id: personId, full_name: "Pessoa de Teste", class_group: "A", research_status: "pending", can_contribute: true }] });
      } else if (rpc === "can_manage_contact_research") {
        await route.fulfill({ json: false });
      } else if (rpc === "save_contact_research") {
        saveCalls += 1;
        expect(route.request().postDataJSON()).toMatchObject({ p_person_id: personId, p_phone: "+55 84999990000" });
        await route.fulfill({ json: { ok: true, person_id: personId, status: "located", updated_at: "2026-09-27T12:00:00Z" } });
      } else {
        await route.fulfill({ status: 404, json: { message: "unexpected RPC" } });
      }
    });

    await page.goto("/buscar");
    await expect(page.getByRole("heading", { name: "Mutirão de contatos" })).toBeVisible();
    await expect(page.getByText("Pessoa de Teste", { exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Telefone" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Instagram" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "E-mail" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Observação" })).toHaveCount(0);
    await expect(page.getByPlaceholder("Buscar por nome")).toBeVisible();

    await page.getByText("Pessoa de Teste", { exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Observação")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Marcar sem contato" })).toHaveCount(0);
    await page.getByLabel("Telefone").fill("+55 84999990000");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Localizado", { exact: true })).toBeVisible();
    expect(saveCalls).toBe(1);
  });

  test("does not open an existing contact for public overwrite", async ({ page }) => {
    await page.route("**/rest/v1/rpc/**", async (route) => {
      const rpc = new URL(route.request().url()).pathname.split("/").at(-1);
      if (rpc === "get_contact_research_directory") {
        await route.fulfill({ json: [{ person_id: personId, full_name: "Contato Existente", class_group: "A", research_status: "located", can_contribute: false }] });
      } else if (rpc === "can_manage_contact_research") {
        await route.fulfill({ json: false });
      } else {
        await route.fulfill({ status: 403, json: { message: "forbidden" } });
      }
    });
    await page.goto("/buscar");
    await page.getByText("Contato Existente", { exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

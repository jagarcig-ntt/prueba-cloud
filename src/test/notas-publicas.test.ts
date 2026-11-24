import { describe, expect, it } from "vitest";
import migration from "../../drizzle/migrations/0001_create_notas_publicas.sql?raw";

describe("Public notes access", () => {
  it("allows anonymous users to read every row", () => {
    expect(migration).toMatch(/GRANT SELECT ON public\.notas_publicas TO anon, authenticated;/);
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY;/);
    expect(migration).toMatch(/FOR SELECT TO anon, authenticated\s+USING \(true\);/);
  });
});
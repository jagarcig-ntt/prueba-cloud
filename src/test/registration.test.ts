import { describe, expect, it } from "vitest";
import { registrationSchema } from "@/lib/registration";

const valid = {
  name: "Persona de prueba",
  email: "registro@example.test",
  phone: "+34 600 000 000",
  dni: "12345678Z",
  birthDate: new Date(2000, 0, 1),
  password: "test-password",
};

describe("Registration validation", () => {
  it.each(["name", "email", "phone", "dni", "birthDate"])("requires %s", (field) => {
    const candidate: Record<string, unknown> = { ...valid };
    delete candidate[field];
    expect(registrationSchema.safeParse(candidate).success).toBe(false);
  });
  it("accepts complete registration details", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });
});
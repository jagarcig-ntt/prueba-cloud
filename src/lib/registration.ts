import { z } from "zod";

// Extra personal details are validated locally, not persisted or logged.
export const registrationSchema = z.object({
  name: z.string().trim().min(1, "Introduce tu nombre.").max(100, "El nombre es demasiado largo."),
  email: z.string().trim().email("Introduce un email válido.").max(254),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Introduce un teléfono válido."),
  dni: z.string().trim().regex(/^\d{8}[A-Za-z]$/, "El DNI debe tener 8 números y una letra."),
  birthDate: z.date({ message: "Selecciona tu fecha de nacimiento." }).refine(
    (date) => date <= new Date(), "La fecha de nacimiento no puede ser futura.",
  ),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});
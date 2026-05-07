import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
//
// techStack form'da virgüllü string olarak geliyor — DB'ye string[] yazıyoruz.

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),

  description: z.string().trim().optional(),

  githubUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.url("Please enter a valid GitHub URL").optional())
    .optional(),

  liveUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.url("Please enter a valid URL").optional())
    .optional(),

  // RHF + zodResolver client tarafında transform'u zaten çalıştırıyor;
  // sonuçta server'a array geliyor. Bu yüzden union ile her iki şekli de
  // kabul ediyoruz — ister string (server-direct), ister string[] (client'tan).
  techStackInput: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
      return (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
});

export type ProjectFormValues = z.input<typeof projectFormSchema>;
export type ProjectFormOutput = z.output<typeof projectFormSchema>;

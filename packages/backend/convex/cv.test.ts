/// <reference types="vite/client" />

import { describe, expect, it } from "@effect/vitest";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { intakeCv } from "@repo/backend/convex/cv";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";
import { Effect } from "effect";

const modules = import.meta.glob("./**/*.ts");
const fileId = "test-file" as Id<"_storage">;
const userId = "test-user" as Id<"users">;
type IntakePorts = Parameters<typeof intakeCv>[0];
type IntakeInput = Parameters<typeof intakeCv>[1];
type Attachment = Parameters<IntakePorts["attach"]>[0];

/** Builds an isolated CV storage boundary with overridable failures. */
function intakePorts(overrides: Partial<IntakePorts> = {}): IntakePorts {
  return {
    attach: () => Promise.resolve(),
    discard: () => Promise.resolve(),
    extractText: () => Promise.resolve("Candidate CV"),
    getFile: () =>
      Promise.resolve(new Blob(["pdf"], { type: "application/pdf" })),
    ...overrides,
  };
}

/** Builds one valid CV intake command for boundary tests. */
function intakeInput(overrides: Partial<IntakeInput> = {}): IntakeInput {
  return { fileId, fileName: "candidate.pdf", userId, ...overrides };
}

/** Generates a deterministic text PDF with the requested number of pages. */
function pdfBlob(pageCount: number) {
  const fontId = pageCount + 3;
  const contentId = fontId + 1;
  const pageIds = Array.from({ length: pageCount }, (_, index) => index + 3);
  const stream = "BT /F1 12 Tf 72 720 Td (Candidate CV) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    ...pageIds.map(
      () =>
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    ),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let source = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = source.length;
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = source.length;
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  source += offsets
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([source], { type: "application/pdf" });
}

describe("CV intake", () => {
  it.effect("attaches normalized text from the validated PDF", () =>
    Effect.gen(function* () {
      const attached: Attachment[] = [];
      const ports = intakePorts({
        attach: (input) => {
          attached.push(input);
          return Promise.resolve();
        },
      });
      const characters = yield* intakeCv(ports, intakeInput());

      expect(characters).toBe(12);
      expect(attached).toEqual([
        {
          fileId,
          fileName: "candidate.pdf",
          text: "Candidate CV",
          userId,
        },
      ]);
    })
  );

  it.effect("rejects invalid file boundaries and discards every upload", () =>
    Effect.gen(function* () {
      let discarded = 0;
      /** Records deterministic cleanup without touching Convex storage. */
      const discard = () => {
        discarded += 1;
        return Promise.resolve();
      };
      const cases = [
        intakePorts({ discard, getFile: () => Promise.resolve(null) }),
        intakePorts({
          discard,
          getFile: () =>
            Promise.resolve(new Blob(["text"], { type: "text/plain" })),
        }),
        intakePorts({
          discard,
          getFile: () =>
            Promise.resolve(
              new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
                type: "application/pdf",
              })
            ),
        }),
        intakePorts({ discard }),
      ];
      const inputs = [
        intakeInput(),
        intakeInput(),
        intakeInput(),
        intakeInput({ fileName: "  " }),
      ];

      const errors = yield* Effect.forEach(cases, (ports, index) =>
        intakeCv(ports, inputs[index] ?? intakeInput()).pipe(Effect.flip)
      );
      expect(errors.map(({ code }) => code)).toEqual([
        "PDF_REQUIRED",
        "PDF_REQUIRED",
        "PDF_REQUIRED",
        "PDF_REQUIRED",
      ]);
      expect(discarded).toBe(4);
    })
  );

  it.effect("maps storage and extraction failures", () =>
    Effect.gen(function* () {
      const storageError = yield* intakeCv(
        intakePorts({
          getFile: () => Promise.reject(new Error("storage unavailable")),
        }),
        intakeInput()
      ).pipe(Effect.flip);
      expect(storageError.message).toContain("could not be read");

      const extractionError = yield* intakeCv(
        intakePorts({
          extractText: () => Promise.reject(new Error("parse failed")),
        }),
        intakeInput()
      ).pipe(Effect.flip);
      expect(extractionError.message).toContain("could not be extracted");
    })
  );

  it.effect("preserves attachment errors when cleanup also fails", () =>
    Effect.gen(function* () {
      const error = yield* intakeCv(
        intakePorts({
          attach: () => Promise.reject(new Error("attach failed")),
          discard: () => Promise.reject(new Error("cleanup failed")),
        }),
        intakeInput()
      ).pipe(Effect.flip);

      expect(error.message).toContain("could not be attached");
    })
  );

  it("extracts and attaches a valid PDF through the Convex action", async () => {
    const test = convexTest(schema, modules);
    const storedUserId = await test.run((ctx) => ctx.db.insert("users", {}));
    const authenticated = test.withIdentity({ subject: storedUserId });
    await authenticated.mutation(api.profiles.upsert, {
      desiredLocations: [],
      desiredRoles: [],
      documents: [],
      education: [],
      experienceYears: 0,
      languages: [],
      licenses: [],
      locale: "en",
      pathways: [],
      skills: [],
      workModes: [],
    });
    const storedFileId = await test.run((ctx) => ctx.storage.store(pdfBlob(1)));

    const result = await authenticated.action(api.cv.extract, {
      fileId: storedFileId,
      fileName: "candidate.pdf",
    });
    const profile = await authenticated.query(api.profiles.get, {});

    expect(result.characters).toBe(12);
    expect(profile?.cvStorageId).toBe(storedFileId);
    expect(profile?.cvText).toBe("Candidate CV");
  });

  it("rejects a PDF with more than twenty pages", async () => {
    const test = convexTest(schema, modules);
    const storedUserId = await test.run((ctx) => ctx.db.insert("users", {}));
    const storedFileId = await test.run((ctx) =>
      ctx.storage.store(pdfBlob(21))
    );

    await expect(
      test.withIdentity({ subject: storedUserId }).action(api.cv.extract, {
        fileId: storedFileId,
        fileName: "candidate.pdf",
      })
    ).rejects.toBeDefined();
  });

  it("discards an uploaded file when PDF extraction fails", async () => {
    const test = convexTest(schema, modules);
    const storedUserId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "candidate@example.com" })
    );
    const authenticated = test.withIdentity({ subject: storedUserId });
    await authenticated.mutation(api.profiles.upsert, {
      desiredLocations: ["Germany"],
      desiredRoles: ["Nurse"],
      documents: ["Passport"],
      education: ["Nursing diploma"],
      experienceYears: 2,
      languages: [{ language: "German", level: "B1" }],
      licenses: [],
      locale: "en",
      pathways: ["ausbildung"],
      skills: ["Patient care"],
      workModes: ["onsite"],
    });
    const storedFileId = await test.run((ctx) =>
      ctx.storage.store(
        new Blob(["not a valid PDF"], { type: "application/pdf" })
      )
    );

    await expect(
      authenticated.action(api.cv.extract, {
        fileId: storedFileId,
        fileName: "candidate.pdf",
      })
    ).rejects.toBeDefined();

    const metadata = await test.run((ctx) =>
      ctx.db.system.get("_storage", storedFileId)
    );
    expect(metadata).toBeNull();
  });
});

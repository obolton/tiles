import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { signIn, signOut } from "../auth.ts";
import { createUser } from "@/routes/users/users.ts";
import { sendEmail } from "@/utils/email.ts";

vi.mock("@/routes/users/users.ts");
vi.mock("@/utils/email.ts");

describe("signIn", () => {
  const validInput = {
    provider: "GOOGLE" as const,
    providerId: "google-123",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    imageUrl: "https://example.com/photo.jpg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("existing user", () => {
    beforeEach(() => {
      vi.mocked(prisma.key.findUnique).mockResolvedValue({
        createdAt: new Date(),
        provider: "GOOGLE",
        providerId: "google-123",
        userId: "existing-user-id",
      });
      vi.mocked(prisma.session.create).mockResolvedValue({
        id: "session-id",
        expiresAt: new Date("2025-01-01"),
        createdAt: new Date(),
        userId: "existing-user-id",
      });
    });

    it("should create a session for existing user", async () => {
      const result = await signIn(validInput);

      expect(prisma.key.findUnique).toHaveBeenCalledWith({
        where: {
          id: {
            provider: "GOOGLE",
            providerId: "google-123",
          },
        },
        select: {
          userId: true,
        },
      });
      expect(result).toMatchObject({
        id: "session-id",
      });
    });

    it("should not create a new user for existing user", async () => {
      await signIn(validInput);

      expect(createUser).not.toHaveBeenCalled();
    });

    it("should not send welcome email for existing user", async () => {
      await signIn(validInput);

      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("new user", () => {
    beforeEach(() => {
      vi.mocked(prisma.key.findUnique).mockResolvedValue(null);
      vi.mocked(createUser).mockResolvedValue({
        id: "new-user-id",
      });
      vi.mocked(prisma.workspace.create).mockResolvedValue({
        id: "workspace-id",
        name: "Test User's Workspace",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.key.create).mockResolvedValue({
        createdAt: new Date(),
        provider: "GOOGLE",
        providerId: "google-123",
        userId: "new-user-id",
      });
      vi.mocked(prisma.session.create).mockResolvedValue({
        id: "new-session-id",
        expiresAt: new Date("2025-01-01"),
        createdAt: new Date(),
        userId: "new-user-id",
      });
      vi.mocked(sendEmail).mockResolvedValue();
    });

    it("should create a new user", async () => {
      await signIn(validInput);

      expect(createUser).toHaveBeenCalledWith(expect.anything(), {
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        imageUrl: "https://example.com/photo.jpg",
      });
    });

    it("should create a workspace for new user", async () => {
      await signIn(validInput);

      expect(prisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Test User's Workspace",
          }),
        }),
      );
    });

    it("should create an authentication key for new user", async () => {
      await signIn(validInput);

      expect(prisma.key.create).toHaveBeenCalledWith({
        data: {
          provider: "GOOGLE",
          providerId: "google-123",
          userId: "new-user-id",
        },
      });
    });

    it("should send welcome email for new user", async () => {
      await signIn(validInput);

      expect(sendEmail).toHaveBeenCalledWith("test@example.com", expect.anything());
    });

    it("should return a session for new user", async () => {
      const result = await signIn(validInput);

      expect(result).toMatchObject({
        id: "new-session-id",
      });
    });

    it("should handle welcome email failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(sendEmail).mockRejectedValue(new Error("Email failed"));

      const result = await signIn(validInput);

      expect(result).toMatchObject({
        id: "new-session-id",
      });
      expect(consoleSpy).toHaveBeenCalledWith("Failed to send welcome email:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.session.delete).mockResolvedValue({
      id: "session-id",
      expiresAt: new Date(),
      createdAt: new Date(),
      userId: "user-id",
    });
  });

  it("should delete the session", async () => {
    await signOut("session-id");

    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: {
        id: "session-id",
      },
    });
  });
});

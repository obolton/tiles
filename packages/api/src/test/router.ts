import { describe, test, expect, vi } from "vitest";
import { invalidateCachedPages } from "@/utils/cdn";
import { createCaller } from "@/test/caller";
import {
  createAuthenticatedContext,
  createServiceContext,
  createUnauthenticatedContext,
} from "@/test/mocks/context";
import { mockMembership, mockPage, PAGE_ID, WORKSPACE_ID } from "@/test/mocks/middleware";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server";
import type { AppRouterInputs } from "@/routes/index";
import type { RequestContext } from "@/utils/trpc";

/**
 * Router-level tests. `describeRouter` takes one case per procedure of a
 * router mounted on the app router and checks, through the real caller, that
 * the procedure's guard rejects the wrong callers, that a valid call reaches
 * the handler with the parsed input and the context the middleware adds, and
 * that an invalid input is rejected before the handler runs.
 *
 * Test files mock the route's handler module with `vi.mock`, plus `@/utils/cdn`
 * for routers with page-guarded procedures.
 */

/** The middleware procedure a route is built on. */
export type Guard =
  | "public"
  | "authenticated"
  | "service"
  | "page"
  | "pageUpdate"
  | "workspace"
  | "admin";

export interface ProcedureCase<Input> {
  guard: Guard;
  /** The mocked handler the route delegates to; omit for routes resolved inline. */
  handler?: (...args: never[]) => unknown;
  /** A valid input, typed against the route's real input. */
  input: Input;
  /** The arguments the handler is expected to receive; defaults to `[input, ctx]`. */
  args?(input: Input, ctx: unknown): unknown[];
  /** An input that breaks a schema constraint and is rejected with `BAD_REQUEST`. */
  invalid?: Input;
}

type RouterName = keyof AppRouterInputs;

/** One case per procedure, so a new route fails to typecheck until it is covered. */
export type RouterCases<R extends RouterName> = {
  [K in keyof AppRouterInputs[R]]: ProcedureCase<AppRouterInputs[R][K]>;
};

// Method parameters are bivariant, so every procedure of a router is assignable.
type Procedure = { call(input: unknown): Promise<unknown> }["call"];

function callProcedure(ctx: RequestContext, routerName: RouterName, name: string, input: unknown) {
  const procedures: Record<string, Procedure | undefined> = createCaller(ctx)[routerName];
  const procedure = procedures[name];
  if (!procedure) {
    throw new Error(`Unknown procedure: ${routerName}.${name}`);
  }
  return procedure(input);
}

interface Rejection {
  who: string;
  code: TRPC_ERROR_CODE_KEY;
  ctx(): RequestContext;
  mock?(): void;
}

interface Effect {
  name: string;
  /** The page ids passed to `invalidateCachedPages`, one entry per call. */
  invalidatedPages: string[][];
}

interface GuardSpec {
  rejections: Rejection[];
  /** Completes "reaches the handler ...". */
  allowed: string;
  ctx(): RequestContext;
  mock?(): void;
  /** Context fields the middleware adds for the handler. */
  context: Record<string, unknown>;
  /** Side effects of the middleware, checked after an allowed call. */
  effects: Effect[];
}

const USER = { sessionId: "session-1", userId: "user-1", isService: false };
const PAGE = { id: PAGE_ID, workspaceId: WORKSPACE_ID };

const UNAUTHENTICATED: Rejection = {
  who: "an unauthenticated caller",
  code: "UNAUTHORIZED",
  ctx: createUnauthenticatedContext,
};

const SERVICE: Rejection = {
  who: "a service caller",
  code: "UNAUTHORIZED",
  ctx: createServiceContext,
};

const SIGNED_IN_USER: Rejection = {
  who: "a signed-in user",
  code: "UNAUTHORIZED",
  ctx: createAuthenticatedContext,
};

const NON_MEMBER: Rejection = {
  who: "a user who is not a member of the workspace",
  code: "UNAUTHORIZED",
  ctx: createAuthenticatedContext,
  mock: () => mockMembership(null),
};

const PAGE_GUARD: Omit<GuardSpec, "effects"> = {
  rejections: [
    UNAUTHENTICATED,
    SERVICE,
    {
      who: "a user without access to the page",
      code: "UNAUTHORIZED",
      ctx: createAuthenticatedContext,
      mock: () => mockPage(null),
    },
  ],
  allowed: "for a user with access to the page",
  ctx: createAuthenticatedContext,
  mock: () => mockPage(PAGE),
  context: { ...USER, pageId: PAGE_ID, workspaceId: WORKSPACE_ID },
};

const GUARDS: Record<Guard, GuardSpec> = {
  public: {
    rejections: [],
    allowed: "without authentication",
    ctx: createUnauthenticatedContext,
    context: { sessionId: null, userId: null, isService: false },
    effects: [],
  },
  authenticated: {
    rejections: [UNAUTHENTICATED, SERVICE],
    allowed: "for an authenticated user",
    ctx: createAuthenticatedContext,
    context: USER,
    effects: [],
  },
  service: {
    rejections: [UNAUTHENTICATED, SIGNED_IN_USER],
    allowed: "for a service caller",
    ctx: createServiceContext,
    context: { sessionId: null, userId: null, isService: true },
    effects: [],
  },
  page: {
    ...PAGE_GUARD,
    effects: [{ name: "does not invalidate the cached page", invalidatedPages: [] }],
  },
  pageUpdate: {
    ...PAGE_GUARD,
    effects: [
      {
        name: "invalidates the cached page after the handler resolves",
        invalidatedPages: [[PAGE_ID]],
      },
    ],
  },
  workspace: {
    rejections: [UNAUTHENTICATED, SERVICE, NON_MEMBER],
    allowed: "for a workspace member",
    ctx: createAuthenticatedContext,
    mock: () => mockMembership("MEMBER"),
    context: { ...USER, workspaceId: WORKSPACE_ID, role: "MEMBER" },
    effects: [],
  },
  admin: {
    rejections: [
      UNAUTHENTICATED,
      SERVICE,
      NON_MEMBER,
      {
        who: "a workspace member who is not an admin",
        code: "FORBIDDEN",
        ctx: createAuthenticatedContext,
        mock: () => mockMembership("MEMBER"),
      },
    ],
    allowed: "for a workspace admin",
    ctx: createAuthenticatedContext,
    mock: () => mockMembership("ADMIN"),
    context: { ...USER, workspaceId: WORKSPACE_ID, role: "ADMIN" },
    effects: [],
  },
};

const RESULT = { result: true };

function describeProcedure(
  routerName: RouterName,
  name: string,
  { guard, handler, input, args, invalid }: ProcedureCase<unknown>,
) {
  const { rejections, allowed, ctx, mock, context, effects } = GUARDS[guard];
  const call = (callerCtx: RequestContext, value: unknown = input) =>
    callProcedure(callerCtx, routerName, name, value);
  const handlerCalls = () => (handler ? vi.mocked(handler).mock.calls : []);

  test.each(rejections)("rejects $who", async (rejection) => {
    rejection.mock?.();
    await expect(call(rejection.ctx())).rejects.toMatchObject({ code: rejection.code });
    expect(handlerCalls()).toEqual([]);
  });

  // Routes resolved inline have no handler to reach, only a value to return.
  test.each(handler ? [] : [{}])(`resolves ${allowed}`, async () => {
    mock?.();
    await expect(call(ctx())).resolves.toBeDefined();
  });

  test.each(handler ? [{ handler }] : [])(`reaches the handler ${allowed}`, async ({ handler }) => {
    mock?.();
    vi.mocked(handler).mockResolvedValue(RESULT);
    await expect(call(ctx())).resolves.toBe(RESULT);
    const handlerContext = expect.objectContaining(context);
    expect(handler).toHaveBeenCalledExactlyOnceWith(
      ...(args ? args(input, handlerContext) : [input, handlerContext]),
    );
  });

  test.each(effects)("$name", async (effect) => {
    mock?.();
    await call(ctx());
    const invalidatedPages = vi.mocked(invalidateCachedPages).mock.calls.map(([ids]) => ids);
    expect(invalidatedPages).toEqual(effect.invalidatedPages);
  });

  test.each(invalid === undefined ? [] : [invalid])("rejects an invalid input", async (value) => {
    mock?.();
    await expect(call(ctx(), value)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(handlerCalls()).toEqual([]);
  });
}

export function describeRouter<R extends RouterName>(routerName: R, cases: RouterCases<R>) {
  describe(`${routerName} router`, () => {
    describe.each(Object.entries<ProcedureCase<unknown>>(cases))("%s", (name, procedureCase) => {
      describeProcedure(routerName, name, procedureCase);
    });
  });
}

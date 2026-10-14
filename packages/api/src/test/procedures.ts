import { describe, test, expect, vi, beforeEach } from "vitest";
import { invalidateCachedPages } from "@/utils/cdn";
import { createCaller } from "@/test/caller";
import {
  createAuthenticatedContext,
  createServiceContext,
  createUnauthenticatedContext,
} from "@/test/mocks/context";
import { mockMembership, mockPage, PAGE_ID, WORKSPACE_ID } from "@/test/mocks/middleware";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server";
import type { AppCaller } from "@/test/caller";
import type { RequestContext } from "@/utils/trpc";

/**
 * Router-level test harness. `describeRouter` registers, for every procedure
 * of a router mounted on the app router, tests that the procedure's guard
 * rejects the wrong callers, that a valid call reaches the (mocked) handler
 * with the parsed input and the context the middleware adds, and that an
 * invalid input is rejected before the handler runs.
 *
 * Test files mock the route's handler module with `vi.mock`, and
 * `@/utils/cdn` for routers with page-guarded procedures.
 */

/** Which middleware procedure a route is built on. */
export type ProcedureGuard =
  | "public"
  | "authenticated"
  | "page"
  | "pageUpdate"
  | "workspace"
  | "admin";

export interface ProcedureCase<Input> {
  guard: ProcedureGuard;
  /** The mocked handler the route delegates to; omit for routes resolved inline. */
  handler?: (...args: never[]) => unknown;
  /** A valid input that reaches the handler. */
  input: Input;
  /** Expected handler arguments for `input`; defaults to `[input, ctx]`. */
  args?(input: Input, ctx: unknown): unknown[];
  /** An input breaking a schema constraint, rejected with `BAD_REQUEST`. */
  invalid?: Input;
}

type RouterName = keyof AppCaller;

type ProcedureInput<R extends RouterName, K extends keyof AppCaller[R]> = Parameters<
  AppCaller[R][K]
>[0];

/** One case per procedure, so a new route fails to typecheck until it is covered. */
export type RouterCases<R extends RouterName> = {
  [K in keyof AppCaller[R]]: ProcedureCase<ProcedureInput<R, K>>;
};

// Procedure inputs differ per route, so the caller is indexed through a
// parameter-bivariant method signature.
type Procedure = { call(input: unknown): Promise<unknown> }["call"];

function callProcedure(ctx: RequestContext, routerName: RouterName, name: string, input: unknown) {
  const procedures: Record<string, Procedure> = createCaller(ctx)[routerName];
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
  /** Page id lists passed to `invalidateCachedPages`, one per call. */
  invalidatedPages: string[][];
}

interface Guard {
  rejections: Rejection[];
  /** Describes the allowed caller, completing "reaches the handler ...". */
  allowed: string;
  ctx(): RequestContext;
  mock?(): void;
  /** Fields the middleware adds to the handler's context. */
  context: Record<string, unknown>;
  /** Side effects of the middleware, checked after an allowed call. */
  effects: Effect[];
}

const USER = { sessionId: "session-1", userId: "user-1", serviceName: null };
const PAGE = { id: PAGE_ID, workspaceId: WORKSPACE_ID };

const UNAUTHENTICATED_REJECTIONS: Rejection[] = [
  { who: "an unauthenticated caller", code: "UNAUTHORIZED", ctx: createUnauthenticatedContext },
  { who: "a service caller", code: "UNAUTHORIZED", ctx: createServiceContext },
];

const NON_MEMBER_REJECTION: Rejection = {
  who: "a user who is not a member of the workspace",
  code: "UNAUTHORIZED",
  ctx: createAuthenticatedContext,
  mock: () => mockMembership(null),
};

const PAGE_GUARD: Omit<Guard, "effects"> = {
  rejections: [
    ...UNAUTHENTICATED_REJECTIONS,
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

const GUARDS: Record<ProcedureGuard, Guard> = {
  public: {
    rejections: [],
    allowed: "without authentication",
    ctx: createUnauthenticatedContext,
    context: { sessionId: null, userId: null, serviceName: null },
    effects: [],
  },
  authenticated: {
    rejections: UNAUTHENTICATED_REJECTIONS,
    allowed: "for an authenticated user",
    ctx: createAuthenticatedContext,
    context: USER,
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
    rejections: [...UNAUTHENTICATED_REJECTIONS, NON_MEMBER_REJECTION],
    allowed: "for a workspace member",
    ctx: createAuthenticatedContext,
    mock: () => mockMembership("MEMBER"),
    context: { ...USER, workspaceId: WORKSPACE_ID, role: "MEMBER" },
    effects: [],
  },
  admin: {
    rejections: [
      ...UNAUTHENTICATED_REJECTIONS,
      NON_MEMBER_REJECTION,
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

function describeProcedure(
  routerName: RouterName,
  name: string,
  { guard, handler, input, args, invalid }: ProcedureCase<unknown>,
) {
  const { rejections, allowed, ctx, mock, context, effects } = GUARDS[guard];
  const call = (callerCtx: RequestContext, value: unknown = input) =>
    callProcedure(callerCtx, routerName, name, value);
  const handlerCalls = () => (handler ? vi.mocked(handler).mock.calls : []);
  const expectedCalls = (handlerContext: unknown) =>
    handler ? [args ? args(input, handlerContext) : [input, handlerContext]] : [];
  const invalidInputs = invalid === undefined ? [] : [invalid];

  test.each(rejections)("rejects $who", async (rejection) => {
    rejection.mock?.();
    await expect(call(rejection.ctx())).rejects.toMatchObject({ code: rejection.code });
    expect(handlerCalls()).toEqual([]);
  });

  test(`reaches the handler ${allowed}`, async () => {
    mock?.();
    await call(ctx());
    expect(handlerCalls()).toEqual(expectedCalls(expect.objectContaining(context)));
  });

  test.each(effects)("$name", async (effect) => {
    mock?.();
    await call(ctx());
    const invalidatedPages = vi.mocked(invalidateCachedPages).mock.calls.map(([ids]) => ids);
    expect(invalidatedPages).toEqual(effect.invalidatedPages);
  });

  test.each(invalidInputs)("rejects an invalid input", async (value) => {
    mockMembership("ADMIN");
    mockPage(PAGE);
    await expect(call(createAuthenticatedContext(), value)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(handlerCalls()).toEqual([]);
  });
}

export function describeRouter<R extends RouterName>(routerName: R, cases: RouterCases<R>) {
  describe(`${routerName} router`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe.each(Object.entries<ProcedureCase<unknown>>(cases))("%s", (name, procedureCase) => {
      describeProcedure(routerName, name, procedureCase);
    });
  });
}

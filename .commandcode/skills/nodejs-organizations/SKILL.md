---
name: nodejs-organizations
description: Design, implement, review, or test secure multi-tenant organizations in Node.js backends, including memberships, invitations, teams, roles, permissions, active organization context, ownership transfer, tenant-scoped data, and audit events. Use for B2B SaaS workspaces, teams, RBAC, organization billing ownership, or cross-tenant isolation.
---

# Node.js Organizations

Build organizations as a server-enforced authorization boundary, not only a dashboard feature. Prefer the application's existing authentication and database stack.

## Confirm before changing

Inspect read-only first. Before writing files, changing schema, adding packages, running migrations, or altering authorization behavior, show a proposal of no more than five short bullets covering the requested organization features, affected areas, permission/tenant model, verification, and anything intentionally excluded. Wait for confirmation, then perform only the approved work. Do not add teams, dynamic roles, billing, or other optional features unless requested. Do not repeat documentation or narrate routine steps unless asked.

## Inspect before designing

Inspect authentication, session or token handling, schema, ORM, route authorization, user model, billing ownership, and existing organization code. Preserve the project's framework and database choices.

Implement the organization domain in the Node.js backend itself using its existing route, controller, service, validation, and persistence conventions. Read [references/organizations.md](references/organizations.md) before creating the schema or endpoints.

If the project already uses an organization library, including Better Auth's organization plugin, do not build a competing organization system. Preserve that library and apply this skill's tenant-isolation, authorization, lifecycle, and testing requirements around it. Do not migrate authentication providers merely to add organizations.

## Model the boundary

Use only concepts the product needs:

- organization or workspace;
- membership joining a user to an organization;
- owner, admin, and member roles or explicit permissions;
- invitations with invited email, inviter, role, expiry, status, and single-use acceptance;
- optional teams inside an organization;
- optional organization-owned billing customer and plan entitlement.

Add database constraints for unique slugs, unique membership per user and organization, valid invitation identity, and provider billing IDs where applicable. Prefer simple static roles until the product genuinely needs custom roles.

## Enforce authorization server-side

- Derive the authenticated user from the verified session or token.
- Treat an active organization ID as context, never proof of membership or permission.
- Scope every tenant-owned read and write by an organization the user is authorized to access.
- Deny by default and check permissions on every protected request.
- Prevent mass assignment of role, owner, organization, billing, and entitlement fields.
- Keep UI permission checks for presentation only.
- Protect the last owner; require an explicit ownership transfer before removal or departure.

Prefer a scoped repository/service API such as `findProject({ organizationId, projectId })` over fetching by project ID and checking later. Return the application's intentional 403 or 404 policy without revealing another tenant's resource.

## Secure invitations and lifecycle

Normalize and bind the invite to the intended email or identity, make it expiring, revocable, and single use, and prevent role escalation during acceptance. Apply invitation and membership limits. Audit organization creation/deletion, invitations, membership changes, role changes, ownership transfer, billing changes, and destructive actions.

Define what happens to tenant data on deletion, suspension, member removal, and subscription expiry. Prefer reversible archive/soft-delete behavior for destructive organization operations unless requirements say otherwise.

## Test tenant isolation

Create at least two organizations and users with different roles. Test:

- allowed access inside the correct organization;
- denial of cross-tenant reads and writes even with guessed UUIDs;
- missing membership, insufficient role, and stale active-org context;
- invitation expiry, reuse, wrong identity, cancellation, and role tampering;
- last-owner protection and ownership transfer;
- organization-scoped pagination, search, background jobs, caches, file keys, and webhooks where applicable.

## Verification and handoff

Run migrations, focused tests, the full relevant suite, typecheck, and build. Report the domain model, permission matrix, tenant-scoping pattern, destructive lifecycle policy, existing-library assumptions, tests run, and unresolved product rules.

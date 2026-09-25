# Organization architecture and references

## Official references

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): least privilege, deny by default, permission checks on every request, logging, and authorization testing.
- [OWASP IDOR Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html): object-level authorization and lookup scoping.

## Default Node.js structure

Adapt names to the existing architecture; do not create duplicate layers when the project uses a different pattern.

```text
src/
├── controllers/organization.controller.ts
├── models/organization.model.ts
├── models/membership.model.ts
├── models/invitation.model.ts
├── models/team.model.ts                 # only when teams are requested
├── routes/organization.route.ts
├── services/organization.service.ts
├── services/membership.service.ts
├── services/invitation.service.ts
├── middlewares/organization.middleware.ts
├── utils/organization-permission.ts
└── validators/organization.validator.ts
```

Keep HTTP parsing in routes/controllers, business invariants in services, persistence in models/repositories, and authorization in reusable server-side policies or middleware. Services must still enforce sensitive invariants; middleware alone is not sufficient authority for reusable service calls or jobs.

## Domain schema

```text
organizations(id, name, slug, status, created_by, created_at, updated_at)
memberships(id, organization_id, user_id, role, joined_at)
invitations(id, organization_id, email, role, token_hash, invited_by, expires_at, accepted_at, revoked_at)
teams(id, organization_id, name, created_at)
team_members(team_id, membership_id, joined_at)
organization_audit_events(id, organization_id, actor_user_id, action, target_type, target_id, metadata, created_at)
```

Use composite uniqueness for `(organization_id, user_id)`, organization-scoped team names where required, and invitation rules that prevent multiple usable invites for the same identity. Store invitation token hashes rather than reusable plaintext tokens. Use transactions for acceptance, ownership transfer, and other multi-write invariants.

Every tenant-owned business table should carry an `organization_id` or have an unambiguous ownership path to one. Add indexes that begin with `organization_id` for common scoped queries.

## Core HTTP contract

Expose only the routes required by the product. A typical REST shape is:

```text
POST   /organizations
GET    /organizations
GET    /organizations/:organizationId
PATCH  /organizations/:organizationId
DELETE /organizations/:organizationId

GET    /organizations/:organizationId/members
PATCH  /organizations/:organizationId/members/:membershipId/role
DELETE /organizations/:organizationId/members/:membershipId
POST   /organizations/:organizationId/ownership-transfer

POST   /organizations/:organizationId/invitations
GET    /organizations/:organizationId/invitations
DELETE /organizations/:organizationId/invitations/:invitationId
POST   /organization-invitations/:token/accept
```

Team endpoints are optional. Paginate member, invitation, team, and audit lists. Never accept `userId`, `organizationId`, `role`, plan, or ownership fields from a client when the server can derive or constrain them.

## Permission model

Start with a small static permission map rather than scattered role comparisons:

```ts
const rolePermissions = {
  owner: ["organization:update", "organization:delete", "member:read", "member:invite", "member:update", "member:remove", "ownership:transfer"],
  admin: ["organization:update", "member:read", "member:invite", "member:update", "member:remove"],
  member: ["organization:read", "member:read"],
} as const;
```

Adapt permissions to product requirements. Do not allow an admin to grant a role or permission equal to or above their own authority. Check both membership and permission at the service boundary.

Tenant-scoped lookup example:

```ts
const project = await projectRepository.findOne({
  id: projectId,
  organizationId: authorizedMembership.organizationId,
});
```

Do not fetch by `projectId` alone and rely on an active organization selected by the client.

## Existing organization libraries

When the backend already uses an organization library, preserve it instead of duplicating its tables and endpoints. Map the library's organization, membership, invitation, team, and permission behavior against this skill's invariants, then implement only missing application-owned authorization and tenant scoping.

For an existing Better Auth setup, consult the current [Better Auth organization documentation](https://better-auth.com/docs/plugins/organization). Its active organization is context, not authorization for application-owned tables; those queries must still verify membership and scope by organization on the server.

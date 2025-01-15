## Role Emulation

### The Profile dialog, accessible from the Profile button on the top navbar, allows (almost) anyone to emulate a "lesser" role.
- We're not providing user emulation, just role emulation at a specific org or agency.
- For a Super Admin, "lesser" means an admin or member of any org or agency.
- For an org admin or member, the definition of "lesser" means an admin or non-admin user at a connected agency.
- For an agency admin, "lesser" means "member of own agency".
- Agency members cannot emulate anything or anyone.

#### When a user is fetched from the database or the SWR cache, an array of emulation choices (ec or availableRoles) is returned along with the user record.

#### emulatedRole starts life as an empty object. effectiveRole is nativeRole ***unless*** emulatedRole is non-empty; in this case it overrides nativeRole.

####
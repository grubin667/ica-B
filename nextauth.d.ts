// In this file we're declaring an enum named Role. For now, it's just for an example.
export enum Role {
  user = "user",
  admin = "admin",
}

// Then we modify the JWT interface, again adding Role and subscribed.
// And we add the important property, superAdmin.
declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    subscribed: boolean;
    superAdmin: boolean;
  }
}

// Then we're augmenting the User interface, adding Role and subscribed.
declare module "next-auth" {
  interface User {
    role?: Role;
    subscribed: boolean;
    superAdmin: boolean;
  }
  interface Session extends DefaultSession {
    user?: User;
  }
}

// Additionally, we've added these fields to next-auth callbacks jwt and session
// to copy these new fields to token and then to session.user.
import { prisma } from "../../../lib/prisma";
import NextAuth, { AuthOptions } from "next-auth";
import { authOptions } from "../authOptions";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

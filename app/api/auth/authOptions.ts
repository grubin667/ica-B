import { prisma } from "../../lib/prisma";
import NextAuth, { AuthOptions } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { CustomsendVerificationRequest } from "./signinemail";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest({ identifier, url, provider }) {
        CustomsendVerificationRequest({ identifier, url, provider })
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {

    jwt: ({ token, user, account, profile }) => {
      // console.log('')
      // console.log(`****in jwt callback - token=${JSON.stringify(token)} user=${JSON.stringify(user)}`)

      if (user) {
        const u = user as unknown as any;
        return {
          ...token,
          id: u.id,
          randomKey: u.randomKey,
          // Copy user augment props into token.
          role: u.role || "admin",
          subscribed: u.subscribed || false,
          // cheat for now
          superAdmin: u.email === "jerry@rubintech.com" || u.email === "kentjmcallister@gmail.com",
        };
      }
      return token;
    },

    session: ({ session, token, user }) => {
      // console.log('')
      // console.log(`****in session callback - session=${JSON.stringify(session)} token=${JSON.stringify(token)} userS=${user} userJ=${JSON.stringify(user)}`)

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          randomKey: token.randomKey,
          // Copy token augment (or did I mean argument?) props into session.user.
          role: token.role,
          subscribed: token.subscribed,
          superAdmin: token.superAdmin || false
        },
      };
      /*
        // get accessToken from Account table.
        const getToken = await prisma.account.findFirst({
          where: {
            userId: user.id,
          },
        });
        let accessToken: string | null = null;

        // store accessToken in session.
        if (getToken) {
          accessToken = getToken.access_token!;
        }
        session.user.token = accessToken;
        return session;
      */
    },

    signIn({ user, account, profile, email, credentials }) {
      // console.log('')
      // console.log(`****in signIn callback - user=${JSON.stringify(user)} account=${JSON.stringify(account)} profile=${JSON.stringify(profile)} email=${JSON.stringify(email)} credentials=${JSON.stringify(credentials)} `)

      // Use the signIn() callback to control if a user is allowed to sign in.

      // await db.connect();
      // const userExists = await User.findOne({
      //   email: user.email,  //the user object has an email property, which contains the email the user entered.
      // });
      // if (userExists) {
      //   return true;   // if the email exists in the User collection, email them a magic login link
      // } else {
      //   return "/register";
      // }

      const isAllowedToSignIn = true
      if (isAllowedToSignIn) {
        return true
      } else {
        // Return false to display a default error message
        return false
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },

    redirect({ url, baseUrl }) {
      // console.log('')
      // console.log(`****in redirect callback - url=${url} baseUrl=${baseUrl}`)

      // The redirect callback is called anytime the user is redirected to a callback URL (e.g. on signin or signout).
      // By default only URLs on the same URL as the site are allowed, you can use the redirect callback to customise that behaviour.
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
};

import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "~/env";

import { db } from "~/server/db";

import type { User as PUser } from "@prisma/client";
import { v4 } from "uuid";
import bcrypt from "bcryptjs";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: PUser;
  }
}
/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      checks: ["none"],
    }),
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "email", type: "email", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _req) {
        // Add logic here to look up the user from the credentials supplied
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        if (credentials?.password === "") {
          return null;
        }

        const user = await db.user.findFirst({
          where: {
            email: credentials.email,
            accounts: {
              some: {
                provider: "credentials",
              },
            },
          },
          include: {
            accounts: true,
          },
        });

        if (!user) {
          console.log("no user");
          return null;
        }
        if (user.accounts.length === 0) {
          console.log("no accounts");
          return null;
        }

        const password = credentials.password;

        const credAccount = user.accounts.find(
          (account) => account.provider === "credentials",
        );

        if (!credAccount) {
          console.log("no credAccount");
          return null;
        }

        if (!credAccount.password) {
          console.log("no password");
          return null;
        }

        if (!bcrypt.compareSync(password, credAccount.password)) {
          console.log("wrong password");
          return null;
        }

        return user;
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        // password: undefined,
      },
    }),
    // Check if registration is allowed
    async signIn({ user }) {
      // If user already exists, allow sign in
      const existingUser = await db.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (existingUser) {
        return true;
      }

      // For new users, check if registration is allowed
      const settings = await db.setting.findFirst();
      if (settings && !settings.allowRegistration) {
        return false; // Registration is disabled, reject sign in
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = v4();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        // console.log("params", params);

        const expire = new Date();
        expire.setDate(expire.getDate() + 30);

        const createdSession = await db.session.create({
          data: {
            sessionToken,
            userId: params.token.sub,
            expires: expire,
          },
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        // console.log("createdSession", createdSession);

        return sessionToken;
      }
      return JSON.stringify(params.token);
    },
  },
} satisfies NextAuthConfig;

// https://ap-southeast-2f8wjhmcb7.auth.ap-southeast-2.amazoncognito.com/oauth2/authorize?response_type=code&client_id=5melqqcum081ah78h1ei51vc86&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fcallback%2Fcognito&scope=openid+profile+email&code_challenge=8WddoRnD4vK_K2xWRbwzZSNOJtDLJFKiJuQsJm7rr7k&code_challenge_method=S256
// https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_F8wjhmcb7/oauth2/authorize?response_type=code&client_id=5melqqcum081ah78h1ei51vc86&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fcallback%2Fcognito&scope=openid+profile+email&code_challenge=OxFSm0hP12JByhSRrCzHiwu-5NMcmGKMvJxSyucS6sM&code_challenge_method=S256

"use server"

import { type NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers'
import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export async function POST(req: NextRequest) {

  const cookieStore = await cookies()

  try {

    const res = signupSchema.safeParse(await req.json());

    if (!res.success) {
      return NextResponse.json(
        { error: res.error.message },
        { status: 400 }
      );
    }

    const { name, email, password, confirmPassword } = res.data;

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(16);
    const hashedPassword = bcrypt.hashSync(password, salt);


    // Create user and credentials account
    const newUser = await db.user.create({
      data: {
        name,
        email,
        emailVerified: null,
        accounts: {
          create: {
            type: "password",
            provider: "credentials",
            providerAccountId: email,
            password: hashedPassword, // Store hashed password
          },
        },
        sessions: {
          create: {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            sessionToken: crypto.randomUUID(),
          },
        },
      },
      include: {
        sessions: true,
      },
    });

    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const session = newUser.sessions[0];
    if (!session) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const response = {
      message: "User registered successfully",
      session: session,
    };

    cookieStore.set('authjs.session-token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json(response, { status: 201 });


  } catch (error) {
    console.error("Registration error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 
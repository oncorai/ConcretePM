import bcrypt from "bcryptjs";
import { prisma } from "./src/lib/prisma";

async function testAuth() {
  try {
    // Check if demo user exists
    const user = await prisma.user.findUnique({
      where: { email: "demo@example.com" },
    });

    if (user) {
      console.log("Demo user found:", {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
      });

      // Test password
      if (user.password) {
        const isValid = await bcrypt.compare("demo123", user.password);
        console.log("Password 'demo123' is valid:", isValid);
      }
    } else {
      console.log("Demo user not found, creating...");
      
      const hashedPassword = await bcrypt.hash("demo123", 10);
      const newUser = await prisma.user.create({
        data: {
          email: "demo@example.com",
          password: hashedPassword,
          name: "Demo User",
        },
      });
      
      console.log("Created user:", newUser);
    }

    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        createdAt: true,
      },
    });
    
    console.log("\nAll users in database:");
    console.table(allUsers);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
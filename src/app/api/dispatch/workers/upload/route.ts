import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Process and validate data
    const workers = [];
    const errors = [];
    const successfulImports = [];

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];

      // Extract fields from various possible column names
      const firstName = row["First Name"] || row["FirstName"] || row["first_name"] || "";
      const lastName = row["Last Name"] || row["LastName"] || row["last_name"] || "";
      const name = `${firstName} ${lastName}`.trim();
      const role = row["Role"] || row["role"] || "laborer";
      const phoneRaw = row["Phone Number"] || row["PhoneNumber"] || row["phone_number"] || row["Phone"] || "";

      // Clean phone number (remove non-digits except leading +)
      let phone = String(phoneRaw).replace(/[^\d+]/g, "");

      // Add +1 if it's a 10-digit US number without country code
      if (phone.length === 10 && !phone.startsWith("+")) {
        phone = "+1" + phone;
      } else if (phone.length === 11 && phone.startsWith("1")) {
        phone = "+" + phone;
      } else if (!phone.startsWith("+") && phone.length > 0) {
        phone = "+" + phone;
      }

      // Validate row
      if (!name || name === " ") {
        errors.push(`Row ${i + 2}: Missing name`);
        continue;
      }

      if (!phone || phone.length < 10) {
        errors.push(`Row ${i + 2}: Invalid phone number for ${name}`);
        continue;
      }

      // Normalize role - remove plural 's' and special characters
      let workerRole = role.toLowerCase()
        .replace(/s$/, '') // Remove plural 's' at the end
        .replace(/[^a-z ]/g, '') // Remove special characters but keep spaces
        .trim();

      // Map common variations to standard roles
      const roleMap: Record<string, string> = {
        'operator': 'operator',
        'operators': 'operator',
        'carpenter': 'carpenter',
        'carpenters': 'carpenter',
        'laborer': 'laborer',
        'laborers': 'laborer',
        'foreman': 'foreman',
        'foremen': 'foreman',
        'superintendent': 'superintendent',
        'superintendents': 'superintendent',
        'finisher': 'finisher',
        'finishers': 'finisher',
        'sawcutter': 'sawcutter',
        'sawcutters': 'sawcutter',
        'saw cutter': 'sawcutter',
        'patcher': 'patcher',
        'patchers': 'patcher',
        'project manager': 'project manager',
        'field engineer': 'field engineer',
        'safety': 'safety'
      };

      // Use mapped role or keep original if not in map
      workerRole = roleMap[workerRole] || workerRole;

      workers.push({
        name,
        phone,
        workerRole,
      });
    }

    // Batch insert workers
    for (const worker of workers) {
      try {
        // Check if worker already exists
        const existing = await prisma.dispatchWorker.findFirst({
          where: { phone: worker.phone },
        });

        if (existing) {
          if (existing.isDeleted) {
            // Reactivate deleted worker
            await prisma.dispatchWorker.update({
              where: { id: existing.id },
              data: {
                name: worker.name,
                workerRole: worker.workerRole,
                isDeleted: false,
                status: "active",
              },
            });
            successfulImports.push(`Updated: ${worker.name}`);
          } else {
            errors.push(`Skipped: ${worker.name} (phone already exists)`);
          }
        } else {
          // Create new worker
          await prisma.dispatchWorker.create({
            data: {
              name: worker.name,
              phone: worker.phone,
              workerRole: worker.workerRole,
              skills: [],
              status: "active",
            },
          });
          successfulImports.push(`Added: ${worker.name}`);
        }
      } catch (error) {
        console.error(`Failed to import ${worker.name}:`, error);
        errors.push(`Failed: ${worker.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: successfulImports.length,
      skipped: errors.length,
      details: {
        successful: successfulImports,
        errors,
      },
    });
  } catch (error) {
    console.error("Failed to upload workers:", error);
    return NextResponse.json(
      { error: "Failed to process file. Please ensure it's a valid Excel file." },
      { status: 500 }
    );
  }
}
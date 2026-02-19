import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface WorkerCSV {
  name: string;
  phone: string;
  workerRole: string;
  email?: string;
}

// Function to format phone numbers consistently
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it's 10 digits, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it's 11 digits and starts with 1, add +
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  // Otherwise return with + prefix
  return digits.startsWith('+') ? digits : `+${digits}`;
}

async function batchUploadWorkers(csvFilePath: string) {
  const workers: WorkerCSV[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        workers.push({
          name: data.name || data.Name,
          phone: formatPhoneNumber(data.phone || data.Phone || data.phone_number || data['Phone Number']),
          workerRole: data.workerRole || data['Worker Role'] || data.role || data.Role || 'Laborer',
          email: data.email || data.Email || undefined
        });
      })
      .on('end', async () => {
        try {
          console.log(`Found ${workers.length} workers in CSV file`);

          // Upload workers in batches
          const batchSize = 10;
          let created = 0;
          let skipped = 0;

          for (let i = 0; i < workers.length; i += batchSize) {
            const batch = workers.slice(i, i + batchSize);

            for (const worker of batch) {
              try {
                // Check if worker already exists
                const existing = await prisma.worker.findUnique({
                  where: { phone: worker.phone }
                });

                if (existing) {
                  console.log(`  ⚠️  Skipped ${worker.name} - phone number already exists`);
                  skipped++;
                } else {
                  await prisma.worker.create({
                    data: {
                      name: worker.name,
                      phone: worker.phone,
                      workerRole: worker.workerRole,
                      email: worker.email,
                    }
                  });
                  console.log(`  ✅ Created ${worker.name} (${worker.workerRole})`);
                  created++;
                }
              } catch (error) {
                console.error(`  ❌ Error creating ${worker.name}:`, error);
              }
            }
          }

          console.log(`\n✅ Upload complete!`);
          console.log(`   Created: ${created} workers`);
          console.log(`   Skipped: ${skipped} workers (already existed)`);

          await prisma.$disconnect();
          resolve();
        } catch (error) {
          console.error('Error uploading workers:', error);
          await prisma.$disconnect();
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

// Get CSV file path from command line argument
const csvFile = process.argv[2];

if (!csvFile) {
  console.error('❌ Please provide a CSV file path');
  console.log('\nUsage: npx tsx scripts/batch-upload-workers.ts <path-to-csv-file>');
  console.log('\nExpected CSV format:');
  console.log('  name,phone,workerRole');
  console.log('  John Doe,555-123-4567,Carpenter');
  console.log('  Jane Smith,(555) 987-6543,Foreman');
  process.exit(1);
}

const csvPath = path.resolve(csvFile);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  process.exit(1);
}

console.log(`📁 Loading workers from: ${csvPath}`);
batchUploadWorkers(csvPath)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
/**
 * Script to fix existing library documents that were uploaded before the new processing system
 * 
 * This script:
 * 1. Finds all PDFMaterials linked to LibraryGeneralMaterialChapters
 * 2. Ensures they have the library system school ID
 * 3. Creates MaterialProcessing records if missing
 * 4. Optionally re-processes documents that failed or weren't processed
 * 
 * Usage:
 *   npx ts-node scripts/fix-existing-library-documents.ts [--reprocess]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FixOptions {
  reprocess?: boolean;
  dryRun?: boolean;
}

async function findLibrarySystemSchool() {
  const librarySchool = await prisma.school.findUnique({
    where: { school_email: 'library-chat@system.com' },
    select: { id: true, school_name: true },
  });

  if (!librarySchool) {
    // Create the library system school if it doesn't exist
    const newSchool = await prisma.school.create({
      data: {
        school_name: 'Library Chat System',
        school_email: 'library-chat@system.com',
        school_phone: '+000-000-0000',
        school_address: 'System Default',
        school_type: 'primary_and_secondary',
        school_ownership: 'private',
        status: 'approved',
      },
      select: { id: true, school_name: true },
    });
    console.log(`✅ Created library system school: ${newSchool.id}`);
    return newSchool;
  }

  console.log(`✅ Found library system school: ${librarySchool.id} (${librarySchool.school_name})`);
  return librarySchool;
}

async function fixExistingDocuments(options: FixOptions = {}) {
  const { reprocess = false, dryRun = false } = options;

  console.log('\n🔍 Finding library documents that need fixing...\n');

  // Find all PDFMaterials that are linked to LibraryGeneralMaterialChapters
  const pdfMaterials = await prisma.pDFMaterial.findMany({
    where: {
      materialId: {
        not: null,
      },
    },
    include: {
      materialProcessings: true,
    },
  });

  console.log(`📊 Found ${pdfMaterials.length} PDFMaterials linked to chapters\n`);

  const librarySchool = await findLibrarySystemSchool();
  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const material of pdfMaterials) {
    try {
      // Check if material needs fixing
      const needsSchoolIdFix = !material.schoolId || material.schoolId !== librarySchool.id;
      const needsProcessingRecord = !material.materialProcessings;

      if (!needsSchoolIdFix && !needsProcessingRecord) {
        console.log(`⏭️  Skipping ${material.id} - already correct`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`🔍 [DRY RUN] Would fix material: ${material.id}`);
        if (needsSchoolIdFix) {
          console.log(`   - Update schoolId to ${librarySchool.id}`);
        }
        if (needsProcessingRecord) {
          console.log(`   - Create MaterialProcessing record`);
        }
        fixed++;
        continue;
      }

      // Fix schoolId if needed
      if (needsSchoolIdFix) {
        await prisma.pDFMaterial.update({
          where: { id: material.id },
          data: { schoolId: librarySchool.id },
        });
        console.log(`✅ Fixed schoolId for material: ${material.id}`);
      }

      // Create MaterialProcessing record if missing
      if (needsProcessingRecord) {
        const existingProcessing = await prisma.materialProcessing.findFirst({
          where: { material_id: material.id },
        });

        if (!existingProcessing) {
          await prisma.materialProcessing.create({
            data: {
              material_id: material.id,
              school_id: librarySchool.id,
              status: reprocess ? 'PENDING' : 'COMPLETED', // Set to PENDING if reprocessing
              total_chunks: 0,
              processed_chunks: 0,
              failed_chunks: 0,
              embedding_model: 'text-embedding-3-small',
            },
          });
          console.log(`✅ Created MaterialProcessing record for: ${material.id}`);
        }
      }

      fixed++;
    } catch (error: any) {
      console.error(`❌ Error fixing material ${material.id}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  if (reprocess && !dryRun) {
    console.log('\n🔄 To reprocess documents, you need to manually trigger processing:');
    console.log('   - Use the DocumentProcessingService.processDocument() method');
    console.log('   - Or create an admin endpoint to trigger reprocessing');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const reprocess = args.includes('--reprocess');
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Starting fix script for existing library documents...');
  console.log(`   Reprocess: ${reprocess ? 'Yes' : 'No'}`);
  console.log(`   Dry Run: ${dryRun ? 'Yes' : 'No'}\n`);

  try {
    await fixExistingDocuments({ reprocess, dryRun });
    console.log('\n✅ Script completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

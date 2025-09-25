import { createSupabaseServerAdminClient } from "@/lib/supabase/admin";
import { IMAGE_UPLOAD_CONSTRAINTS } from "@/lib/app-utils";

async function setupChatImageStorage(): Promise<void> {
  console.log("🚀 Setting up chat image storage...");

  const supabase = createSupabaseServerAdminClient();

  try {
    // Check if bucket already exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const bucketExists = existingBuckets?.some(
      (bucket: { id: string }) =>
        bucket.id === IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME,
    );

    if (bucketExists) {
      console.log(
        `✅ Storage bucket '${IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME}' already exists`,
      );
    } else {
      // Create the storage bucket - PRIVATE for security
      const { error: bucketError } = await supabase.storage.createBucket(
        IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME,
        {
          public: false, // PRIVATE bucket - files accessed via signed URLs
          allowedMimeTypes: ["image/jpeg", "image/png"],
          fileSizeLimit: 10485760, // 10MB in bytes
        },
      );

      if (bucketError) {
        console.error("❌ Error creating storage bucket:", bucketError);
        throw bucketError;
      }

      console.log(
        `✅ Storage bucket '${IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME}' created successfully (PRIVATE)`,
      );
    }

    // RLS policies will be handled via database migration
    console.log(
      "🔒 Note: RLS policies need to be created via database migration",
    );
    console.log("📋 Run the following command to create storage policies:");
    console.log("   npm run db:migrate");
    console.log("");
    console.log(
      "💡 The storage policies will be created in the next migration file.",
    );

    console.log("🎉 Chat image storage setup complete!");
    console.log(`📁 Bucket: ${IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME} (PRIVATE)`);
    console.log("🔐 Access: Signed URLs with 24-hour expiration");
    console.log("📏 Size limit: 10MB per file");
    console.log("🖼️ Allowed types: JPEG, PNG");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run the setup
setupChatImageStorage().then(() => {
  console.log("✨ Setup completed successfully!");
  process.exit(0);
});

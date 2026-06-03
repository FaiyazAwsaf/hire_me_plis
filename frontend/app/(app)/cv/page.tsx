"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * CV Root Page
 * Redirects to the Upload page as the primary entry point
 */
export default function CvPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to upload page
    router.replace("/cv/upload");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-neutral-500">Redirecting...</p>
    </div>
  );
}

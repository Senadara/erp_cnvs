"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global App Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-destructive">
          Oops! Terjadi Kesalahan Internal
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Aplikasi mengalami kegagalan saat memproses permintaan Anda. Ini biasanya disebabkan oleh database yang tidak terhubung atau konfigurasi server yang belum lengkap.
        </p>
      </div>

      <div className="bg-destructive/10 text-destructive text-left p-4 rounded-md border w-full max-w-2xl overflow-auto text-sm font-mono">
        <strong>Error Message:</strong>
        <br />
        {error.message || "Unknown Error"}
        {error.digest && (
          <>
            <br />
            <br />
            <strong>Digest ID:</strong> {error.digest}
          </>
        )}
        {error.stack && (
          <>
            <br />
            <br />
            <strong>Stack Trace:</strong>
            <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">
              {error.stack}
            </pre>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Coba Lagi
        </Button>
        <Button onClick={() => window.location.href = '/login?clear=1'} variant="outline">
          Kembali ke Login
        </Button>
      </div>
    </div>
  );
}

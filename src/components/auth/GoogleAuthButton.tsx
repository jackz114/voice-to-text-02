"use client";

import { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";

declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        nonce?: string;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: {
          type?: "standard" | "icon";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with" | "signup_with";
          shape?: "rectangular" | "pill" | "circular";
          logo_alignment?: "left" | "center";
          width?: number;
          ux_mode?: "popup" | "redirect";
          redirect_url?: string;
        }
      ) => void;
    };
  };
};

interface CredentialResponse {
  credential?: string;
  select_by?: string;
  client_id?: string;
}

interface GoogleAuthButtonProps {
  redirectTo?: string;
}

function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function GoogleAuthButton({ redirectTo = "/" }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string>("");
  const redirectToRef = useRef<string>(redirectTo);

  // Keep redirectTo latest
  useEffect(() => {
    redirectToRef.current = redirectTo;
  }, [redirectTo]);

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof google !== "undefined") return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error("Failed to load Google Identity Services");
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Google Identity Services and render button
  useEffect(() => {
    if (typeof google === "undefined" || !buttonRef.current) return;

    const nonce = generateNonce();
    nonceRef.current = nonce;

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      callback: async (response: CredentialResponse) => {
        if (!response.credential) return;

        try {
          const { error } = await getSupabaseClient().auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce,
          });

          if (error) throw error;

          window.location.href = redirectToRef.current;
        } catch (error) {
          console.error("Google ID Token login error:", error);
          alert("Google sign in failed, please try again");
        }
      },
      nonce,
    });

    // Use popup mode
    google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 400,
      ux_mode: "popup",
    });
  }, []);

  return (
    <div className="w-full flex items-center justify-center">
      <div
        ref={buttonRef}
        className="flex items-center justify-center"
      />
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, UsersRound, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

// `useSearchParams` opts the component out of static prerendering
// unless it sits under a Suspense boundary. We split the form into
// a child component so the outer page can prerender the chrome
// (background, card frame) while the form hydrates with the query
// string on the client.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  // Forwarded from `/join/<token>` when the visitor already has an
  // account. After a successful sign-in we send them to the join
  // page to accept rather than to /dashboard.
  const inviteToken = searchParams.get("invite");
  const t = useTranslations("LoginPage");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Full-page navigation (not router.push) so the browser issues a
    // fresh top-level request that carries the just-written Supabase
    // auth cookies to the middleware gating /dashboard. A soft
    // client-side navigation can reach the protected route before the
    // server observes the new session, so the middleware bounces it
    // back to /login — which looks like the page "just refreshing"
    // instead of signing in (issue #365). Mirrors the deliberate full
    // reload the invite-accept flow already uses in join/[token].
    const destination = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    window.location.href = destination;
  };

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card">
        {/* <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            {inviteToken ? (
              <UsersRound className="h-6 w-6 text-primary" />
            ) : (
              <MessageSquare className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl text-foreground">
            {inviteToken ? t('titleAccept') : t('titleWelcome')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {inviteToken
              ? t('descAccept')
              : t('descWelcome')}
          </CardDescription>
        </CardHeader> */}
        <CardHeader className="text-center">
          <div className="mb-2 flex w-full justify-center">
            <Image
              src="/sitelogo/jes-bg.png"
              alt="Jaipur Export Surplus"
              width={160}
              height={70}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>

          <CardTitle className="text-xl text-foreground">
            {inviteToken ? t("titleAccept") : t("titleWelcome")}
          </CardTitle>

          <CardDescription className="text-muted-foreground">
            {inviteToken ? t("descAccept") : t("descWelcome")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-muted-foreground">
                {t("emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/30 focus-visible:ring-1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-muted-foreground">
                  {t("passwordLabel")}
                </Label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-border bg-muted pr-10 text-foreground placeholder:text-muted-foreground focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/30 focus-visible:ring-1"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-[#D4AF37]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="mt-2 h-10 w-full cursor-pointer bg-gradient-to-r from-[#C9A227] via-[#D4AF37] to-[#E6C55A] text-black transition-all duration-200 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("signingIn") : t("signIn")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href={
                inviteToken
                  ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                  : "/signup"
              }
              className="text-primary hover:text-primary/80"
            >
              {t("createAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

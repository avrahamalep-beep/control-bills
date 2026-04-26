import { signIn } from "@/auth";
import { t } from "@/lib/i18n";

function hasGoogleOAuth() {
  const id = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const sec = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(id && sec && id.length > 8 && sec.length > 8);
}

function authBaseUrl() {
  const u = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return u.replace(/\/$/, "");
}

export default function Login() {
  const ready = hasGoogleOAuth();
  const id = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const sec = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const hasId = Boolean(id && id.length > 8);
  const hasSec = Boolean(sec && sec.length > 8);
  const callbackLocal = `${authBaseUrl()}/api/auth/callback/google`;
  const callbackProd = "https://control-bills.onrender.com/api/auth/callback/google";

  return (
    <div
      className="flex min-h-dvh items-center justify-center p-6"
      style={{
        background: "linear-gradient(165deg, #c4cea8 0%, #f0e6d4 35%, #faf3e8 100%)",
      }}
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-cream-300 bg-cream-50/95 p-8 shadow-lg">
        <h1 className="text-center text-xl font-semibold text-olive-900">{t.appTitle}</h1>
        <p className="mt-2 text-center text-sm text-olive-600/90">{t.allowedOnly}</p>

        {!ready ? (
          <div
            className="mt-6 space-y-3 rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-sm text-olive-900"
            role="alert"
          >
            <p className="font-semibold">{t.oauthMissingTitle}</p>
            <p className="text-[11px] text-olive-700">
              {hasId && !hasSec ? t.oauthNeedSecretOnly : t.oauthMissingIntro}
            </p>
            <ol className="list-decimal pr-4 text-right text-xs leading-relaxed">
              <li>{t.oauthStepConsole}</li>
              <li>{t.oauthStepCreate}</li>
              <li>
                <strong>{t.oauthStepRedirect}</strong>
                <br />
                <code className="mt-1 block break-all rounded bg-cream-200/80 p-1 text-[11px]">{callbackLocal}</code>
                <span className="mt-1 block text-[11px] text-olive-700">{t.oauthStepRedirectProd}</span>
                <code className="mt-1 block break-all rounded bg-cream-200/80 p-1 text-[11px]">{callbackProd}</code>
              </li>
              <li>
                {t.oauthStepCopy}
                <br />
                <code className="mt-1 block text-[11px]">
                  AUTH_GOOGLE_ID=&quot;...&quot;
                  <br />
                  AUTH_GOOGLE_SECRET=&quot;...&quot;
                </code>
                <span className="mt-1 block text-[11px]">({t.oauthStepAltKeys})</span>
              </li>
              <li>{t.oauthStepRestart}</li>
            </ol>
          </div>
        ) : (
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg bg-olive-800 py-3 text-sm font-medium text-cream-50 shadow-sm hover:bg-olive-900"
            >
              {t.signIn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

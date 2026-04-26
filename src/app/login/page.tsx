import { signIn } from "@/auth";
import { t } from "@/lib/i18n";

function hasGoogleOAuth() {
  const id = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const sec = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(id && sec && id.length > 8 && sec.length > 8);
}

export default function Login() {
  const ready = hasGoogleOAuth();

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
            <p className="font-semibold">Falta configurar Google OAuth</p>
            <p className="text-[11px] text-olive-700">
              No se cargaron <code className="rounded bg-cream-200 px-0.5">AUTH_GOOGLE_ID</code> y{" "}
              <code className="rounded bg-cream-200 px-0.5">AUTH_GOOGLE_SECRET</code> (o{" "}
              <code className="rounded bg-cream-200 px-0.5">GOOGLE_CLIENT_*</code>) en el servidor: crea{" "}
              <code className="rounded bg-cream-200 px-0.5">.env</code> en la raíz del proyecto y reinicia{" "}
              <code className="rounded bg-cream-200 px-0.5">npm run dev</code>.
            </p>
            <ol className="list-decimal pr-4 text-right text-xs leading-relaxed">
              <li>Abre Google Cloud Console → APIs &amp; Services → Credentials.</li>
              <li>Crea &quot;OAuth 2.0 Client ID&quot; (tipo: aplicación web).</li>
              <li>
                En <strong>URI de redirección autorizados</strong> añade exactamente:
                <br />
                <code className="mt-1 block break-all rounded bg-cream-200/80 p-1 text-[11px]">
                  http://localhost:3000/api/auth/callback/google
                </code>
                (y en producción: <code className="text-[11px]">https://tu-dominio.onrender.com/api/auth/callback/google</code>)
              </li>
              <li>
                Copia <strong>ID de cliente</strong> y <strong>Secreto</strong> a tu <code className="rounded bg-cream-200 px-0.5">.env</code>:
                <br />
                <code className="mt-1 block text-[11px]">
                  AUTH_GOOGLE_ID=&quot;...&quot;
                  <br />
                  AUTH_GOOGLE_SECRET=&quot;...&quot;
                </code>
                (También válidos: <code>GOOGLE_CLIENT_ID</code> y <code>GOOGLE_CLIENT_SECRET</code>.)
              </li>
              <li>Reinicia <code className="text-[11px]">npm run dev</code>. En Render, añade las mismas variables al servicio.</li>
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

"use client";

// Последняя линия обороны: срабатывает, только если упал сам корневой
// layout. Он при этом заменяется целиком, поэтому глобальные стили,
// шрифты next/font и Tailwind здесь не работают — вся вёрстка inline,
// шрифт системный serif. Обычные ошибки страниц ловит app/error.tsx.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          color: "#F5F0E8",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <p style={{ letterSpacing: "0.25em", textTransform: "uppercase", fontSize: 14, margin: "0 0 2rem" }}>
            Gastromania
          </p>
          <h1 style={{ fontWeight: 400, fontSize: "clamp(2rem,6vw,3rem)", margin: "0 0 1rem" }}>
            Сайт временно недоступен
          </h1>
          <p style={{ color: "rgba(245,240,232,0.6)", fontFamily: "system-ui, sans-serif", fontSize: 14, lineHeight: 1.6 }}>
            Произошла непредвиденная ошибка. Попробуйте ещё раз или позвоните нам:{" "}
            <a href="tel:+79955552227" style={{ color: "#F5F0E8", whiteSpace: "nowrap" }}>
              +7 995 555-22-27
            </a>
            .
          </p>
          {error.digest && (
            <p style={{ color: "rgba(245,240,232,0.3)", fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
              Код ошибки: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "2rem",
              background: "#8C7355",
              color: "#0A0A0A",
              border: 0,
              borderRadius: 999,
              padding: "14px 28px",
              fontFamily: "system-ui, sans-serif",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}

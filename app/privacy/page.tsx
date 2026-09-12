import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Gastromania",
  description:
    "Как Gastromania собирает, использует и защищает персональные данные гостей при бронировании столика.",
};

const LAST_UPDATED = "22 августа 2026";

const sections = [
  { id: "controller", title: "1. Кто мы" },
  { id: "data", title: "2. Какие данные мы собираем" },
  { id: "purpose", title: "3. Зачем мы их используем" },
  { id: "basis", title: "4. Правовое основание обработки" },
  { id: "sharing", title: "5. Кому передаются данные" },
  { id: "retention", title: "6. Сроки хранения" },
  { id: "cookies", title: "7. Cookies и аналитика" },
  { id: "rights", title: "8. Ваши права" },
  { id: "contact", title: "9. Как с нами связаться" },
  { id: "changes", title: "10. Изменения политики" },
];

export default function PrivacyPage() {
  return (
    <>
      <main className="bg-[#F5F0E8] min-h-screen">
        {/* Minimal page header — not the marketing Navigation, since its
            section links assume homepage anchors that don't exist here. */}
        <header className="border-b border-[#0A0A0A]/8">
          <div className="max-w-screen-xl mx-auto px-8 lg:px-16 h-20 flex items-center justify-between">
            <Link href="/" className="flex flex-col leading-none">
              <span
                style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.25em", fontSize: "0.875rem" }}
                className="text-[#0A0A0A] uppercase"
              >
                Gastromania
              </span>
              <span
                style={{ fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.3em", fontSize: "0.5rem" }}
                className="text-[#8C7355] uppercase mt-0.5"
              >
                Москва · м. Дубровка
              </span>
            </Link>
            <Link
              href="/"
              className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300"
            >
              ← На главную
            </Link>
          </div>
        </header>

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-20 lg:py-28">
          {/* Intro */}
          <div className="max-w-2xl mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-px bg-[#8C7355]" />
              <span className="label-refined text-[#8C7355]">Правовая информация</span>
            </div>
            <h1 className="heading-editorial text-[#0A0A0A] mb-6 break-words" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 1 }}>
              Политика <span className="italic text-[#8C7355]">конфиденциальности</span>
            </h1>
            <p
              style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
              className="text-[#0A0A0A]/60 text-xl italic leading-relaxed"
            >
              Этот документ объясняет, какие данные мы получаем, когда вы бронируете столик,
              и что мы с ними делаем.
            </p>
            <p className="label-refined text-[#0A0A0A]/30 mt-6" style={{ fontSize: "0.6875rem" }}>
              Последнее обновление: {LAST_UPDATED}
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-16">
            {/* Table of contents */}
            <nav aria-label="Содержание" className="lg:col-span-3">
              <div className="lg:sticky lg:top-28 flex flex-col gap-1 pb-2 border-b border-[#0A0A0A]/10 lg:border-b-0">
                <span className="label-refined text-[#0A0A0A]/35 mb-3">Содержание</span>
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-[#0A0A0A]/55 hover:text-[#8C7355] text-sm font-body py-1.5 transition-colors duration-200"
                    style={{ letterSpacing: "0.01em" }}
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </nav>

            {/* Body */}
            <article className="lg:col-span-9 flex flex-col gap-14 max-w-2xl">
              <section id="controller">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  1. Кто мы
                </h2>
                <div className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body space-y-3">
                  <p>
                    Оператором персональных данных, которые вы оставляете на этом сайте, выступает ресторан
                    Gastromania. Полное юридическое наименование, ИНН, ОГРН и адрес регистрации будут
                    опубликованы здесь после завершения оформления юридического лица или ИП.
                  </p>
                  <p>
                    По всем вопросам обработки персональных данных вы можете обратиться к нам — контакты
                    указаны в разделе{" "}
                    <a href="#contact" className="text-[#8C7355] underline underline-offset-2 hover:text-[#0A0A0A] transition-colors">
                      «Как с нами связаться»
                    </a>{" "}
                    ниже.
                  </p>
                </div>
              </section>

              <section id="data">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  2. Какие данные мы собираем
                </h2>
                <div className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body space-y-3">
                  <p>Когда вы оформляете бронирование столика, мы получаем:</p>
                  <ul className="list-disc list-outside pl-5 space-y-1.5 marker:text-[#8C7355]">
                    <li>имя;</li>
                    <li>номер телефона;</li>
                    <li>адрес email — если вы его укажете, это необязательно;</li>
                    <li>дату и время визита;</li>
                    <li>количество гостей;</li>
                    <li>комментарий к брони — если вы его оставите (например, особые пожелания);</li>
                    <li>факт и момент согласия на обработку персональных данных.</li>
                  </ul>
                  <p>
                    Если вы авторизованы на сайте, ваша бронь автоматически связывается с вашей
                    учётной записью и видна вам в личном кабинете.
                  </p>
                </div>
              </section>

              <section id="purpose">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  3. Зачем мы их используем
                </h2>
                <p className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body">
                  Единственная цель — принять, подтвердить и, при необходимости, обсудить с вами
                  бронирование столика: связаться с вами по указанному телефону или email, учесть
                  пожелания из комментария, спланировать рассадку гостей. Мы не используем эти данные
                  для рекламных рассылок и не продаём их третьим лицам.
                </p>
              </section>

              <section id="basis">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  4. Правовое основание обработки
                </h2>
                <p className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body">
                  Мы обрабатываем ваши данные на основании вашего согласия, которое вы даёте, отмечая
                  чекбокс в форме бронирования, и в объёме, необходимом для оказания услуги, о которой вы
                  нас просите (организация визита в ресторан) — в соответствии с Федеральным законом
                  №152-ФЗ «О персональных данных».
                </p>
              </section>

              <section id="sharing">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  5. Кому передаются данные
                </h2>
                <p className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body">
                  Сегодня данные брони хранятся у нашего технического поставщика инфраструктуры баз
                  данных (Supabase) — он выступает исключительно как обработчик, без права
                  самостоятельного использования данных. Мы не передаём ваши данные никаким другим
                  третьим лицам. Если в будущем это изменится — например, появятся новые способы
                  уведомления персонала о брони, — мы обновим этот документ до того, как это заработает.
                </p>
              </section>

              <section id="retention">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  6. Сроки хранения
                </h2>
                <p className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body">
                  Мы храним данные бронирования столько, сколько необходимо для организации вашего
                  визита, и после этого — в течение разумного срока для внутреннего учёта, не дольше, чем
                  того требуют цели обработки. Вы можете в любой момент попросить нас удалить ваши данные
                  раньше — см. раздел «Ваши права».
                </p>
              </section>

              <section id="cookies">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  7. Cookies и аналитика
                </h2>
                <p className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body">
                  На сегодняшний день сайт не использует рекламные или аналитические cookie. Технический
                  cookie сессии устанавливается только в том случае, если вы вошли в личный кабинет. Мы
                  планируем подключить Яндекс.Метрику для анонимной статистики посещаемости — этот
                  документ будет обновлён заранее, до того как это произойдёт.
                </p>
              </section>

              <section id="rights">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  8. Ваши права
                </h2>
                <div className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body space-y-3">
                  <p>В отношении своих персональных данных вы имеете право:</p>
                  <ul className="list-disc list-outside pl-5 space-y-1.5 marker:text-[#8C7355]">
                    <li>запросить их копию;</li>
                    <li>попросить исправить неточности;</li>
                    <li>попросить удалить данные;</li>
                    <li>в любой момент отозвать согласие на обработку.</li>
                  </ul>
                  <p>Чтобы воспользоваться любым из этих прав, напишите нам — контакты ниже.</p>
                </div>
              </section>

              <section id="contact">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  9. Как с нами связаться
                </h2>
                <div className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body space-y-1.5">
                  <p>По вопросам обработки персональных данных звоните:</p>
                  <p>
                    <a href="tel:+79955552227" className="text-[#8C7355] underline underline-offset-2 hover:text-[#0A0A0A] transition-colors">
                      +7 995 555-22-27
                    </a>
                  </p>
                </div>
              </section>

              <section id="changes">
                <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.5rem" }}>
                  10. Изменения политики
                </h2>
                <p className="text-[#0A0A0A]/70 text-[0.9375rem] leading-relaxed font-body">
                  Мы можем обновлять этот документ по мере развития сайта. Дата последнего обновления
                  всегда указана в начале страницы. Существенные изменения, затрагивающие уже
                  собранные данные, мы дополнительно анонсируем на сайте.
                </p>
              </section>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { StacksMarqueeStrip } from "@/features/scroll/components/stacks-marquee-strip";

type StacksSectionProps = {
  locale: AppLocale;
};

export function StacksSection({ locale }: StacksSectionProps) {
  const d = getDictionary(locale);

  return (
    <section
      id="stacks"
      aria-label={d.meta.stacksMarqueeAria}
      className="bg-gray-100 dark:bg-gray-900"
    >
      <div className="overflow-hidden container mx-auto p-4 grid grid-cols-1 gap-8">
        <StacksMarqueeStrip />
      </div>
    </section>
  );
}

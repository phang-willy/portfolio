import { StacksMarqueeStrip } from "@/features/scroll/components/stacks-marquee-strip";

export function StacksSection() {
  return (
    <section id="stacks" className="bg-gray-100 dark:bg-gray-900">
      <div className="overflow-hidden container mx-auto p-4 grid grid-cols-1 gap-8">
        <StacksMarqueeStrip />
      </div>
    </section>
  );
}

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

type DropdownProps = {
  trigger: ReactNode;
  children: (options: { close: () => void }) => ReactNode;
};

export const Dropdown = ({ trigger, children }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border shadow cursor-pointer">
          {children({ close })}
        </div>
      )}
    </div>
  );
};

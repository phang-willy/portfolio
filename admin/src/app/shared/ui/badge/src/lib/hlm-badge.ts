import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        success: 'bg-success/10 text-success',
        outline: 'border-border text-foreground',
        ghost: 'text-muted-foreground',
        link: 'text-primary underline-offset-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Directive({
  selector: '[hlmBadge],hlm-badge',
  host: {
    'data-slot': 'badge',
    '[attr.data-variant]': 'variant()',
  },
})
export class HlmBadge {
  public readonly variant = input<BadgeVariants['variant']>('default');

  constructor() {
    classes(() => badgeVariants({ variant: this.variant() }));
  }
}

import { Pipe, PipeTransform } from '@angular/core';

import { Stack } from '@/app/shared/models/stack.model';

@Pipe({
  name: 'stackName',
  pure: true,
})
export class StackNamePipe implements PipeTransform {
  transform(stacks: readonly Stack[], stackId: string): string {
    return stacks.find((stack) => stack.id === stackId)?.name ?? stackId;
  }
}

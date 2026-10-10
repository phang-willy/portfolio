import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';

export type TiptapBlockType = 'paragraph' | 'h1' | 'h2' | 'h3';

@Component({
  selector: 'app-project-tiptap-toolbar',
  host: { class: 'block' },
  imports: [FormsModule, HlmButtonImports, HlmIcon, NgIcon],
  templateUrl: './project-tiptap-toolbar.html',
})
export class ProjectTiptapToolbarComponent {
  readonly editor = input.required<Editor>();
  readonly codeView = input(false);

  readonly codeViewChange = output<boolean>();

  protected readonly blockType = signal<TiptapBlockType>('paragraph');

  protected readonly blockTypeOptions: ReadonlyArray<{ value: TiptapBlockType; label: string }> = [
    { value: 'paragraph', label: 'Paragraphe' },
    { value: 'h1', label: 'Titre 1' },
    { value: 'h2', label: 'Titre 2' },
    { value: 'h3', label: 'Titre 3' },
  ];

  constructor() {
    effect((onCleanup) => {
      const editor = this.editor();
      const syncBlockType = () => {
        this.blockType.set(this.detectBlockType(editor));
      };

      syncBlockType();
      editor.on('transaction', syncBlockType);
      editor.on('selectionUpdate', syncBlockType);

      onCleanup(() => {
        editor.off('transaction', syncBlockType);
        editor.off('selectionUpdate', syncBlockType);
      });
    });
  }

  protected isActive(name: string, attrs?: Record<string, unknown>): boolean {
    if (this.codeView()) {
      return false;
    }

    const ed = this.editor();
    return attrs ? ed.isActive(name, attrs) : ed.isActive(name);
  }

  protected onBlockTypeChange(value: TiptapBlockType): void {
    this.setBlockType(value);
  }

  protected setBlockType(value: TiptapBlockType): void {
    const editor = this.editor();

    switch (value) {
      case 'h1':
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
      default:
        editor.chain().focus().setParagraph().run();
        break;
    }
  }

  protected toggleBold(): void {
    this.editor().chain().focus().toggleBold().run();
  }

  protected toggleItalic(): void {
    this.editor().chain().focus().toggleItalic().run();
  }

  protected toggleUnderline(): void {
    this.editor().chain().focus().toggleUnderline().run();
  }

  protected toggleBulletList(): void {
    this.editor().chain().focus().toggleBulletList().run();
  }

  protected toggleOrderedList(): void {
    this.editor().chain().focus().toggleOrderedList().run();
  }

  protected setHorizontalRule(): void {
    this.editor().chain().focus().setHorizontalRule().run();
  }

  protected setLink(): void {
    const editor = this.editor();
    const previousUrl = editor.getAttributes('link')['href'] as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  protected unsetLink(): void {
    this.editor().chain().focus().unsetLink().run();
  }

  protected toggleCodeView(): void {
    this.codeViewChange.emit(!this.codeView());
  }

  private detectBlockType(editor: Editor): TiptapBlockType {
    if (editor.isActive('heading', { level: 1 })) {
      return 'h1';
    }

    if (editor.isActive('heading', { level: 2 })) {
      return 'h2';
    }

    if (editor.isActive('heading', { level: 3 })) {
      return 'h3';
    }

    return 'paragraph';
  }
}

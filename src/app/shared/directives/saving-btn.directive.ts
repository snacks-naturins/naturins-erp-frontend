import { Directive, HostBinding, input } from '@angular/core';

@Directive({ selector: 'button[appSavingBtn]', standalone: true })
export class SavingBtnDirective {
  readonly appSavingBtn = input(false);

  @HostBinding('disabled')
  get disabled(): boolean { return this.appSavingBtn(); }

  @HostBinding('class.opacity-60')
  get dimmed(): boolean { return this.appSavingBtn(); }

  @HostBinding('class.cursor-not-allowed')
  get cursor(): boolean { return this.appSavingBtn(); }
}

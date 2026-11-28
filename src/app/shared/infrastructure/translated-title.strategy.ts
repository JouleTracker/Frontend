import { DestroyRef, Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private titleSub?: Subscription;

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.titleSub?.unsubscribe());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleSub?.unsubscribe();
    const titleKey = this.buildTitle(snapshot);
    if (!titleKey) return;

    this.titleSub = this.translate.stream(titleKey).subscribe((translated) => {
      if (translated && translated !== titleKey) {
        this.title.setTitle(translated);
      } else {
        this.title.setTitle(titleKey.startsWith('ROUTES.') ? 'JouleTracker' : titleKey);
      }
    });
  }
}

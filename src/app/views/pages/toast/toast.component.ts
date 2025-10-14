import { Component, forwardRef, Input } from "@angular/core";
import { ProgressComponent, ToastBodyComponent, ToastCloseDirective, ToastComponent, ToastHeaderComponent } from "@coreui/angular";
import { ToastIconComponent } from "./toast-icon.component";

@Component({
  selector: 'app-toast-sample',
  templateUrl: './toast.component.html',
  styles: [
    `
      :host {
        display: block;
        overflow: hidden;
      }
    `
  ],
  providers: [{ provide: ToastComponent, useExisting: forwardRef(() => AppToastComponent) }],
  standalone: true,
  imports: [ToastHeaderComponent, ToastIconComponent, ToastBodyComponent, ToastCloseDirective, ProgressComponent]
})
export class AppToastComponent extends ToastComponent {
  constructor() {
    super();
  }

  @Input() closeButton = true;
  @Input() title = '';
}
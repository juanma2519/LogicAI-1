import { Component } from '@angular/core';

@Component({
  selector: 'toast-sample-icon',
  template: `<svg
    class="rounded me-2"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    focusable="false"
    role="img"
  >
    <rect width="100%" height="100%" fill="#007aff"></rect>
  </svg>`,
  standalone: true
})
export class ToastIconComponent {}
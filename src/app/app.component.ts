import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { CurrentEventService } from './shared/current-event.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'pga-3-balls';

  constructor(private authService: AuthService, private current: CurrentEventService) {}

  ngOnInit(): void {
    if (!!localStorage.getItem("userdata")) {
      this.authService.autoLogin();
      this.current.getCurrentRound()
    }
  }
}

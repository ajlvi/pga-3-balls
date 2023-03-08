import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { AuthComponent } from './auth/auth.component';
import { AccountComponent } from './account/account.component';
import { GroupsUpdateComponent } from './account/groups-update/groups-update.component';
import { HandleUpdateComponent } from './account/handle-update/handle-update.component';
import { PasswordUpdateComponent } from './account/password-update/password-update.component';
import { MakePicksComponent } from './make-picks/make-picks.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { PickHistoryComponent } from './pick-history/pick-history.component';
import { AuthInterceptorService } from './auth/auth-interceptor.service';
import { TimePipe } from './make-picks/time.pipe';
import { GroupConfigComponent } from './account/groups-update/group-config/group-config.component';
import { AddGroupComponent } from './account/groups-update/add-group/add-group.component';
import { LifetimePipe } from './pick-history/lifetime.pipe';
import { PercentagePipe } from './pick-history/percentage.pipe';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AuthComponent,
    AccountComponent,
    GroupsUpdateComponent,
    HandleUpdateComponent,
    PasswordUpdateComponent,
    MakePicksComponent,
    LeaderboardComponent,
    PickHistoryComponent,
    TimePipe,
    LifetimePipe,
    PercentagePipe,
    GroupConfigComponent,
    AddGroupComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

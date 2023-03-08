import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AccountComponent } from "./account/account.component";
import { GroupsUpdateComponent } from "./account/groups-update/groups-update.component";
import { HandleUpdateComponent } from "./account/handle-update/handle-update.component";
import { PasswordUpdateComponent } from "./account/password-update/password-update.component";
import { AuthComponent } from "./auth/auth.component";
import { AuthGuard } from "./auth/auth.guard";
import { LeaderboardComponent } from "./leaderboard/leaderboard.component";
import { MakePicksComponent } from "./make-picks/make-picks.component";
import { PickHistoryComponent } from "./pick-history/pick-history.component";

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: '/make-picks',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        component: AuthComponent
    },
    {
        path: 'account',
        component: AccountComponent,
        canActivate: [AuthGuard],
        children: [
            { path: 'display-name', component: HandleUpdateComponent },
            { path: 'password-change', component: PasswordUpdateComponent },
            { path: 'groups', component: GroupsUpdateComponent}
        ]
    },
    {
        path: 'leaderboard',
        component: LeaderboardComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'make-picks',
        component: MakePicksComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'pick-history',
        component: PickHistoryComponent,
        canActivate: [AuthGuard]
    }
]

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth.guard'
import { LoginGuard } from './login.guard'

import { LoginComponent } from './login/login.component'
import { RegisterComponent } from './register/register.component'
import { PageNotFoundComponent } from './page-not-found/page-not-found.component'
import { MainAppComponent } from './main-app/main-app.component';
import { HomeComponent } from './home/home.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MarketBoardComponent } from './market/market-board/market-board.component';

const routes: Routes = [
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  { path: 'app', component: MainAppComponent, canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home', // child route path
        component: HomeComponent, // child route component that the router renders
      },
      {
        path: 'editProfile',
        component: EditProfileComponent,
      },
      {
        path: 'market',
        component: MarketBoardComponent,
      }
    ]
  },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard]},
  { path: '**', component: PageNotFoundComponent },  // Wildcard route for a 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth.guard'
import { MarketpublishGuard } from './market/marketpublish.guard'
import { MarketEditGuard } from './market/market-edit.guard'
import { BandPublishGuard } from './band/band-publish.guard'
import { SeratePublishGuard } from './serate/serate-publish.guard';
import { LoginGuard } from './login.guard'

import { LoginComponent } from './login/login.component'
import { RegisterComponent } from './register/register.component'
import { PageNotFoundComponent } from './page-not-found/page-not-found.component'
import { MainAppComponent } from './main-app/main-app.component';
import { HomeComponent } from './home/home.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MarketBoardComponent } from './market/market-board/market-board.component';
import { MarketEditComponent } from './market/market-edit/market-edit.component';
import { MarketPublishComponent } from './market/market-publish/market-publish.component';
import { BandBoardComponent } from './band/band-board/band-board.component';
import { BandEditComponent } from './band/band-edit/band-edit.component';
import { BandPublishComponent } from './band/band-publish/band-publish.component';
import { SerateBoardComponent } from './serate/serate-board/serate-board.component';
import { SerateEditComponent } from './serate/serate-edit/serate-edit.component';
import { SeratePublishComponent } from './serate/serate-publish/serate-publish.component';

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
      },
      {
        path: 'marketEdit',
        component: MarketEditComponent, canActivate: [MarketEditGuard]
      },
      {
        path: 'marketPublish',
        component: MarketPublishComponent, canActivate: [MarketpublishGuard]
      },
      {
        path: 'band',
        component: BandBoardComponent,
      },
      {
        path: 'bandEdit',
        component: BandEditComponent, canActivate: [BandPublishGuard]
      },
      {
        path: 'bandPublish',
        component: BandPublishComponent, canActivate: [BandPublishGuard]
      },
      {
        path: 'serate',
        component: SerateBoardComponent,
      },
      {
        path: 'serateEdit',
        component: SerateEditComponent, canActivate: [SeratePublishGuard]
      },
      {
        path: 'seratePublish',
        component: SeratePublishComponent, canActivate: [SeratePublishGuard]
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

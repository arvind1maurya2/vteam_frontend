import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path: 'home',
  //   loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  // },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule)
  },
  {
    path: 'calling',
    loadChildren: () => import('./pages/calling/calling.module').then( m => m.CallingPageModule)
  },
  {
    path: 'contact',
    loadChildren: () => import('./pages/contact/contact.module').then( m => m.ContactPageModule)
  },
  {
    path: 'footer',
    loadChildren: () => import('./pages/core/footer/footer.module').then( m => m.FooterPageModule)
  },
  {
    path: 'header',
    loadChildren: () => import('./pages/core/header/header.module').then( m => m.HeaderPageModule)
  },
  {
    path: 'nodata',
    loadChildren: () => import('./pages/nodata/nodata.module').then( m => m.NodataPageModule)
  },
  {
    path: 'securedvdo',
    loadChildren: () => import('./pages/securedvdo/securedvdo.module').then( m => m.SecuredvdoPageModule)
  },
  {
    path: 'standardvdo',
    loadChildren: () => import('./pages/standardvdo/standardvdo.module').then( m => m.StandardvdoPageModule)
  },
  {
    path: 'video',
    loadChildren: () => import('./pages/video/video.module').then( m => m.VideoPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

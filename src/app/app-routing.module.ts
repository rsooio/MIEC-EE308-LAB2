import { RemoteGameComponent } from './game/remote-game/remote-game.component';
import { LocalGameComponent } from './game/local-game/local-game.component';
import { MenuComponent } from './menu/menu.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  { path: 'menu', component: MenuComponent },
  { path: 'game/local', component: LocalGameComponent },
  { path: 'game/:id', component: RemoteGameComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

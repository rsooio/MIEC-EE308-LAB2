import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { Dice3dComponent } from './dice/dice3d/dice3d.component';
import { LocalGameComponent } from './game/local-game/local-game.component';
import { RemoteGameComponent } from './game/remote-game/remote-game.component';


@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    Dice3dComponent,
    LocalGameComponent,
    RemoteGameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

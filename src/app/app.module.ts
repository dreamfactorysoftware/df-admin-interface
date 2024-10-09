import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DebugComponent } from './debug/debug.component';
// ... other imports

@NgModule({
  declarations: [
    AppComponent,
    DebugComponent,
    // ... other components
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    // ... other modules
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

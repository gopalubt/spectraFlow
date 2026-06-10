import { Routes } from '@angular/router';
import { ExperimentDesignerComponent } from './features/experiment-designer/experiment-designer.component';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'designer', pathMatch: 'full' },
  { path: 'designer', component: ExperimentDesignerComponent },
  { path: 'login', component: LoginComponent }
];

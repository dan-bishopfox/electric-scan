/*
  Electric Scan
  Copyright (C) 2019  Bishop Fox
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { HistoryComponent } from './components/history/history.component';
import { ViewComponent } from './components/view/view.component';
import { NewComponent } from './components/new/new.component';
import { AllComponent } from './components/view/children/all/all.component';
import { EyeballComponent } from './components/view/children/eyeball/eyeball.component';
import { ResemblesComponent } from './components/view/children/resembles/resembles.component';


const routes: Routes = [

    { path: 'scan/history', component: HistoryComponent },
    { path: 'scan/new', component: NewComponent },
    { path: 'scan/view/:scan-id', component: ViewComponent,
      children: [
        { path: '', redirectTo: 'all', pathMatch: 'full' },
        { path: 'all', component: AllComponent },
        { path: 'eyeball', component: EyeballComponent },
        { path: 'resembles', component: ResemblesComponent },
      ]
    },

];

export const ScanModuleRouting: ModuleWithProviders<any> = RouterModule.forChild(routes);


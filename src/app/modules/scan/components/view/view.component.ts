import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';


import { FadeInOut } from '@app/shared/animations';
import { ScannerService, Scan } from '@app/providers/scanner.service';


@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  animations: [FadeInOut]
})
export class ViewComponent implements OnInit {

  scanId: string;
  scan: Scan;
  private _scanSub: Subscription;

  constructor(private _route: ActivatedRoute,
              private _scannerService: ScannerService) { }

  ngOnInit() {
    this._route.params.subscribe((params) => {
      this.scanId = params['scan-id'];
      console.log(`ScanID = '${this.scanId}'`);
      this.fetchScan();
      this._scanSub = this._scannerService.scans$.subscribe((scan) => {
        if (scan.id === this.scanId) {
          this.fetchScan();
        }
      });
    });
  }

  ngOnDestroy() {
    this._scanSub.unsubscribe();
  }

  isComplete(): boolean {
    return this.scan ? this.scan.duration !== -1 : false;
  }

  async fetchScan() {
    console.log('Fetching scan data ...');
    this.scan = await this._scannerService.GetScan(this.scanId);
    console.log(this.scan);
  }

  results() {
    return this.scan ? this.scan.results.filter(r => r !== null) : [];
  }

}

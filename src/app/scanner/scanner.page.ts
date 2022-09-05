import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
})
export class ScannerPage implements OnInit {

  constructor(private router: Router) {
    console.log("constructor");

  }

  close(){
    this.router.navigate(['/home'],{
      state: {
        mrzRawText:"Not found"
      }
    });
  }

  onMRZRead(txt:string) {
    this.router.navigate(['/home'],{
      state: {
        mrzRawText:txt
      }
    });
  }

  ngOnInit() {
    
  }
}

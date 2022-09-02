import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  mrzRawText:string;
 
  constructor(private router: Router) {

  }

  ionViewWillEnter(){
    console.log("ionViewWillEnter");
    if (history.state.mrzRawText) {
        this.mrzRawText = history.state.mrzRawText;
        console.log("result:"+this.mrzRawText);
    }
  }

  navigate(){
    this.router.navigate(['/scanner'],{});
  }
}

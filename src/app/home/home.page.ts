import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GCDWebServer } from '@awesome-cordova-plugins/gcdwebserver';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  mrzRawText:string;
 
  constructor(private router: Router) {
    console.log(router);
  }

  async ngOnInit(){
    console.log("init");
    console.log("start server in background");
    const result = await GCDWebServer.startServer({port:51402,folder:"www"});
    console.log(result)
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

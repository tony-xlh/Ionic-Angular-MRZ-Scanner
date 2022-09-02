import { Component, OnInit, ViewChild } from '@angular/core';
import { CameraEnhancer, DrawingItem } from 'dynamsoft-camera-enhancer';
import { LabelRecognizer } from 'dynamsoft-label-recognizer';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/';

@Component({
  selector: 'app-mrzscanner',
  templateUrl: './mrzscanner.component.html',
  styleUrls: ['./mrzscanner.component.scss'],
})
export class MRZScannerComponent implements OnInit {
  pRecognizer = null;
  pCameraEnhancer = null;

  @ViewChild('container') container: any;
  constructor() { 
  }

  ngOnInit() {
    this.checkPermission();
  }

  async checkPermission(){
    const cameraPermissionResult:boolean = await this.hasCameraPermission();
    if (cameraPermissionResult === false) {
      const response = await this.requestCameraPermission();
      console.log(response);
      if (response === true) {
        this.startScanning();
      }
    }else{
      this.startScanning();
    }
  }

  async hasCameraPermission():Promise<boolean> {
    const response = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.CAMERA);
    return response.hasPermission;
  }

  async requestCameraPermission():Promise<boolean> {
    const response = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.CAMERA);
    return response.hasPermission;
  }

  async startScanning(){
    try {
      let cameraEnhancer = await (this.pCameraEnhancer = CameraEnhancer.createInstance());
      await cameraEnhancer.setUIElement((this as any).container.nativeElement);
      LabelRecognizer.onResourcesLoadStarted = () => { console.log('load started...'); }
      LabelRecognizer.onResourcesLoadProgress = (resourcesPath, progress)=>{
          console.log("Loading resources progress: " + progress.loaded + "/" + progress.total);
      };
      LabelRecognizer.onResourcesLoaded = () => { console.log('load ended...'); }
      let recognizer = await (this.pRecognizer = LabelRecognizer.createInstance());

      await recognizer.setImageSource(cameraEnhancer, {resultsHighlightBaseShapes: DrawingItem});
      await recognizer.updateRuntimeSettingsFromString("video-numberletter");

      await recognizer.startScanning(true);


      // Callback to MRZ recognizing result
      recognizer.onMRZRead = (txt: string, results: any) => {
        console.log("MRZ text: ",txt);
        console.log("MRZ results: ", results);
      }

    } catch (ex) {
      let errMsg: string;
      if (ex.message.includes("network connection error")) {
        errMsg = "Failed to connect to Dynamsoft License Server: network connection error. Check your Internet connection or contact Dynamsoft Support (support@dynamsoft.com) to acquire an offline license.";
      } else {
        errMsg = ex.message||ex;
      }
      console.error(errMsg);
      alert(errMsg);
    }
  }
  
  async ngOnDestroy() {
    if (this.pRecognizer) {
      await (await this.pRecognizer).destroyContext();
      (await this.pCameraEnhancer).dispose();
      console.log('VideoRecognizer Component Unmount');
    }
  }

}

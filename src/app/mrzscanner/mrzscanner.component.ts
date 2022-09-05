import { Component, EventEmitter, Input, OnInit, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CameraEnhancer, DrawingItem } from 'dynamsoft-camera-enhancer';
import { LabelRecognizer } from 'dynamsoft-label-recognizer';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/';

LabelRecognizer.engineResourcePath = "/assets/dlr/";
CameraEnhancer.engineResourcePath = "/assets/dce/";

@Component({
  selector: 'app-mrzscanner',
  templateUrl: './mrzscanner.component.html',
  styleUrls: ['./mrzscanner.component.scss'],
  outputs: ['onMRZRead']
})
export class MRZScannerComponent implements OnInit {
  @Input() license?:string
  pRecognizer = null;
  pCameraEnhancer = null;
  onMRZRead = new EventEmitter<string>();
  @ViewChild('container') container: any;
  constructor(public platform: Platform) { 
  }

  ngOnInit() {
    if (this.license) {
      LabelRecognizer.license = this.license;
    }else{
      LabelRecognizer.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
    }

    if (this.platform.is("android")) {
      this.checkPermission();
    }
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
      await recognizer.updateRuntimeSettingsFromString("video-mrz");

      await recognizer.startScanning(true);
      
      // Callback to MRZ recognizing result
      recognizer.onMRZRead = (txt: string, results: any) => {
        console.log("MRZ text: ",txt);
        console.log("MRZ results: ", results);
        if (this.onMRZRead) {
          const valid = this.validateMRZ(txt);
          if (valid === true) {
            this.onMRZRead.emit(txt);
          }else {
            console.log("Invalid mrz code.");
          }
        }
      }

    } catch (ex) {
      let errMsg: string;
      if (ex.message.includes("network connection error")) {
        errMsg = "Failed to connect to Dynamsoft License Server: network connection error. Check your Internet connection or contact Dynamsoft Support (support@dynamsoft.com) to acquire an offline license.";
      } else {
        errMsg = ex.message||ex;
      }
      console.log(ex);
      console.error(errMsg);
      alert(errMsg);
    }
  }

  validateMRZ(mrzText:string) {
    const parse = require('mrz').parse;
    let mrz = mrzText.split("\n");
    const result = parse(mrz);
    return result.valid;
  }
  
  async ngOnDestroy() {
    if (this.pRecognizer) {
      await (await this.pRecognizer).destroyContext();
      (await this.pCameraEnhancer).dispose();
      console.log('VideoRecognizer Component Unmount');
    }
  }

}

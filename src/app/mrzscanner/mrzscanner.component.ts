import { Component, EventEmitter, Input, OnInit, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CameraEnhancer, DrawingItem } from 'dynamsoft-camera-enhancer';
import { LabelRecognizer } from 'dynamsoft-label-recognizer';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/';

@Component({
  selector: 'app-mrzscanner',
  templateUrl: './mrzscanner.component.html',
  styleUrls: ['./mrzscanner.component.scss'],
  outputs: ['onMRZRead']
})
export class MRZScannerComponent implements OnInit {
  @Input() DLREngineResourcePath?:string;
  @Input() DCEEngineResourcePath?:string;
  @Input() license?:string;
  recognizer:LabelRecognizer = null;
  cameraEnhancer:CameraEnhancer = null;
  onMRZRead = new EventEmitter<string>();
  @ViewChild('container') container: any;
  constructor(public platform: Platform) {
    
  }

  ngOnInit() {
    if (this.platform.is("android")) {
      this.checkPermission();
    }else{
      this.startScanning();
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
      this.configure();
      let cameraEnhancer = await CameraEnhancer.createInstance();
      await cameraEnhancer.setUIElement((this as any).container.nativeElement);

      LabelRecognizer.onResourcesLoadStarted = () => { console.log('load started...'); }
      LabelRecognizer.onResourcesLoadProgress = (resourcesPath, progress)=>{
          console.log("Loading resources progress: " + progress.loaded + "/" + progress.total);
      };
      LabelRecognizer.onResourcesLoaded = () => { console.log('load ended...'); }
      let recognizer = await LabelRecognizer.createInstance();

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
      this.cameraEnhancer = cameraEnhancer;
      this.recognizer = recognizer;

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
    if (this.recognizer) {
      await this.recognizer.destroyContext();
      this.cameraEnhancer.dispose(false);
      this.recognizer = null;
      this.cameraEnhancer = null;
      console.log('VideoRecognizer Component Unmount');
    }
  }

  configure(){
    let pDLR: any = LabelRecognizer;
    if (pDLR._pLoad.isFulfilled === false) {
      if (this.DLREngineResourcePath) {
        LabelRecognizer.engineResourcePath = this.DLREngineResourcePath;
      }else{
        LabelRecognizer.engineResourcePath = this.getDefaultDLREngineResourcePath();
      }
      if (this.DCEEngineResourcePath) {
        CameraEnhancer.engineResourcePath = this.DCEEngineResourcePath;
      }else{
        CameraEnhancer.engineResourcePath = this.getDefaultDCEEngineResourcePath();
      }
      if (this.license) {
        LabelRecognizer.license = this.license;
      }else{
        LabelRecognizer.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
      }
    }
  }

  getDefaultDLREngineResourcePath():string{
    if (this.platform.is("ios")) {
      return "https://cdn.jsdelivr.net/npm/dynamsoft-label-recognizer@2.2.11/dist/";
    }
    return "/assets/dlr/";
  }

  getDefaultDCEEngineResourcePath():string{
    if (this.platform.is("ios")) {
      return "https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@3.0.1/dist/";
    }
    return "/assets/dce/";
  }
}

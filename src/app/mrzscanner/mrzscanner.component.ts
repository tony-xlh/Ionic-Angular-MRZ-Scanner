import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CameraEnhancer, DrawingItem } from 'dynamsoft-camera-enhancer';
import { LabelRecognizer } from 'dynamsoft-label-recognizer';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/';

LabelRecognizer.engineResourcePath = "/assets/dlr/";

/** LICENSE ALERT - README
 * To use the library, you need to first specify a license key using the API "license" as shown below.
 */
LabelRecognizer.license = "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9";
/**
 * You can visit https://www.dynamsoft.com/customer/license/trialLicense?utm_source=github&product=dlr&package=js to get your own trial license good for 30 days.
 * Note that if you downloaded this sample from Dynamsoft while logged in, the above license key may already be your own 30-day trial license.
 * For more information, see https://www.dynamsoft.com/label-recognition/programming/javascript/user-guide.html?ver=latest#specify-the-license or contact support@dynamsoft.com.
 * LICENSE ALERT - THE END
 */
CameraEnhancer.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@3.0.1/dist/";

@Component({
  selector: 'app-mrzscanner',
  templateUrl: './mrzscanner.component.html',
  styleUrls: ['./mrzscanner.component.scss'],
  outputs: ['onMRZRead']
})
export class MRZScannerComponent implements OnInit {
  pRecognizer = null;
  pCameraEnhancer = null;
  onMRZRead = new EventEmitter<string>();
  @ViewChild('container') container: any;
  constructor(public platform: Platform) { 
  }

  ngOnInit() {
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

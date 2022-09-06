# Ionic-Angular-MRZ-Scanner

An Ionic angular demo using the [Dynamsoft Label Recognizer](https://www.dynamsoft.com/label-recognition/overview/) to recognize the text of MRZ. The project is based on Cordova.

How to run:

1. npm install

2. You can set up your own license in the `src\app\scanner\scanner.page.html` file.

   ```html
   <app-mrzscanner
     license="DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="
     (onMRZRead)="onMRZRead($event)"
   ></app-mrzscanner>
   ```
   
   [Apply for a trial license of Dynamsoft Label Recognizer](https://www.dynamsoft.com/customer/license/trialLicense/?product=dlr).
   

3. Add platforms: 

   ```
   ionic cordova platforms add android
   ionic cordova platforms add ios
   ```
   
4. Prepare the project for platforms:

   ```
   ionic cordova prepare android
   ionic cordova prepare ios
   ```
   
5. Use Android Studio and Xcode to open and run the project.


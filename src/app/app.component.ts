import { Component } from '@angular/core';
import { FCM } from './../../plugins/cordova-plugin-fcm-with-dependecy-updated/src/ionic/ngx/FCM';
import { GeneralService } from './providers/general.service';
import { AlertController, MenuController, NavController, Platform } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { NgxPermissionsService } from 'ngx-permissions';
import { Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  perm = ["ADMIN", "MEDIA", "VIDEO_CAPTURE", "AUDIO_CAPTURE"];
  user: any;

  constructor(
    public alertController: AlertController,
    public platform: Platform,
    public permissionsService: NgxPermissionsService,
    private androidPermissions: AndroidPermissions,
    public menuCtrl: MenuController,
    public nav: NavController,
    public general: GeneralService,
    public router: Router,
    public fcm: FCM
  ){

      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
         result => console.log('Has permission?',result.hasPermission),
         err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
     );

      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then(
         result => console.log('Has record audio permission?', result.hasPermission),
         err => {
           this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then((data: any) => {
             if (data.hasPermission) {
              console.log("have record audio permission");
             }
           });
         }
     );

      this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA, this.androidPermissions.PERMISSION.RECORD_AUDIO, this.androidPermissions.PERMISSION.GET_ACCOUNTS]);

      this.platform.ready().then(()=>{
         this.user = this.general.currentUser;

         // get FCM token
         this.fcm.getToken().then(token => {
           console.log(token);
         });

         // ionic push notification example
         this.fcm.onNotification().subscribe(data => {
           console.log(data);
           if (data.wasTapped) {
             // alert('Received in background');
             //Received in background*
             console.log("&&");
             console.log(data.caller);
             this.takeCall(data.caller);
           } else {
             // console.log('Received in foreground');
             // "Received in foreground"
             console.log("&");
             console.log(data.caller);
             this.takeCall(data.caller);
           }
         });

         // refresh the FCM token
         this.fcm.onTokenRefresh().subscribe(token => {
           console.log(token);
         });

         this.fcm.subscribeToTopic("all");
         // unsubscribe from a topic
         // this.fcm.unsubscribeFromTopic('offers');

    });
  }

  async showAlertInfo(msg) {
    this.general.showAlert(msg);
  }

  initializeApp() {
     this.permissionsService.loadPermissions(this.perm);
     this.checkpermission();

     this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      // this.splashScreen.hide();


    });
  }

  takeCall(repsonder_name){
     // let message = title.split(":");
     // let otherparticipant = message[1];
     console.log("in takecall");
     let navigationExtras: NavigationExtras = {
     state: {
        // j'envoi mon nom
        call_participant: repsonder_name
     }
    };
    // this.nav.navigateRoot('call',navigationExtras);
    this.router.navigate(['call'], navigationExtras);
  }

  async checkpermission(){

  this.permissionsService.hasPermission(this.perm).then(success => {
     if( success ) {

      if( this.platform.is("android") ) {

         this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA,
           this.androidPermissions.PERMISSION.RECORD_AUDIO,
           this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE,
           this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE]).then( (result: any) => {
           if( result.hasPermission )
             console.log ("permission granted")// this.start()
           else
             console.log('Permission error')
         }, err => {
           console.log('Media Device Permission Not Granted')
         })

      } else {
         console.log("other platform") //
      }

     } else {
      this.permissionsService.loadPermissions(this.perm)
      this.permissionsService.hasPermission(this.perm).then(success => {
         if( success ) {
          console.log ("permission granted")// this.start()
         } else {
           console.log('Permission error')
         }
      })
     }
  })
}


}

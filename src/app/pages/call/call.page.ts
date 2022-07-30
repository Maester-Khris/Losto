import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { MessagingService } from '../../services/messaging.service';
import { StreamService } from '../../services/stream.service';
// import { NativeAudio } from '@ionic-native/native-audio/ngx';

@Component({
  selector: 'app-call',
  templateUrl: './call.page.html',
  styleUrls: ['./call.page.scss'],
})
export class CallPage implements OnInit {

 person:string='Frank';
 userName = '';
 hideBtns = true;

 constructor(
     public stream: StreamService, public api: ApiService,
     public message: MessagingService, private route: ActivatedRoute,
     private router: Router,
     //  private nativeAudio: NativeAudio
   ){

   // this.nativeAudio
   //   .preloadComplex('track1', 'assets/audio/track_call.mp3', 1, 1, 0)
   //   .then(this.onSuccessPreloading, this.onError);

   this.stream.updateUserInfo.subscribe(async (id) => {
      if (id) {
       const user = await this.message.rtmclient.getUserAttributes(id.toString()); // senderId means uid getUserInfo

       for (let index = 0; index < this.stream.remoteUsers.length; index++) {
          const element = this.stream.remoteUsers[index];
          if (element.uid == id) {
            element.name = user.name;
          }
       }
      }
   });

   this.route.queryParams.subscribe(params => {

      if (this.router.getCurrentNavigation().extras.state) {
       this.person =  this.router.getCurrentNavigation().extras.state.call_participant;
       this.startCall();
      }

   });

 }

 ngOnInit() {

 }

 ionViewDidEnter(){
   console.log("success preloading");
   var audio = new Audio("assets/audio/track1.mp3");
   audio.play();
}

//  onSuccessPreloading = data => {
//   console.log("success preloading", data);
//   this.nativeAudio.play("track1");
//   this.nativeAudio.loop("track1").then(this.onSuccess, this.onError);
// };

onSuccess(){
   console.log("success looping song");
}
onError(){
   console.log("something went wrong with song");
}

// ngOnDestroy() {
//    this.nativeAudio.unload('track1');
//  }

 async startCall() {
   if (this.person) {
      const uid = this.generateUid();
      const rtcDetails = await this.generateTokenAndUid(uid);
      // rtm
      await this.rtmUserLogin(uid);

      // rtc
      this.stream.createRTCClient();
      this.stream.agoraServerEvents(this.stream.rtc);
      await this.stream.localUser(rtcDetails.token, uid);
      console.log('yo he strema');
      var localvideo= document.getElementById("local-player") ;
      var myvid= localvideo.querySelector("video") as HTMLVideoElement;
      myvid.className += " my_local_video_class";
      myvid.volume=0;
      myvid.muted=true;

      var rmvideo= document.getElementById("remote-videos") ;
      var rmvid= rmvideo.querySelector("video") as HTMLVideoElement;
      rmvid.className += " remote_video_class";
      this.hideBtns = false;
   }
   else {
      alert('Enter name to start call');
   }
 }

 // rtc token
 async generateTokenAndUid(uid) {
   // https://test-agora.herokuapp.com/access_token?channel=test&uid=1234
   let url = 'https://test-agora.herokuapp.com/access_token?';
   const opts = { params: new HttpParams({ fromString: "channel=test&uid=" + uid }) };
   const data = await this.api.getRequest(url, opts.params).toPromise();
   return { 'uid': uid, token: data['token'] }

 }

 async generateRtmTokenAndUid(uid) {
   // https://sharp-pouncing-grass.glitch.me/rtmToken?account=1234
   let url = 'https://sharp-pouncing-grass.glitch.me/rtmToken?';
   const opts = { params: new HttpParams({ fromString: "account=" + uid }) };
   const data = await this.api.getRequest(url, opts.params).toPromise();
   return { 'uid': uid, token: data['key'] }

 }

 generateUid() {
   const length = 5;
   const randomNo = (Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)));
   return randomNo;
 }


 async rtmUserLogin(uid) {



   this.message.rtmclient = this.message.createRTMClient();

   this.message.channel = this.message.createRtmChannel(this.message.rtmclient);
   const rtmDetails = await this.generateRtmTokenAndUid(uid);

   await this.message.signalLogin(this.message.rtmclient, rtmDetails.token, uid.toString());
   await this.message.joinchannel(this.message.channel);
   await this.message.setLocalAttributes(this.message.rtmclient, this.person)
   this.message.RTMevents(this.message.rtmclient);
   this.message.receiveChannelMessage(this.message.channel, this.message.rtmclient);

 }

 peertopeer() {
   this.message.sendOneToOneMessage(this.message.rtmclient, this.stream.remoteUsers[0].uid.toString())
 }

 channelMsg() {
   this.message.sendMessageChannel(this.message.channel);
 }



 async rtmclientChannelLogout() {
   await this.stream.leaveCall();
   this.message.leaveChannel(this.message.rtmclient, this.message.channel);
   this.person = '';
   this.router.navigate(['/tab-nav/home']);
 }


}

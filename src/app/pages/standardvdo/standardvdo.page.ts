import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';
import adapter from 'webrtc-adapter';
import Janus from './../../../assets/js/janus/index.js';
import { Toast } from '@ionic-native/toast/ngx';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { SpinnerDialog } from '@ionic-native/spinner-dialog/ngx';
import { interval, Subscription} from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-standardvdo',
  templateUrl: './standardvdo.page.html',
  styleUrls: ['./standardvdo.page.scss'],
})
export class StandardvdoPage implements OnInit {

  @BlockUI() blockUI: NgBlockUI;

  constructor(public globals: Globals, private toast: Toast, private spinnerDialog: SpinnerDialog, private toastr: ToastrService) { }

  randomString:(len: number)  => string = function (len: number) {
    return Math.random().toString(36).substring(2, 3+len) + Math.random().toString(36).substring(2, 3+len);
  }

  server:string = "/janus";
  opaqueId = "vteamroom-"+this.randomString(12);
  streaming = null;
  selectedStream = null;
  janus = null;
  janusPluginHandler = null;
  myroom = "76882";	// Demo room
  myusername = null;
  myid = null;
  mystream = null;
  // We use this other ID just to map our subscriptions to us
  mypvtid = null;
  serverInitialized:boolean= false;
  eventsAttached:boolean= false;
  mySubscription:Subscription;

  feeds = [];
  bitrateTimer = [];
  roomNames = ["San Fransisco Conference Room","Paris Conference Room","Toronto Conference Room","Hong Kong Conference Room","London Conference Room", "New Delhi Conference Room","Geneva Conference Room", "Mumbai Conference Room", "New York Conference Room", "Philadelphia Conference Room"];
  
  ngOnInit() {
    this.initialize();
    $( "#videocall" ).on("shown.bs.modal", (e) => {
      this.startVideoCall();
    });  
  }

  ngAfterViewInit() {
    $( "#videocall" ).on('modal.shown', () => {
      alert('Modal is shown!');
    });
  }

  showToast = function(message: string, title: string) {
    this.toastr.success(message, title, {
      timeOut: 3000,
    });
  }
  
  // Helper to parse query string
  getQueryStringValue = function (name: any) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  doSimulcast = (this.getQueryStringValue("simulcast") === "yes" || this.getQueryStringValue("simulcast") === "true");
  doSimulcast2 = (this.getQueryStringValue("simulcast2") === "yes" || this.getQueryStringValue("simulcast2") === "true");

  attachJanusEvent = function() {
    //Attach to VideoRoom plugin
    this.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: this.opaqueId,
      
      success: (pluginHandle: any) => {
        $('#details').remove();
        this.janusPluginHandler = pluginHandle;
        Janus.log("Plugin attached! (" + this.janusPluginHandler.getPlugin() + ", id=" + this.janusPluginHandler.getId() + ")");
        var list = {"request" : "list"};
        console.log(list);
        //var create = { "request": "create", "description": desc, "bitrate": 500000, "publishers": 1 };
        
        this.janusPluginHandler.send({"message": list, success: (result: any) => {
          var eventlist = result["list"];
          Janus.debug("Event: " + eventlist);
          var options = '';

          for (var i = 0; i < eventlist.length && i < 11; i++) {
           options += '<option value="' + eventlist[i]["room"]+ '">' + this.roomNames[i] + '</option>';
          }
          $("#room").html(options);
          $('#startVideo').prop('disabled', false);
          $('#myvideo').removeClass('hide').show();
        }});

        Janus.log("Plugin attached! (" + this.janusPluginHandler.getPlugin() + ", id=" + this.janusPluginHandler.getId() + ")");
        Janus.log("  -- This is a publisher/manager");
        // Prepare the username registration
        $('#videojoin').removeClass('hide').show();
        $('#registernow').removeClass('hide').show();
        $('#register').click(this.startVideoCall);
          

        $('#username').focus();
        $('#start').removeAttr('disabled').html("Stop")
          .click(() => {
            $(this).prop('disabled', true);
            this.janus.destroy();
          });
      },
      error: (error: any) => {
        Janus.error("  -- Error attaching plugin...", error);
        //bootbox.alert("Error attaching plugin... " + error);
      },
      consentDialog: (on: any) => {
        Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
        if(on) {
          // Darken screen and show hint
          this.blockUI.start({
            message: '<div><img src="assets/images/up_arrow.png"/></div>',
            css: {
              border: 'none',
              padding: '15px',
              backgroundColor: 'transparent',
              color: '#aaa',
              top: '10px',
              left: '300px'
            } });
        } else {
          // Restore screen
          this.blockUI.stop();
        }
      },
      mediaState: (medium : any, on: any) => {
        Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
      },
      webrtcState: (on: any) => {
        Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        $("#videolocal").parent().parent().attr("display", "inline");
        if(!on)
          return;
        $('#publish').remove();
        // This controls allows us to override the global room bitrate cap
        $('#bitrate').parent().parent().removeClass('hide').show();
        $('#bitrate a').click(() => {
          var id = $(this).attr("id");
          var bitrate = parseInt(id)*1000;
          if(bitrate === 0) {
            Janus.log("Not limiting bandwidth via REMB");
          } else {
            Janus.log("Capping bandwidth to " + bitrate + " via REMB");
          }
          $('#bitrateset').html($(this).html() + '<span class="caret"></span>').parent().removeClass('open');
          this.janusPluginHandler.send({"message": { "request": "configure", "bitrate": bitrate }});
          return false;
        });
      },
      onmessage: (msg: any, jsep: any) => {
        console.log(" ::: Got a message (publisher) :::");
        console.log(msg);
        var event = msg["videoroom"];
        console.log("Event: " + event);
        if(event != undefined && event != null) {
          if(event === "joined") {
            // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
            this.myid = msg["id"];
            this.mypvtid = msg["private_id"];
            Janus.log("Successfully joined room " + msg["room"] + " with ID " + this.myid);
            this.publishOwnFeed(true);
            // Any new feed to attach to?
            if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
              var list = msg["publishers"];
              Janus.debug("Got a list of available publishers/feeds:");
              Janus.debug(list);
              for(var f in list) {
                var id = list[f]["id"];
                var display = list[f]["display"];
                var audio = list[f]["audio_codec"];
                var video = list[f]["video_codec"];
                Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                this.newRemoteFeed(id, display, audio, video);
              }
            }
          } else if(event === "destroyed") {
            // The room has been destroyed
            Janus.warn("The room has been destroyed!");
            //bootbox.alert("The room has been destroyed", () => {
              window.location.reload();
            //});
          } else if(event === "event") {
            // Any new feed to attach to?
            if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
              var list = msg["publishers"];
              console.log("Got a list of available publishers/feeds:");
              console.log(list);
              for(var f in list) {
                var id = list[f]["id"];
                var display = list[f]["display"];
                var audio = list[f]["audio_codec"];
                var video = list[f]["video_codec"];
                console.log("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                this.newRemoteFeed(id, display, audio, video);
              }
            } else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
              // One of the publishers has gone away?
              var leaving = msg["leaving"];
              Janus.log("Publisher left: " + leaving);
              var remoteFeed = null;
              for(var i=1; i<16; i++) {
                if(this.feeds[i] != null && this.feeds[i] != undefined && this.feeds[i].rfid == leaving) {
                  remoteFeed = this.feeds[i];
                  break;
                }
              }
              if(remoteFeed != null) {
                Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                $('#remote'+remoteFeed.rfindex).empty().hide();
                $('#videoremote'+remoteFeed.rfindex).empty();
                this.feeds[remoteFeed.rfindex] = null;
                remoteFeed.detach();
              }
            } else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
              // One of the publishers has unpublished?
              var unpublished = msg["unpublished"];
              Janus.log("Publisher left: " + unpublished);
              if(unpublished === 'ok') {
                // That's us
                this.janusPluginHandler.hangup();
                return;
              }
              var remoteFeed = null;
              for(var i=1; i<16; i++) {
                if(this.feeds[i] != null && this.feeds[i] != undefined && this.feeds[i].rfid == unpublished) {
                  remoteFeed = this.feeds[i];
                  break;
                }
              }
              if(remoteFeed != null) {
                Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                $('#remote'+remoteFeed.rfindex).empty().hide();
                $('#videoremote'+remoteFeed.rfindex).empty();
                this.feeds[remoteFeed.rfindex] = null;
                remoteFeed.detach();
              }
            } else if(msg["error"] !== undefined && msg["error"] !== null) {
              if(msg["error_code"] === 426) {
                // This is a "no such room" error: give a more meaningful description
                //bootbox.alert(
                //	"<p>Apparently room <code>" + myroom + "</code> (the one this demo uses as a test room) " +
                //	"does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                //	"configuration file? If not, make sure you copy the details of room <code>" + myroom + "</code> " +
                //	"from that sample in your current configuration file, then restart Janus and try again."
                //);
              } else {
                //bootbox.alert(msg["error"]);
              }
            }
          }
        }
        if(jsep !== undefined && jsep !== null) {
          Janus.debug("Handling SDP as well...");
          Janus.debug(jsep);
          this.janusPluginHandler.handleRemoteJsep({jsep: jsep});
          // Check if any of the media we wanted to publish has
          // been rejected (e.g., wrong or unsupported codec)
          var audio = msg["audio_codec"];
          if(this.mystream && this.mystream.getAudioTracks() && this.mystream.getAudioTracks().length > 0 && !audio) {
            // Audio has been rejected
            this.showToast("Our audio stream has been rejected, viewers won't hear us", "Error");
          }
          var video = msg["video_codec"];
          if(this.mystream && this.mystream.getVideoTracks() && this.mystream.getVideoTracks().length > 0 && !video) {
            // Video has been rejected
            this.showToast("Our video stream has been rejected, viewers won't see us", "Error");
          }
        }
      },
      onlocalstream: (stream: any) => {
        Janus.debug(" ::: Got a local stream :::");
        this.mystream = stream;
        Janus.debug(stream);
        $('#videojoin').hide();
        $('#videos').removeClass('hide').show();
        $('#publisher').removeClass('hide').html(this.myusername).show();
        Janus.attachMediaStream($('#myvideo').get(0), stream);
        $("#myvideo").attr("muted", "muted");
        $("#myvideo").prop("muted", "muted");
        if(this.janusPluginHandler.webrtcStuff.pc.iceConnectionState !== "completed" &&
        this.janusPluginHandler.webrtcStuff.pc.iceConnectionState !== "connected") {
            this.showToast("Publishing...", "Progress");
          // $("#videolocal").parent().parent().block({
          //   message: '<b>Publishing...</b>',
          //   css: {
          //     border: 'none',
          //     backgroundColor: 'transparent',
          //     color: 'white'
          //   }
          // });
        }
      },
      onremotestream: (stream: any) => {
        // The publisher stream is sendonly, we don't expect anything here
        Janus.debug("Unexpected Remote feed #" + stream.rfindex);
      },
      oncleanup: () => {
        Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
        this.mystream = null;
        $('#publish').click(() => { this.publishOwnFeed(true); });
        $("#videolocal").parent().parent().attr("display", "block");
        $('#bitrate').parent().parent().addClass('hide');
        $('#bitrate a').unbind('click');
      }
    });
    this.eventsAttached = true;
}

  initialize(){
    if(window.location.protocol === 'http:'){
      this.server = "http://" + window.location.hostname + ":8088/janus";
    } else {
      this.server = "https://" + window.location.hostname + ":8089/janus";
    }
    this.server = "https://vteam.live:8089/janus";
    
    $("#username").attr("value", "User "+this.randomString(2).toUpperCase());
 
    Janus.init({
      debug: "all", 
      callback: () => {
        // Use a button to start the demo
        if(!(navigator.getUserMedia !== undefined && navigator.getUserMedia !== null)) {
          this.showToast("No WebRTC support... ", "Major Error");
          return;
        }
        // Create session
        this.janus = new Janus({
          server: this.server,
          success: () => {
            this.serverInitialized = true;
            console.log("success "+ this.serverInitialized );
            this.attachJanusEvent();
          },
          error: (error: any) => {
            console.log(error);
            //bootbox.alert(error, () => {
              //window.location.reload();
            //});
          },
          destroyed: () => {
            console.log('destoryed');
            //window.location.reload();
          }
        });
      }
    });
  }

  checkEnter = function(field: any, event: any) {
    this.checkUsername();
    var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
    if(theCode == 13) {
      this.startVideo();
      return false;
    } else {
      return true;
    }
  }
  
  checkUsername = function(){
    if($('#username').length === 0) {
      $('#startVideo').prop('disabled', true);
    } else{
      $('#startVideo').prop('disabled', false);
    }
  }
  
  stopVideoCall = function() {
    $('#startVideo').prop('disabled', false);
    this.unpublishOwnFeed();
    this.janusPluginHandler.hangup();
    var stopMessage = { "request": "leave" };
    this.janusPluginHandler.send({"message": stopMessage, success: (result: any) => {
      console.log("Stopped the call: " + result);
      this.initialize();
    }});
}

  startVideoCall = function() {
    if($('#username').length === 0) {
      // Create fields to register
      $('#register').click(this.startVideoCall);
      $('#username').focus();
    } else {
      // Try a registration
      $('#username').prop('disabled', true);
      $('#register').prop('disabled', true).unbind('click');
      var username = $('#username').val();
      this.myroom = $("#room").val();
      if(username === "") {
        $('#you')
          .removeClass().addClass('label label-warning')
          .html("Insert your display name (e.g., pippo)");
        $('#username').removeAttr('disabled');
        $('#register').removeAttr('disabled').click(this.startVideoCall);
        return;
      }
      var register = { "request": "join", "room": parseInt(this.myroom), "ptype": "publisher", "display": username };
      this.myusername = username;
      console.log('Registering user for call: ' + username);
      console.log(register);
      this.janusPluginHandler.send({"message": register, success: (result: any) => {
        console.log("Registration result: " + result);
      }});
    }
  }
  
  publishOwnFeed = function(useAudio: any) {
    // Publish our stream
    Janus.debug(">>>>> Creating publisher SDP!");
    $('#publish').attr('disabled', "true").unbind('click');
    this.janusPluginHandler.createOffer(
      {
        // Add data:true here if you want to publish datachannels as well
        media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true },	// Publishers are sendonly
        // If you want to test simulcasting (Chrome and Firefox only), then
        // pass a ?simulcast=true when opening this demo page: it will turn
        // the following 'simulcast' property to pass to janus.js to true
        simulcast: this.doSimulcast,
        simulcast2: this.oSimulcast2,
        success: (jsep: any) => {
          Janus.debug(">>>>> Got publisher SDP!");
          Janus.debug(jsep);
          var publish = { "request": "configure", "audio": useAudio, "video": true };
          // You can force a specific codec to use when publishing by using the
          // audiocodec and videocodec properties, for instance:
          // 		publish["audiocodec"] = "opus"
          // to force Opus as the audio codec to use, or:
          // 		publish["videocodec"] = "vp9"
          // to force VP9 as the videocodec to use. In both case, though, forcing
          // a codec will only work if: (1) the codec is actually in the SDP (and
          // so the browser supports it), and (2) the codec is in the list of
          // allowed codecs in a room. With respect to the point (2) above,
          // refer to the text in janus.plugin.videoroom.jcfg for more details
          this.janusPluginHandler.send({"message": publish, "jsep": jsep});
        },
        error: (error: any) => {
          Janus.error(">>>>>>> WebRTC error:", error);
          if (useAudio) {
             this.publishOwnFeed(false);
          } else {
            //bootbox.alert("WebRTC error... " + JSON.stringify(error));
            $('#publish').removeAttr('disabled').click(() => { this.publishOwnFeed(true); });
          }
        }
      });
  }
  
  // $( "#videocall" ).on("shown.bs.modal", (e) => {
  //     this.startVideoCall();
  // });
  
  toggleMute = function() {
    var muted = this.janusPluginHandler.isAudioMuted();
    Janus.log((muted ? "Unmuting" : "Muting") + " local stream...");
    if(muted)
    this.janusPluginHandler.unmuteAudio();
    else
    this.janusPluginHandler.muteAudio();
    muted = this.janusPluginHandler.isAudioMuted();
    $('#mute').html(muted ? "Unmute" : "Mute");
  }
  
  unpublishOwnFeed = function() {
    // Unpublish our stream
    $('#unpublish').attr('disabled', "true").unbind('click');
    var unpublish = { "request": "unpublish" };
    this.janusPluginHandler.send({"message": unpublish});
  }
  
  newRemoteFeed = function(id: any, display: any, audio: any, video: any) {
    // A new feed has been published, create a new plugin handle and attach to it as a subscriber
    var remoteFeed = null;
    this.janus.attach(
      {
        plugin: "janus.plugin.videoroom",
        opaqueId: this.opaqueId,
        success: (pluginHandle: any) => {
          remoteFeed = pluginHandle;
          remoteFeed.simulcastStarted = false;
          Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
          Janus.log("  -- This is a subscriber");
          // We wait for the plugin to send us an offer
          var subscribe = { "request": "join", "room": this.myroom, "ptype": "subscriber", "feed": id, "private_id": this.mypvtid };
          // In case you don't want to receive audio, video or data, even if the
          // publisher is sending them, set the 'offer_audio', 'offer_video' or
          // 'offer_data' properties to false (they're true by default), e.g.:
          // 		subscribe["offer_video"] = false;
          // For example, if the publisher is VP8 and this is Safari, let's avoid video
          if(Janus.webRTCAdapter.browserDetails.browser === "safari" &&
              (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
            if(video)
              video = video.toUpperCase()
            this.showToast("Publisher is using " + video + ", but Safari doesn't support it: disabling video", "Error");
            subscribe["offer_video"] = false;
          }
          remoteFeed.videoCodec = video;
          Janus.log("  -- This is a subscriber:: subscribing the video", subscribe);
          remoteFeed.send({"message": subscribe});
        },
        error: (error: any) => {
          Janus.error("  -- Error attaching plugin...", error);
          //bootbox.alert("Error attaching plugin... " + error);
        },
        onmessage: (msg: any, jsep: any) => {
          Janus.debug(" ::: Got a message (subscriber) :::");
          Janus.debug(msg);
          var event = msg["videoroom"];
          Janus.debug("Event: " + event);
          if(msg["error"] !== undefined && msg["error"] !== null) {
            //bootbox.alert(msg["error"]);
          } else if(event != undefined && event != null) {
            if(event === "attached") {
              // Subscriber created and attached
              for(var i=1;i<16;i++) {
                if(this.feeds[i] === undefined || this.feeds[i] === null) {
                  this.feeds[i] = remoteFeed;
                  remoteFeed.rfindex = i;
                  break;
                }
              }
              remoteFeed.rfid = msg["id"];
              remoteFeed.rfdisplay = msg["display"];
              if(remoteFeed.spinner === undefined || remoteFeed.spinner === null) {
                var target = document.getElementById('videoremote'+remoteFeed.rfindex);
                remoteFeed.spinner = this.spinnerDialog;
              } else {
                remoteFeed.spinner.show();
              }
              Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
              $('#remote'+remoteFeed.rfindex).removeClass('hide').html(remoteFeed.rfdisplay).show();
            } else if(event === "event") {
              // Check if we got an event on a simulcast-related event from this publisher
              var substream = msg["substream"];
              var temporal = msg["temporal"];
              if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                if(!remoteFeed.simulcastStarted) {
                  remoteFeed.simulcastStarted = true;
                  // Add some new buttons
                  this.addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
                }
                // We just received notice that there's been a switch, update the buttons
                this.updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
              }
            } else {
              // What has just happened?
            }
          }
          if(jsep !== undefined && jsep !== null) {
            Janus.debug("Handling SDP as well...");
            Janus.debug(jsep);
            // Answer and attach
            remoteFeed.createAnswer(
              {
                jsep: jsep,
                // Add data:true here if you want to subscribe to datachannels as well
                // (obviously only works if the publisher offered them in the first place)
                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                success: (jsep: any) => {
                  Janus.debug("Got SDP!");
                  Janus.debug(jsep);
                  var body = { "request": "start", "room": this.myroom };
                  remoteFeed.send({"message": body, "jsep": jsep});
                },
                error: (error: any) => {
                  Janus.error("WebRTC error:", error);
                  //bootbox.alert("WebRTC error... " + JSON.stringify(error));
                }
              });
          }
        },
        webrtcState: (on: any) => {
          Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
        },
        onlocalstream: (stream: any) => {
          // The subscriber stream is recvonly, we don't expect anything here
          Janus.debug("Unexpected Local feed #" + stream.rfindex);
        },
        onremotestream: (stream: any) => {
          Janus.debug("Remote feed #" + remoteFeed.rfindex);
          var addButtons = false;
          if($('#remotevideo'+remoteFeed.rfindex).length === 0) {
            addButtons = true;
            // No remote video yet
            $('#videoremote'+remoteFeed.rfindex).append('<video class="centered remotevideo" id="waitingvideo' + remoteFeed.rfindex + '" width=320 height=240 />');
            $('#videoremote'+remoteFeed.rfindex).append('<video class="centered remotevideo relative hide" id="remotevideo' + remoteFeed.rfindex + '" width="100%" height="100%" autoplay playsinline/>');
            $('#videoremote'+remoteFeed.rfindex).append(
              '<span class="label label-primary hide" id="curres'+remoteFeed.rfindex+'" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;"></span>' +
              '<span class="label label-info hide" id="curbitrate'+remoteFeed.rfindex+'" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;"></span>');
            // Show the video, hide the spinner and show the resolution when we get a playing event
            $("#remotevideo"+remoteFeed.rfindex).bind("playing", () => {
              if(remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
                remoteFeed.spinner.hide();
              remoteFeed.spinner = null;
              $('#waitingvideo'+remoteFeed.rfindex).remove();
              if(this.getAttribute("videoWidth"))
                $('#remotevideo'+remoteFeed.rfindex).removeClass('hide').show();
              var width = this.getAttribute("videoWidth");
              var height = this.getAttribute("videoHeight");
              $('#curres'+remoteFeed.rfindex).removeClass('hide').text(width+'x'+height).show();
              if(Janus.webRTCAdapter.browserDetails.browser === "firefox") {
                // Firefox Stable has a bug: width and height are not immediately available after a playing
                setTimeout(() => {
                  var width = $("#remotevideo"+remoteFeed.rfindex).get(0).getAttribute("videoWidth");
                  var height = $("#remotevideo"+remoteFeed.rfindex).get(0).getAttribute("videoHeight");
                  $('#curres'+remoteFeed.rfindex).removeClass('hide').text(width+'x'+height).show();
                }, 2000);
              }
            });
          }
          Janus.attachMediaStream($('#remotevideo'+remoteFeed.rfindex).get(0), stream);
          var videoTracks = stream.getVideoTracks();
          if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            // No remote video
            $('#remotevideo'+remoteFeed.rfindex).hide();
            if($('#videoremote'+remoteFeed.rfindex + ' .no-video-container').length === 0) {
              $('#videoremote'+remoteFeed.rfindex).append(
                '<div class="no-video-container">' +
                  '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                  '<span class="no-video-text">No remote video available, Due to poor network</span>' +
                '</div>');
            }
          } else {
            $('#videoremote'+remoteFeed.rfindex+ ' .no-video-container').remove();
            $('#remotevideo'+remoteFeed.rfindex).removeClass('hide').show();
          }
          if(!addButtons)
            return;
          if(Janus.webRTCAdapter.browserDetails.browser === "chrome" || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
              Janus.webRTCAdapter.browserDetails.browser === "safari") {
            $('#curbitrate'+remoteFeed.rfindex).removeClass('hide').show();
            this.bitrateTimer[remoteFeed.rfindex] = setInterval(() => {
              // Display updated bitrate, if supported
              var bitrate = remoteFeed.getBitrate();
              $('#curbitrate'+remoteFeed.rfindex).text(bitrate);
              // Check if the resolution changed too
              var width = $("#remotevideo"+remoteFeed.rfindex).get(0).getAttribute("videoWidth");
              var height = $("#remotevideo"+remoteFeed.rfindex).get(0).getAttribute("videoHeight");
              if(parseInt(width) > 0 && parseInt(height) > 0)
                $('#curres'+remoteFeed.rfindex).removeClass('hide').text(width+'x'+height).show();
            }, 1000);
          }
        },
        oncleanup: () => {
          Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
          if(remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
            remoteFeed.spinner.hide();
          remoteFeed.spinner = null;
          $('#remotevideo'+remoteFeed.rfindex).remove();
          $('#waitingvideo'+remoteFeed.rfindex).remove();
          $('#novideo'+remoteFeed.rfindex).remove();
          $('#curbitrate'+remoteFeed.rfindex).remove();
          $('#curres'+remoteFeed.rfindex).remove();
          if(this.bitrateTimer[remoteFeed.rfindex] !== null && this.bitrateTimer[remoteFeed.rfindex] !== null)
            clearInterval(this.bitrateTimer[remoteFeed.rfindex]);
            this.bitrateTimer[remoteFeed.rfindex] = null;
            remoteFeed.simulcastStarted = false;
            $('#simulcast'+remoteFeed.rfindex).remove();
          }
      });
  }
  
  // Helpers to create Simulcast-related UI, if enabled
  addSimulcastButtons = function(feed: any, temporal: any) {
    var index = feed;
    $('#remote'+index).parent().append(
      '<div id="simulcast'+index+'" class="btn-group-vertical btn-group-vertical-xs pull-right">' +
      '	<div class"row">' +
      '		<div class="btn-group btn-group-xs" style="width: 100%">' +
      '			<button id="sl'+index+'-2" type="button" class="btn btn-primary" data-toggle="tooltip" title="Switch to higher quality" style="width: 33%">SL 2</button>' +
      '			<button id="sl'+index+'-1" type="button" class="btn btn-primary" data-toggle="tooltip" title="Switch to normal quality" style="width: 33%">SL 1</button>' +
      '			<button id="sl'+index+'-0" type="button" class="btn btn-primary" data-toggle="tooltip" title="Switch to lower quality" style="width: 34%">SL 0</button>' +
      '		</div>' +
      '	</div>' +
      '	<div class"row">' +
      '		<div class="btn-group btn-group-xs hide" style="width: 100%">' +
      '			<button id="tl'+index+'-2" type="button" class="btn btn-primary" data-toggle="tooltip" title="Cap to temporal layer 2" style="width: 34%">TL 2</button>' +
      '			<button id="tl'+index+'-1" type="button" class="btn btn-primary" data-toggle="tooltip" title="Cap to temporal layer 1" style="width: 33%">TL 1</button>' +
      '			<button id="tl'+index+'-0" type="button" class="btn btn-primary" data-toggle="tooltip" title="Cap to temporal layer 0" style="width: 33%">TL 0</button>' +
      '		</div>' +
      '	</div>' +
      '</div>'
    );
    
    // Enable the simulcast selection buttons
    $('#sl' + index + '-0').removeClass('btn-primary btn-success').addClass('btn-primary')
      .unbind('click').click(() => {
        this.showToast("Switching simulcast substream, wait for it... (lower quality)", "Message");
        if(!$('#sl' + index + '-2').hasClass('btn-success'))
          $('#sl' + index + '-2').removeClass('btn-primary btn-info').addClass('btn-primary');
        if(!$('#sl' + index + '-1').hasClass('btn-success'))
          $('#sl' + index + '-1').removeClass('btn-primary btn-info').addClass('btn-primary');
        $('#sl' + index + '-0').removeClass('btn-primary btn-info btn-success').addClass('btn-info');
        this.feeds[index].send({message: { request: "configure", substream: 0 }});
      });
    $('#sl' + index + '-1').removeClass('btn-primary btn-success').addClass('btn-primary')
      .unbind('click').click(() => {
        this.showToast("Switching simulcast substream, wait for it... (normal quality)", "Message");
        if(!$('#sl' + index + '-2').hasClass('btn-success'))
          $('#sl' + index + '-2').removeClass('btn-primary btn-info').addClass('btn-primary');
        $('#sl' + index + '-1').removeClass('btn-primary btn-info btn-success').addClass('btn-info');
        if(!$('#sl' + index + '-0').hasClass('btn-success'))
          $('#sl' + index + '-0').removeClass('btn-primary btn-info').addClass('btn-primary');
          this.feeds[index].send({message: { request: "configure", substream: 1 }});
      });
    $('#sl' + index + '-2').removeClass('btn-primary btn-success').addClass('btn-primary')
      .unbind('click').click(() => {
        this.showToast("Switching simulcast substream, wait for it... (higher quality)", "Message");
        $('#sl' + index + '-2').removeClass('btn-primary btn-info btn-success').addClass('btn-info');
        if(!$('#sl' + index + '-1').hasClass('btn-success'))
          $('#sl' + index + '-1').removeClass('btn-primary btn-info').addClass('btn-primary');
        if(!$('#sl' + index + '-0').hasClass('btn-success'))
          $('#sl' + index + '-0').removeClass('btn-primary btn-info').addClass('btn-primary');
          this.feeds[index].send({message: { request: "configure", substream: 2 }});
      });
    if(!temporal)	// No temporal layer support
      return;
    $('#tl' + index + '-0').parent().removeClass('hide');
    $('#tl' + index + '-0').removeClass('btn-primary btn-success').addClass('btn-primary')
      .unbind('click').click(() => {
        this.showToast("Capping simulcast temporal layer, wait for it... (lowest FPS)", "Message");
        if(!$('#tl' + index + '-2').hasClass('btn-success'))
          $('#tl' + index + '-2').removeClass('btn-primary btn-info').addClass('btn-primary');
        if(!$('#tl' + index + '-1').hasClass('btn-success'))
          $('#tl' + index + '-1').removeClass('btn-primary btn-info').addClass('btn-primary');
        $('#tl' + index + '-0').removeClass('btn-primary btn-info btn-success').addClass('btn-info');
        this.feeds[index].send({message: { request: "configure", temporal: 0 }});
      });
    $('#tl' + index + '-1').removeClass('btn-primary btn-success').addClass('btn-primary')
      .unbind('click').click(() => {
        this.showToast("Capping simulcast temporal layer, wait for it... (medium FPS)", "Message");
        if(!$('#tl' + index + '-2').hasClass('btn-success'))
          $('#tl' + index + '-2').removeClass('btn-primary btn-info').addClass('btn-primary');
        $('#tl' + index + '-1').removeClass('btn-primary btn-info').addClass('btn-info');
        if(!$('#tl' + index + '-0').hasClass('btn-success'))
          $('#tl' + index + '-0').removeClass('btn-primary btn-info').addClass('btn-primary');
          this.feeds[index].send({message: { request: "configure", temporal: 1 }});
      });
    $('#tl' + index + '-2').removeClass('btn-primary btn-success').addClass('btn-primary')
      .unbind('click').click(() => {
        this.showToast("Capping simulcast temporal layer, wait for it... (highest FPS)", "Message");
        $('#tl' + index + '-2').removeClass('btn-primary btn-info btn-success').addClass('btn-info');
        if(!$('#tl' + index + '-1').hasClass('btn-success'))
          $('#tl' + index + '-1').removeClass('btn-primary btn-info').addClass('btn-primary');
        if(!$('#tl' + index + '-0').hasClass('btn-success'))
          $('#tl' + index + '-0').removeClass('btn-primary btn-info').addClass('btn-primary');
          this.feeds[index].send({message: { request: "configure", temporal: 2 }});
      });
  }
  
  updateSimulcastButtons = function(feed: any, substream: any, temporal: any) {
    // Check the substream
    var index = feed;
    if(substream === 0) {
      this.showToast("Switched simulcast substream! (lower quality)", "Message");
      $('#sl' + index + '-2').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#sl' + index + '-1').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#sl' + index + '-0').removeClass('btn-primary btn-info btn-success').addClass('btn-success');
    } else if(substream === 1) {
      this.showToast("Switched simulcast substream! (normal quality)", "Message");
      $('#sl' + index + '-2').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#sl' + index + '-1').removeClass('btn-primary btn-info btn-success').addClass('btn-success');
      $('#sl' + index + '-0').removeClass('btn-primary btn-success').addClass('btn-primary');
    } else if(substream === 2) {
      this.showToast("Switched simulcast substream! (higher quality)", "Message");
      $('#sl' + index + '-2').removeClass('btn-primary btn-info btn-success').addClass('btn-success');
      $('#sl' + index + '-1').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#sl' + index + '-0').removeClass('btn-primary btn-success').addClass('btn-primary');
    }
    // Check the temporal layer
    if(temporal === 0) {
      this.showToast("Capped simulcast temporal layer! (lowest FPS)", "Message");
      $('#tl' + index + '-2').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#tl' + index + '-1').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#tl' + index + '-0').removeClass('btn-primary btn-info btn-success').addClass('btn-success');
    } else if(temporal === 1) {
      this.showToast("Capped simulcast temporal layer! (medium FPS)", "Message");
      $('#tl' + index + '-2').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#tl' + index + '-1').removeClass('btn-primary btn-info btn-success').addClass('btn-success');
      $('#tl' + index + '-0').removeClass('btn-primary btn-success').addClass('btn-primary');
    } else if(temporal === 2) {
      this.showToast("Capped simulcast temporal layer! (highest FPS)", "Message");
      $('#tl' + index + '-2').removeClass('btn-primary btn-info btn-success').addClass('btn-success');
      $('#tl' + index + '-1').removeClass('btn-primary btn-success').addClass('btn-primary');
      $('#tl' + index + '-0').removeClass('btn-primary btn-success').addClass('btn-primary');
    }
  }
}

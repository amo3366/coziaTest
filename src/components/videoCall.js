import React, { Component, useState } from "react";
import classNames from "classnames";
import AccCore from "opentok-accelerator-core";
// import {connect} from 'react'
import "opentok-solutions-css";
import config from "../config.json";
import "../App.css";
import CallIcon from "@material-ui/icons/Call";
import { Rnd } from "react-rnd";
import { Button, Spinner } from "reactstrap";
import 'bootstrap/dist/css/bootstrap.css';
const OT = require('@opentok/client');

let otCore;

/**
 * Build classes for container elements based on state
 * @param {Object} state
 */
const containerClasses = (state) => {
  const { active, meta, localAudioEnabled, localVideoEnabled } = state;
  const sharingScreen = meta ? !!meta.publisher.screen : false;
  const viewingSharedScreen = meta ? meta.subscriber.screen : false;
  const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;
  const activeCameraSubscribersGt2 = activeCameraSubscribers > 2;
  const activeCameraSubscribersOdd = activeCameraSubscribers % 2;
  const screenshareActive = viewingSharedScreen || sharingScreen;
  return {
    controlClass: classNames("App-control-container", { hidden: !active }),
    localAudioClass: classNames("ots-video-control circle audio", {
      hidden: !active,
      muted: !localAudioEnabled,
    }),
    localVideoClass: classNames("ots-video-control circle video", {
      hidden: !active,
      muted: !localVideoEnabled,
    }),
    localCallClass: classNames("ots-video-control circle end-call", {
      hidden: !active,
    }),
    cameraPublisherClass: classNames("video-container", {
      hidden: !active,
      small: !!activeCameraSubscribers || screenshareActive,
      left: screenshareActive,
    }),
    screenPublisherClass: classNames("video-container", {
      hidden: !active || !sharingScreen,
    }),
    cameraSubscriberClass: classNames(
      "video-container",
      { hidden: !active || !activeCameraSubscribers },
      { "active-gt2": activeCameraSubscribersGt2 && !screenshareActive },
      { "active-odd": activeCameraSubscribersOdd && !screenshareActive },
      { small: screenshareActive }
    ),
    screenSubscriberClass: classNames("video-container", {
      hidden: !viewingSharedScreen || !active,
    }),
  };
};

class VideoCall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      counter: this.props.counter,
      connected: false,
      active: false,
      publishers: null,
      subscribers: null,
      meta: null,
      localAudioEnabled: true,
      localVideoEnabled: true,
      hover: false,
      height: 0,
      width: 0,
      ringing: true,
      otCoreOptions: {
        credentials: {
          apiKey: config.apiKey,
          sessionId: config.sessionId,
          token: config.token,
        },
        // A container can either be a query selector or an HTML Element
        streamContainers(pubSub, type, data, stream) {
          return {
            publisher: {
              camera: "#cameraPublisherContainer",
              screen: "#screenPublisherContainer",
            },
            subscriber: {
              camera: "#cameraSubscriberContainer",
              screen: "#screenSubscriberContainer",
            },
          }[pubSub][type];
        },
        controlsContainer: "#controls",
        packages: ["screenSharing", "annotation"],
        communication: {
          callProperties: null, // Using default
        },
        screenSharing: {
          extensionID: "plocfffmbcclpdifaikiikgplfnepkpo",
          annotation: true,
          externalWindow: false,
          dev: true,
          screenProperties: {
            insertMode: "append",
            width: "100%",
            height: "100%",
            showControls: false,
            style: {
              buttonDisplayMode: "off",
            },
            videoSource: "window",
            fitMode: "contain", // Using default
          },
        },
        annotation: {
          absoluteParent: {
            publisher: ".App-video-container",
            subscriber: ".App-video-container",
          },
        },
      },
    };
    this.startCall = this.startCall.bind(this);
    this.endCall = this.endCall.bind(this);
    this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    console.log("getDerivedStateFromProps");
    console.log(otCore);
    console.log("Props : ", props);
    console.log("State : ", current_state);
    if (props.counter !== current_state.counter) {
      console.log("getDerivedStateFromProps inside change");
      return { counter: props.counter };
    }
    return null;
  }

  componentDidMount() {
    console.log("inside component did mouont");
    otCore = new AccCore(this.state.otCoreOptions);
    otCore.connect().then(() => {
      this.setState({ connected: true });
    });
    const events = [
      "subscribeToCamera",
      "unsubscribeFromCamera",
      "subscribeToScreen",
      "unsubscribeFromScreen",
      "startScreenShare",
      "endScreenShare",
    ];

    console.log(otCore);

    events.forEach((event) =>
      otCore.on(event, ({ publishers, subscribers, meta }) => {
        this.setState({ publishers, subscribers, meta });
      })
    );
  }

  startCall() {
    console.log("IN START CALL" + !this.state.ringing)
      otCore
        .startCall()
        .then(({ publishers, subscribers, meta }) => {
          console.log("HELLO THERE")
          this.setState({
            publishers,
            subscribers,
            meta,
            active: true,
            height: 200,
            width: 300,
          });
        })
        .catch((error) => console.log(error));
  }

  endCall() {
    otCore.disconnect();
    this.setState({ active: false, height: 0, width: 0, ringing: true });
  }

  toggleLocalAudio() {
    otCore.toggleLocalAudio(!this.state.localAudioEnabled);
    this.setState({ localAudioEnabled: !this.state.localAudioEnabled });
  }

  toggleLocalVideo() {
    otCore.toggleLocalVideo(!this.state.localVideoEnabled);
    this.setState({ localVideoEnabled: !this.state.localVideoEnabled });
  }

  hoverEventOut = () => {
    this.setState({ hover: false });
  };

  hoverEventIn = () => {
    this.setState({ hover: true });
  };

  render() {
    let callRinging = () => (
      <div style={{textAlign:"center"}}>
      <h1 className = "display-4" style = { {textAlign: "center"} } >Incoming call</h1>
        <Spinner 
        color = "danger"
        style ={ { display: "block", margin: "0px auto 10px auto" } }
        />
        <Button
          color="success"
            onClick={() => {
              this.setState({ringing: false})
              this.startCall()
            }}
        >Accept Call</Button>
      </div>
    )

    const { connected, active, ringing } = this.state;
    const {
      localAudioClass,
      localVideoClass,
      localCallClass,
      controlClass,
      cameraPublisherClass,
      screenPublisherClass,
      cameraSubscriberClass,
      screenSubscriberClass,
    } = containerClasses(this.state);

    return (
      <div className="App">
        <div className="App-main">
          <div
            onMouseOver={this.hoverEventIn}
            onMouseLeave={this.hoverEventOut}
            className="App-video-container"
          >
            {console.log("FLAG" + ringing)}
            { ringing ? callRinging() : null}
            <Rnd
              default={{
                x: 0,
                y: 0,
                width: active ? this.state.width : 0,
                height: active ? this.state.height : 0,
              }}
              minHeight={active ? "300px" : "0px"}
              minWidth={active ? "300px" : "0px"}
              maxHeight={active ? "600px" : "0px"}
              maxWidth={active ? "600px" : "0px"}
              style={{ backgroundColor: "black" }}
            >
              <div
                id="cameraPublisherContainer"
                className={cameraPublisherClass}
              />
              <div
                id="screenPublisherContainer"
                className={screenPublisherClass}
              />
              <div
                id="cameraSubscriberContainer"
                className={cameraSubscriberClass}
              />
              <div
                id="screenSubscriberContainer"
                className={screenSubscriberClass}
              />
              {this.state.hover ? (
                <div id="controls" className={controlClass}>
                  <div
                    className={localAudioClass}
                    onClick={this.toggleLocalAudio}
                  />
                  <div
                    className={localVideoClass}
                    onClick={this.toggleLocalVideo}
                  />
                  <div className={localCallClass} onClick={this.endCall} />
                </div>
              ) : null}
            </Rnd>
          </div>
        </div>
      </div>
    );
  }
}

export default VideoCall;
import React, { Component } from 'react';
import Spinner from 'react-spinner';
import classNames from 'classnames';
import AccCore from 'opentok-accelerator-core';
import 'opentok-solutions-css';
import config from '../config.json';
import '../App.css';
import CallIcon from '@material-ui/icons/Call';
import { Rnd } from "react-rnd"

let otCore;
const otCoreOptions = {
  credentials: {
    apiKey: config.apiKey,
    sessionId: config.sessionId,
    token: config.token,
  },
  // A container can either be a query selector or an HTML Element
  streamContainers(pubSub, type, data, stream) {
    return {
      publisher: {
        camera: '#cameraPublisherContainer',
        screen: '#screenPublisherContainer',
      },
      subscriber: {
        camera: '#cameraSubscriberContainer',
        screen: '#screenSubscriberContainer',
      },
    }[pubSub][type];
  },
  controlsContainer: '#controls',
  packages: ['screenSharing', 'annotation'],
  communication: {
    callProperties: null, // Using default
  },
  screenSharing: {
    extensionID: 'plocfffmbcclpdifaikiikgplfnepkpo',
    annotation: true,
    externalWindow: false,
    dev: true,
    screenProperties: {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      showControls: false,
      style: {
        buttonDisplayMode: 'off',
      },
      videoSource: 'window',
      fitMode: 'contain' // Using default
    },
  },
  annotation: {
    absoluteParent: {
      publisher: '.App-video-container',
      subscriber: '.App-video-container'
    }
  },
};

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
    controlClass: classNames('App-control-container', { hidden: !active }),
    localAudioClass: classNames('ots-video-control circle audio', { hidden: !active, muted: !localAudioEnabled }),
    localVideoClass: classNames('ots-video-control circle video', { hidden: !active, muted: !localVideoEnabled }),
    localCallClass: classNames('ots-video-control circle end-call', { hidden: !active }),
    cameraPublisherClass: classNames('video-container', { hidden: !active, small: !!activeCameraSubscribers || screenshareActive, left: screenshareActive }),
    screenPublisherClass: classNames('video-container', { hidden: !active || !sharingScreen }),
    cameraSubscriberClass: classNames('video-container', { hidden: !active || !activeCameraSubscribers },
      { 'active-gt2': activeCameraSubscribersGt2 && !screenshareActive },
      { 'active-odd': activeCameraSubscribersOdd && !screenshareActive },
      { small: screenshareActive }
    ),
    screenSubscriberClass: classNames('video-container', { hidden: !viewingSharedScreen || !active }),
  };
};

const connectingMask = () =>
  <Spinner />

const startCallMask = start =>
  <CallIcon
    color="action"
    onClick={start}
    style={{
      cursor: "pointer",
    }}
  />

class VideoCall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      active: false,
      publishers: null,
      subscribers: null,
      meta: null,
      localAudioEnabled: true,
      localVideoEnabled: true,
      hover: false,
      height: 0,
      width: 0
    };
    this.startCall = this.startCall.bind(this);
    this.endCall = this.endCall.bind(this);
    this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
  }

  componentDidMount() {
    otCore = new AccCore(otCoreOptions);
    otCore.connect().then(() => this.setState({ connected: true }));
    const events = [
      'subscribeToCamera',
      'unsubscribeFromCamera',
      'subscribeToScreen',
      'unsubscribeFromScreen',
      'startScreenShare',
      'endScreenShare',
    ];

    events.forEach(event => otCore.on(event, ({ publishers, subscribers, meta }) => {
      this.setState({ publishers, subscribers, meta });
    }));
  }

  startCall() {
    otCore.startCall()
      .then(({ publishers, subscribers, meta }) => {
        this.setState({ publishers, subscribers, meta, active: true, height: 200, width: 300 });
        alert(this.state.width
          )
      }).catch(error => console.log(error));
  }

  endCall() {
    otCore.endCall();
    this.setState({ active: false, height: 0, width: 0});
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
    this.setState({ hover: false })
  }

  hoverEventIn = () => {
    this.setState({ hover: true })
  }

  render() {
    const { connected, active } = this.state;
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
            <div>
              {!connected && connectingMask()}
              {connected && !active && startCallMask(this.startCall)}
            </div>
            <Rnd
                default={{
                  x: 0,
                  y: 0,
                  width: active ? this.state.width : 0,
                  height: active ? this.state.height : 0,
                }}
                minHeight = {active? "300px": "0px"}
                minWidth = {active? "300px": "0px"}
                maxHeight = {active? "600px": "0px"}
                maxWidth = {active? "600px": "0px"}
                style = {{ backgroundColor: "black" }}
            >
              <div id="cameraPublisherContainer" className={cameraPublisherClass} />
              <div id="screenPublisherContainer" className={screenPublisherClass} />
              <div id="cameraSubscriberContainer" className={cameraSubscriberClass} />
              <div id="screenSubscriberContainer" className={screenSubscriberClass} />
              {this.state.hover ?
                <div id="controls" className={controlClass}>
                  <div className={localAudioClass} onClick={this.toggleLocalAudio} />
                  <div className={localVideoClass} onClick={this.toggleLocalVideo} />
                  <div className={localCallClass} onClick={this.endCall} />
                </div>
                : null}
            </Rnd>
          </div>
        </div>
      </div >
    );
  }
}

export default VideoCall;
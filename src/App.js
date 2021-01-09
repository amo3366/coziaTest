import React, { Component } from "react";
import VideoCall from "./components/videoCall";

class App extends Component {
  state = {
    show: false,
    counter: 0,
  };
  render() {
    return (
      <div>
        <button
          onClick={() => {
            this.setState({
              show: true,
              counter: this.state.counter + 1,
            });
          }}
        >
          Call
        </button>
        {this.state.show ? (
          <VideoCall
            endShow={() => {
              this.setState({ show: false });
            }}
            counter={this.state.counter}
          />
        ) : null}
      </div>
    );
  }
}

export default App;

import "./App.css";
import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import Signin from "./components/Signin/Signin";
import Register from "./components/Register/Register";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import Rank from "./components/Rank/Rank";
import Particles from "react-tsparticles";
import { Component } from "react";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";

const particleParam = {
  fpsLimit: 60,
  particles: {
    links: {
      enable: true,
      distance: 150,
    },
    number: {
      value: 50,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    move: {
      enable: true,
    },
  },
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: "",
      imageUrl: "",
      box: {},
      route: "signin",
      isSignedIn: false,
      backendUrl: "https://smartbrain-api-heroku.herokuapp.com",
      user: {
        id: 0,
        name: "",
        email: "",
        entries: 0,
        joined: "",
      },
    };
  }

  componentDidMount() {
    fetch(this.state.backendUrl)
      .then((response) => response.json())
      .then(console.log);
  }

  onLoadUser = (registeredUser) => {
    this.setState({
      user: {
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        entries: registeredUser.entries,
        joined: registeredUser.joined,
      },
    });
  };

  calculateFaceLocation = (data) => {
    console.log(data);
    let clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    let image = document.getElementById("inputImage");
    let width = Number(image.width);
    let height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - clarifaiFace.right_col * width,
      bottomRow: height - clarifaiFace.bottom_row * height,
    };
  };

  displayFaceBox = (box) => {
    this.setState({ box: box });
  };

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onPictureSubmit = () => {
    this.setState({ imageUrl: this.state.input });

    fetch(this.state.backendUrl+"/recognize", {
      method: "POST",
      headers: { "Content-Type": "Application/JSON" },
      body: JSON.stringify({ imageUrl: this.state.input }),
    })
      .then((response) => response.json())
      .then((responseData) => {
        this.displayFaceBox(this.calculateFaceLocation(responseData));
        if (responseData) {
          fetch(this.state.backendUrl+"/entries", {
            method: "PUT",
            headers: { "Content-Type": "Application/JSON" },
            body: JSON.stringify({ id: this.state.user.id }),
          })
            .then((entriesResponse) => entriesResponse.json())
            .then((data) => {
              this.setState(
                Object.assign(this.state.user, { entries: data.entries })
              );
            });
        }
      })
      .catch((err) => console.log(err));
  };

  onRouteChange = (route) => {
    if (route === "signout" || route === "register") {
      this.setState({ isSignedIn: false, imageUrl: "" });
    } else if (route === "home") {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route: route });
  };

  render() {
    return (
      <div className="App">
        <Particles className="particles" params={particleParam} />
        <Navigation
          onRouteChange={this.onRouteChange}
          isSignedIn={this.state.isSignedIn}
        />
        <Logo />
        {this.state.route === "home" ? (
          <div>
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries}
            />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onPictureSubmit={this.onPictureSubmit}
            />
            <FaceRecognition
              imageUrl={this.state.imageUrl}
              box={this.state.box}
            />
          </div>
        ) : this.state.route === "register" ? (
          <Register
            onRouteChange={this.onRouteChange}
            onLoadUser={this.onLoadUser}
            backendUrl={this.state.backendUrl}
          />
        ) : (
          <Signin
            onLoadUser={this.onLoadUser}
            onRouteChange={this.onRouteChange}
            backendUrl={this.state.backendUrl}
          />
        )}
      </div>
    );
  }
}

export default App;

# thymio_nodejs


Connect Thymio with nodejs server, using dbus (asebamodella), with socket.io on Raspberry Pi 4.
Since you installed nodejs on Raspberry Pi, you will be able to run the server which allow to connect with Thymio, with socket.io to get real-time data drom sensors, and control the motors. 

## Getting started

### Install npm packages

### Install npm

Npm is a package manager for JavaScript.

[Learn more here](https://docs.npmjs.com/getting-started/installing-node#install-npm--manage-npm-versions).



### Install the dependencies

Run `npm i` in the cloned directory to install the required dependencies.

### Launch the web app

Run `npm start`, then open `http://localhost:3005` in your browser.


## How does it work?

The thymio API is distributed as a [npm package](https://www.npmjs.com/package/@mobsya-association/thymio-api).
It can be installed with `npm -i @mobsya-association/thymio-api`.

This demo project also depends on:
* Webpack to orchestrate the bundling of the application for both node and browser
* Babel to convert the code in a flavor of Javascript compatible with older versions of web browsers

The code is in `src` and gets compiled into `dist`.

## What next.

You can copy this project or get inspiration from it to start working on web-applications compatible with thymio.

* [Thymio JS API](https://readthedocs.org/projects/aseba/)
* [Webpack](https://webpack.js.org/)
* [NPM](https://docs.npmjs.com/)
* [Babel](https://babeljs.io/)
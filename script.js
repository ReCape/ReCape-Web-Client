var _DEBUG = false;
var COOKIE_EXPIRY = 30;

if (_DEBUG) {
var rcURL = "https://localhost";
} else {
  var rcURL = "https://recape-server.boyne.dev";
}

var models = {}
var modelChecks = {}

let modelContainer = document.getElementById("model-list");

function show_notification(text) {
  let notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerText = text;
  document.getElementById("notifications").appendChild(notification);
  
  setTimeout(x => {notification.remove()}, 5000)
}

function fetch_cape() {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob'; //so you can access the response like a normal URL
  xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
          loadCape(URL.createObjectURL(xhr.response));
  };
  }; 
  xhr.onloadend = function() {
    if (xhr.status == 404) {
      show_notification("You have no cape!");
    }
  }
  xhr.open('GET', rcURL + "/account/get_cape", true);
  xhr.setRequestHeader('token', Cookies.get("token"));
  xhr.setRequestHeader('uuid', Cookies.get("uuid"));
  xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
    
  // fallbacks for IE and older browsers:
  xhr.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
  xhr.setRequestHeader("Pragma", "no-cache");

  xhr.send();
}

function fetch_model_cfg(model, callback) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob'; //so you can access the response like a normal URL
  xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
          callback(URL.createObjectURL(xhr.response));
      }
  };
  xhr.open('GET', rcURL + "/account/get_cosmetic_cfg", true);
  xhr.setRequestHeader('token', Cookies.get("token"));
  xhr.setRequestHeader('uuid', Cookies.get("uuid"));
  xhr.setRequestHeader('model', model);
  xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
    
  // fallbacks for IE and older browsers:
  xhr.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
  xhr.setRequestHeader("Pragma", "no-cache");

  xhr.send();
}

function fetch_model_texture(model, callback) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob'; //so you can access the response like a normal URL
  xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
          callback(URL.createObjectURL(xhr.response));
      }
  };
  xhr.open('GET', rcURL + "/account/get_cosmetic_texture", true);
  xhr.setRequestHeader('token', Cookies.get("token"));
  xhr.setRequestHeader('uuid', Cookies.get("uuid"));
  xhr.setRequestHeader('model', model);
  xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
    
  // fallbacks for IE and older browsers:
  xhr.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
  xhr.setRequestHeader("Pragma", "no-cache");

  xhr.send();
}

async function username_to_uuid(username) {

  let res = await fetch("https://api.ashcon.app/mojang/v2/user/" + username, {})
  
  return res.json();
}

function show_ms_login() {
  document.getElementById("ms-popup").classList.toggle("showing");
}

async function loginMS() {
  
  response = await fetch(rcURL + "/authenticate/ms_login", {
      headers: {
        "email": document.getElementById("ms-email").value,
        "password": document.getElementById("ms-password").value,
        "username": document.getElementById("ms-username").value,
        "source": "ReCape Web Client (Microsoft Login)"
      }
  })
  let json = await response.text();
  document.getElementById("ms-popup").classList.remove("showing");
  await parse_login(json);
  
}

async function loginCode() {
  
    response = await fetch(rcURL + "/authenticate/server_code", {
      headers: {
        "code": document.getElementById("login-code").value,
        "username": document.getElementById("username").value,
        "source": "ReCape Web Client"
      }
  })
  json = await response.text()
  await parse_login(json);
  
}

async function parse_login(json) {
  //Cookies.set("token", token);
  //Cookies.set("uuid", uuid);
  
  try {
    json = JSON.parse(json);
    
    if (json["status"] == "success") {
      Cookies.set("token", json["token"], {expires: COOKIE_EXPIRY});
      Cookies.set("uuid", json["uuid"], {expires: COOKIE_EXPIRY});
      Cookies.set("username", json["username"], {expires: COOKIE_EXPIRY});
      show_notification("Successfully connected your account! Welcome to ReCape.");
      await login();
    }
    else if (json["status"] == "failure") {
      show_notification(json["error"]);
    }
    
    
  } catch (e) {
    console.log(e);
    show_notification("Something went wrong.");
  }
}

function verify_token() {
  
} // :)

async function login() {
  let token = Cookies.get("token");
  let uuid = Cookies.get("uuid");
  
  if (token != undefined && uuid != undefined) {
      let response = await fetch(rcURL + "/authenticate/check_token", {
      headers: {
        "token": token,
        "username": Cookies.get("username"),
        "uuid": uuid.replaceAll("-", "")
      }
      })
      let json = await response.json()
          
      if (json["result"] == "valid") {
        document.getElementById("login-popup").style.opacity = "0";
        document.getElementById("login-popup").style.pointerEvents = "none";
      }
      
      document.getElementById("loading-popup").style.opacity = "0";
      
      document.body.style.pointerEvents = "all";

      loadClientMenu()
  } else {
    document.getElementById("loading-popup").style.opacity = "0";    
    document.getElementById("loading-popup").style.pointerEvents = "none";    
    document.body.style.pointerEvents = "all";
  }
}

function only_number(evt) {
  var theEvent = evt || window.event;

  // Handle paste
  if (theEvent.type === 'paste') {
      key = event.clipboardData.getData('text/plain');
  } else {
  // Handle key press
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode(key);
  }
  var regex = /[0-9]|\./;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function loadClientMenu() {
  let viewer = document.getElementsByClassName("cfgviewer")
  if (viewer.length > 0) {
    viewer[0].remove()
  }

  createScene(0.4);
  fetch_cape();
  loadSkin("https://mc-heads.net/skin/" + Cookies.get("uuid"))
  loadModelList();
  document.getElementById("loading-popup").style.opacity = "0";
  document.getElementById("loading-popup").style.pointerEvents = "none"; 
    
  document.getElementById("logged-in-as").innerText = "Logged in as " + (Cookies.get("username") != undefined ? Cookies.get("username") : "nobody");
}

async function start() {
  
  if (!_DEBUG || _DEBUG) {

    try {
      await login();
    } catch (e) {
      console.log(e);
    }

  } else {
    
    show_notification("ReCape is currently in debug mode!");
    
    // Skip login
    
    document.getElementById("login-popup").style.opacity = "0";
    document.getElementById("login-popup").style.pointerEvents = "none";
    document.body.style.pointerEvents = "all";
    
    loadClientMenu();
    
  }
}

async function do_with_loader(func) {
  document.getElementById("loading-popup").style.opacity = "1";
  document.getElementById("loading-popup").style.pointerEvents = "all";
  
  try {
    await func();
  } catch (e) {
    show_notification("An unknown error occurred while doing that.");
    console.log(e);
  }
  
  document.getElementById("loading-popup").style.opacity = "0";
  document.getElementById("loading-popup").style.pointerEvents = "none"; 
}

async function uploadCape() {
  show_notification("Uploading your cape...");
  
  var data = new FormData()
  data.append('file', document.getElementById("new-cape").files[0])

  let response = await fetch(rcURL + '/account/set_cape', {
    method: 'POST',
    body: data,
    headers: {
      "token": Cookies.get("token"),
      "uuid": Cookies.get("uuid"),
      "capetype": "cape"
    }
  })

  let status = await response.status

  if (status == 413) {
    show_notification("That file was too large.");
    return;
  }
  
  let json = await response.json()
  
  if (json["status"] == "success") {
      show_notification("Your cape has been changed.");
      fetch_cape();
    } else {
      show_notification(json["error"]);
    }
}

async function setNoCape() {
  show_notification("Removing your cape...");

  let response = await fetch(rcURL + '/account/set_cape', {
    method: 'POST',
    headers: {
      "token": Cookies.get("token"),
      "uuid": Cookies.get("uuid"),
      "capetype": "none"
    }
  })
  
  let json = await response.json()
  
  if (json["status"] == "success") {
      show_notification("Your cape has been removed.");
    } else {
      show_notification(json["error"]);
    }
}

async function setCloaksPlusCape() {
  show_notification("Changing your cape...");

  let response = await fetch(rcURL + '/account/set_cape', {
    method: 'POST',
    headers: {
      "token": Cookies.get("token"),
      "uuid": Cookies.get("uuid"),
      "capetype": "cloaksplus"
    }
  })
  
  let json = await response.json()
  
  if (json["status"] == "success") {
      show_notification("Your cape has been changed.");
    } else {
      show_notification(json["error"]);
    }
}

function updateModelView() {
  
  modelChecks = {}
  modelContainer.innerHTML = "";
  
  Object.keys(models).forEach(model => {

    
    let modelEl = document.createElement("div");
    modelEl.classList.add("model");
    
    let modelTitle = document.createElement("h3");
    modelTitle.innerText = model;
    modelEl.appendChild(modelTitle);

    let modelControls = document.createElement("div");
    modelControls.classList.add("model-controls")
    modelEl.appendChild(modelControls);
    
    let modelCheck = document.createElement("input");
    modelCheck.type = "checkbox";
    modelCheck.innerText = "Enabled?"
    modelCheck.checked = models[model];
    modelControls.appendChild(modelCheck);

    let modelDelete = document.createElement("ion-icon")
    modelDelete.classList.add("model-delete")
    modelDelete.setAttribute("name", "close-outline")
    modelDelete.model = model
    modelDelete.onclick = async function() {
      await do_with_loader(async () => {await removeModel(this.model); await loadModelList()});
    }
    modelControls.appendChild(modelDelete)
    
    modelContainer.appendChild(modelEl);
    
    modelChecks[model] = modelCheck;

    // Load it into the viewer
    if (models[model]) {
      fetch_model_cfg(model, (cfg) => {
        fetch_model_texture(model, (texture) => {
          console.log(model, texture)
          loadModelFromPath(cfg, texture)
        })
      });
  }
    
  });
}

async function loadModelList() {
  try {
  let response = await fetch(rcURL + '/account/get_config', {
    method: 'GET',
    headers: {
      "token": Cookies.get("token"),
      "uuid": Cookies.get("uuid")
    }
  })
  
  let json = await response.json();
  
  models = json;
  
  if (Object.keys(models).length > 0) {
    if (Object.keys(models).includes("status")) {
         modelContainer.innerHTML = "<h4>" + models["error"] + "</h4>";

    }
    else {
      updateModelView();
    }
  } else {
    modelContainer.innerHTML = "<h4>You don't have any models yet.</h4>";
  }
} catch (e) {
  console.log(e);
}
}

async function uploadModel() {
  show_notification("Uploading your cape...");
  
  var data = new FormData()
  let model = document.getElementById("new-model-cfg").files[0];
  let texture = document.getElementById("new-model-texture").files[0];
  data.append('model', model, model.name)
  data.append('texture', texture, "texture.png")

  let response = await fetch(rcURL + '/account/upload_cosmetic', {
    method: 'POST',
    body: data,
    headers: {
      "token": Cookies.get("token"),
      "uuid": Cookies.get("uuid")
    }
  })

  let status = await response.status

  if (status == 413) {
    show_notification("One of those files was too large.");
    return;
  }
  
  let json = await response.json()
  
  if (json["status"] == "success") {
      show_notification("Your model has been uploaded.");
      await loadModelList();
    } else {
      show_notification(json["error"]);
    }
}

async function update_models() {

  let data = {}

  Object.keys(modelChecks).forEach(model => {
    data[model] = modelChecks[model].checked;
  })

  let response = await fetch(rcURL + '/account/set_config', {
    method: 'POST',
    body: data,
    headers: {
      "token": Cookies.get("token"),
      "uuid": Cookies.get("uuid"),
      "config": JSON.stringify(data)
    }
  })
  
  let json = await response.json()
  
  if (json["status"] == "success") {
      show_notification("Your models have been updated.");
      loadClientMenu();
    } else {
      show_notification(json["error"]);
    }
}

async function removeModel(model) {
    show_notification("Removing the model \"" + model + "\"...");
  
    let response = await fetch(rcURL + '/account/delete_cosmetic', {
      headers: {
        "token": Cookies.get("token"),
        "uuid": Cookies.get("uuid"),
        "model": model
      }
    })
    
    let json = await response.json()
    
    if (json["status"] == "success") {
        show_notification("Your model has been removed.");
      } else {
        show_notification(json["error"]);
      }
}

async function openCape() {
  const resolver = new doh.DohResolver('https://1.1.1.1/dns-query')
  let response = await resolver.query('recape-server.boyne.dev')
  let ip = response.answers[0].data;
  window.location.href = "http://" + ip + "/capes/" + Cookies.get("username") + ".png"
}

start();

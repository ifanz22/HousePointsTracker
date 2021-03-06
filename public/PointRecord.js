// Setting up the required components from the web links
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// setting up my web app framework - use your apiKey and info
const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBO8MS08E0qXXfbfEVa73xlqdXqzheQXsU',
  authDomain: 'housepointstracker.firebaseapp.com',
  projectId: 'housepointstracker'
});

// setting up the fireStore database
const db = getFirestore();
let houses = [];
let pointRecord = [];

class House{ //Creating a custom class called "House"
  constructor(name, points, head, colour){ //Has the following properties
    this.name = name;
    this.points = points;
    this.head = head;
    this.colour = colour;
  }
  addPoints(points){
    this.points += points; //Add points to total
  }
  delPoints(points){
    this.points -= points; //Take away points from total
  }
}

class Record{
  constructor(house, user, points, date, description){
    this.house = house;
    this.user = user;
    this.points = points;
    this.date = date;
    this.description = description;
  }
}

const provider = new GoogleAuthProvider();
const auth = getAuth();
const currentUser = auth.currentUser;
let loggedIn;
if(currentUser == null){
  loggedIn = false;
}else{
  loggedIn = true;
}
// checking for changes in log-in status
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    console.log(user);
    console.log(`Currently signed in as: ${user.displayName}`);
    getUserStatus(user);
    //Getting current signed in user
    // The user object has basic properties such as display name, email, etc.
    const displayName = user.displayName;
    const email = user.email;
    const photoURL = user.photoURL;
    const emailVerified = user.emailVerified;
  } else {
    console.log(`Not signed in`);
  }
});
let teacher;
async function getUserStatus(user) {
  // checking the user document for the current user
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log("Document data:", docSnap.data());
    if (docSnap.data().teacher) {
      console.log("A teacher!")
      document.getElementById("showPointsForm").style.visibility = "visible";
      teacher = true;
    } else {
      console.log("not a teacher...")
      teacher = false;
    }
  } else {
    // doc.data() will be undefined in this case
    console.log("No such document!");
    const userRef = collection(db, "users");
    await setDoc(doc(userRef, user.uid), {
      email: user.email,
      teacher: false
    });
  }
}
if (currentUser) {
  // User is signed in
  loggedIn = true;
} else {
  // No user is signed in.
  loggedIn = false;
}

if(loggedIn == true){
  document.getElementById("signOut").style.visibility = "visible";
  document.getElementById("signIn").style.visibility = "hidden";
  document.getElementById("signOut").onclick = function() {
    console.log("Signing Out")
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
  }
}else{
  document.getElementById("signIn").style.visibility = "visible";
  document.getElementById("signOut").style.visibility = "hidden";
  document.getElementById("signIn").onclick = function() {
    signInWithRedirect(auth, provider);
  };
}

console.log(db);

// getting the data from a collection called "Houses"
const querySnapshot = await getDocs(collection(db, "Houses")); //Querying for the collection called "Houses"
querySnapshot.forEach((doc) => {
  console.log(`${doc.id} => ${doc.data()}`);
  console.log(doc.data().points);
  houses.push(new House(doc.id, doc.data().points, doc.data().head, doc.data().colour)); //Putting database info into the local array
  console.log(houses);
});

// getting the data from a collection called "PointRecord"
const querySnapshotRecord = await getDocs(collection(db, "PointRecord")); //Querying for the collection called "PointRecord"
querySnapshotRecord.forEach((doc) => {
  pointRecord.push(new Record(doc.data().house, doc.data().name, doc.data().pointsAdded, doc.data().date, doc.data().description));
  console.log(pointRecord);
});

for(let i in houses){
  addHouses(houses[i].name); //Add houses to dropdown menu of form
}

function addHouses(name){ //Function to add a house to the dropdown menu in the form
  let x = document.getElementById("house");
  let option = document.createElement("option");
  option.text = name;
  x.add(option);
}

document.getElementById("showPointsForm").onclick = function() {
  document.getElementById("pointsForm").style.visibility = "visible";
}

document.getElementById("cancelPoints").onclick = function() {
  document.getElementById("pointsForm").style.visibility = "hidden";
}

document.getElementById("submitPoints").onclick = function() {
  addPoints();
}

async function addPoints(){
  let frm = document.getElementById("form");
  let houseName = frm.elements["house"].value;
  let pAdd = Number(frm.elements["pointsAdded"].value);
  let pointDescription = frm.elements["pointDescription"].value;
  let oldPoints;
  //Adding points to the right house
  const docRef = doc(db, "Houses", houseName);
  const house = await getDoc(docRef); //Saving the right document into a variable
  oldPoints = Number(house.data().points);
  await updateDoc(docRef, {
    points: oldPoints + pAdd
  });
  // Add a new document in collection "PointRecord"
  await setDoc(doc(db, "PointRecord", "user"), {
    date: new Date(),
    description: pointDescription,
    pointsAdded: pAdd,
    house: houseName,
    name: displayName
  });
  document.getElementById("pointsForm").style.visibility = "hidden";
  location.reload();
}

function displayPoints(){ //Displays the point record table
  for(let i in pointRecord){
    let tbl = document.getElementById("pointsTable");
    let rowNumber = tbl.rows.length;
    let row = tbl.insertRow(rowNumber);
    let hCell = row.insertCell(0); //House name column
    let nCell = row.insertCell(1); //Point giver name column
    let pCell = row.insertCell(2); //Number of points column
    let daCell = row.insertCell(3); //Date column
    let deCell = row.insertCell(4); //Description column
    let delCell = row.insertCell(5); //Delete column
    //Accessing info
    hCell.innerHTML = pointRecord[i].house;
    nCell.innerHTML = pointRecord[i].user;
    pCell.innerHTML = pointRecord[i].points;
    deCell.innerHTML = pointRecord[i].description;
    daCell.innerHTML = pointRecord[i].date;
    //Creating delete button
    if(teacher == true){
      let deleteButton = document.createElement("BUTTON");
      let dt = document.createTextNode("X");
      deleteButton.appendChild(dt);
      //Delete action wrapped in second function so that it does not automatically trigger
      deleteButton.addEventListener("click", function(){
        //houses[rowNumber-1].deleteEntry(rowNumber-1);
      });
      delCell.appendChild(deleteButton);
    }
  }
  console.log(pointRecord);
}

displayPoints();

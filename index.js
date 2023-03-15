const graphql_endpoint =
  "https://feature-testing-sr3vwdfovq-uc.a.run.app/graphql";
const api_body = {
  starting_point: null,
  destination: null,
  location_points: [],
};
let points = 0;
let tracker;

// window.onload = () => {
//   localStorage.clear();
//   indexedDB.deleteDatabase("mileage_tracking");
//   const indexed_db = indexedDB.open("mileage_tracking", 1);
//   let db;
//   indexed_db.onupgradeneeded = (e) => {
//     db = e.target.result;
//     db.createObjectStore("starting_point", { autoIncrement: true });
//     db.createObjectStore("location_points", { autoIncrement: true });
//     db.createObjectStore("destination", { autoIncrement: true });
//     console.log("on upgrade needed: ", db);
//   };
//   indexed_db.onsuccess = (e) => {
//     db = e.target.result;
//     console.log("on success: ", db);
//   };
//   indexed_db.onerror = (e) => {
//     console.log("error");
//     console.log(e.target);
//   };
// };

// const openStore = (store_name) =>
//   new Promise((resolve, reject) => {
//     const request = indexedDB.open("mileage_tracking");
//     request.onsuccess = (e) => {
//       console.log(e.target.result);
//       const db = e.target.result;
//       const transaction = db.transaction([store_name], "readwrite");
//       const store = transaction.objectStore(store_name);
//       resolve(store);
//     };
//     request.onerror = function (event) {
//       console.log("Woops! " + event.target.errorCode);
//       reject(event.target.result);
//     };
//   });

const track_points = async () => {
  points++;
  $("#point-count").text(points);
  $("#tracked-header").attr("class", "shown");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    // const store = await openStore("location_points");
    const current_points = JSON.parse(localStorage.getItem("location_points"));
    const location = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    console.log(current_points)
    current_points.push(location);
    console.log(current_points)
    // store.add(location);
    localStorage.setItem("location_points", JSON.stringify(current_points));
  });
};
const successfulLogin = () => {
  $("form").attr("class", "hidden");
  $("#login").attr("class", "hidden");
  $("#start-trip").attr("class", "shown");
  $("#trip-tracking").attr("class", "false");
  $("#login-err").attr("class", "hidden");
};
const loginHandler = async () => {
  const id = $("#user-id").val();
  const name = $("#user-name").val();
  const email = $("#user-email").val();
  const res = await fetch(graphql_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "mutation login($id: String!, $email: String!, $name: String!) {\n\tlogin(id: $id, email: $email, name: $name) \n}\n",
      operationName: "login",
      variables: { id: id, email: email, name: name },
    }),
  }).then((res) => res.json());
  return res;
};

$("#login").click(async (e) => {
  e.preventDefault();
  localStorage.clear();
  const login_res = await loginHandler();
  if (!login_res.errors) {
    const auth_jwt = login_res.data.login;
    localStorage.setItem("Authorization", auth_jwt);
    successfulLogin();
  } else {
    $("#login-err").text("Incorrect Credentials");
  }
});

const initialHeaderHandler = () => {
  $("#conclude-trip").attr("class", "shown");
  $("#start-header").attr("class", "shown");
  $("#trip-tracking").attr("class", "true").text("TRACKING");
  $("#start-trip").attr("class", "hidden");
};

$("#start-trip").click((e) => {
  e.preventDefault();
  initialHeaderHandler();
  points = 0;
  if ("geolocation" in navigator) {
    if (!tracker) {
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        // const store = await openStore("starting_point");
        const location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        // store.add(location);
        localStorage.setItem("starting_point", JSON.stringify(location));
        localStorage.setItem("location_points", JSON.stringify([location]));
        $("#starting-location").attr("class", "shown-pre");
        $("#starting-location").text(JSON.stringify(location, null, " "));
      });
      tracker = setInterval(track_points, 1000 * 10);
    }
  }
});

const concludeTrip = () => {
  $("#conclude-trip").attr("class", "hidden");
  $("#confirm-trip").attr("class", "shown");
  $("#dest-header").attr("class", "shown");
  $("#trip-tracking").attr("class", "false").text("NOT Tracking");
};

const handleStartingPoint = async () => {
  const starting_point = JSON.parse(localStorage.getItem("starting_point"));
  return starting_point;
  // const store2 = await openStore("starting_point");
  // const starting_point = store2.getAll();
  // starting_point.onsuccess = () => {
  //   console.log("starting_point result", starting_point.result);
  //   api_body.location_points.push(...starting_point.result);
  //   api_body.starting_point = starting_point.result[0];
  // };
};

const handleLocationPoints = async () => {
  const location_points = JSON.parse(localStorage.getItem("location_points"));
  // const store3 = await openStore("location_points");
  // const location_points = store3.getAll();
  // location_points.onsuccess = async () => {
  //   api_body.location_points.push(...location_points.result);
  // };
  return location_points;
};

const showTripHeaders = () => {
  $("#trip-points-header").attr("class", "shown");
  $("#trip-api-body").attr("class", "shown-pre");
  $("#destination").attr("class", "shown-pre");
  $("#trip-report-header").attr("class", "shown");
  $("#calc-dist-header").attr("class", "shown");
  $("#actual-dist-header").attr("class", "shown");
  $("#trip-variance-header").attr("class", "shown");
};

const fetchMatrixRes = async () => {
  const jwt_key = localStorage.getItem("Authorization");
  const api_res = await fetch(graphql_endpoint, {
    headers: {
      Authorization: jwt_key,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      query:
        "query MileageVariance($starting_point: location_point_input!, $destination: location_point_input!, $location_points:  [location_point_input]!){\n\tmileage_request_variance(starting_point: $starting_point, ending_point: $destination, location_points: $location_points) {\n\t\tmatrix_distance\n\t\tvariance\n\t\ttraveled_distance\n\t}\n}",
      operationName: "MileageVariance",
      variables: api_body,
    }),
  }).then((res) => res.json());
  console.log("graphql endpoint", api_res);
  const { matrix_distance, traveled_distance, variance } =
    api_res.data.mileage_request_variance;
  $("#calc-dist").text(matrix_distance);
  $("#actual-dist").text(parseFloat(traveled_distance).toFixed(2));
  $("#trip-variance").text(variance);
};

$("#conclude-trip").click(async (e) => {
  e.preventDefault();
  concludeTrip();
  clearInterval(tracker);
  tracker = null;
  $("#point-count").text(points + 1);
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const destination = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    const starting_point = await handleStartingPoint();
    const location_points = await handleLocationPoints();
    api_body.starting_point = starting_point;
    api_body.location_points = location_points;
    api_body.destination = destination;
    showTripHeaders();
    $("#starting-location").text(JSON.stringify(starting_point, null, " "));
    $("#trip-api-body").text(JSON.stringify(api_body, null, " "));
    $("#destination").text(JSON.stringify(destination, null, " "));
    await fetchMatrixRes();
  });
});

$("#confirm-trip").click(() => {
  window.location.reload();
});

const graphql_endpoint =
  "https://feature-testing-sr3vwdfovq-uc.a.run.app/graphql";
const api_body = {
  starting_point: null,
  destination: null,
  location_points: [],
};
let points = 0;
let tracker;
const trip_begin_audio = new Audio("success.mp3");
const trip_end_audio = new Audio("success.mp3");
const track_points = async () => {
  points++;
  $("#point-count").text(points);
  $("#tracked-header").attr("class", "shown");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const current_points = JSON.parse(localStorage.getItem("location_points"));
    const location = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    current_points.push(location);
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
  const login_options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "mutation login($id: String!, $email: String!, $name: String!) {\n\tlogin(id: $id, email: $email, name: $name) \n}\n",
      operationName: "login",
      variables: { id, email, name },
    }),
  };
  const res = await fetch(graphql_endpoint, login_options)
    .then((res) => res.json())
    .catch((err) => console.error(err));
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
  trip_begin_audio.play();
  initialHeaderHandler();
  points = 0;
  if ("geolocation" in navigator) {
    if (!tracker) {
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        const location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
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
};

const handleLocationPoints = async () => {
  const location_points = JSON.parse(localStorage.getItem("location_points"));
  return location_points;
};

const handleDestination = async () => {
  const destination = JSON.parse(localStorage.getItem("destination"));
  return destination;
};

const handleMileageVariance = async () => {
  const variance = JSON.parse(localStorage.getItem("mileage_variance"));
  return variance;
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

const hideTripHeaders = () => {
  $("#trip-points-header").attr("class", "hidden");
  $("#trip-api-body").attr("class", "hidden");
  $("#destination").attr("class", "hidden");
  $("#trip-report-header").attr("class", "hidden");
  $("#calc-dist-header").attr("class", "hidden");
  $("#actual-dist-header").attr("class", "hidden");
  $("#trip-variance-header").attr("class", "hidden");
  $("#confirm-trip").attr("class", "hidden");
  $("#dest-header").attr("class", "hidden");
  $("#tracked-header").attr("class", "hidden");
  $("#start-header").attr("class", "hidden");
};

const showTripResponseHeaders = () => {
  $("#confirm-request").attr("class", "shown");
  $("#create-trip-res").attr("class", "shown");
  $("#trip-request-response").attr("class", "shown-pre");
};

const fetchMatrixRes = async () => {
  const jwt_key = localStorage.getItem("Authorization");
  const variance_options = {
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
  };
  const api_res = await fetch(graphql_endpoint, variance_options)
    .then((res) => res.json())
    .catch((err) => console.error(err));
  const { matrix_distance, traveled_distance, variance } =
    api_res.data.mileage_request_variance;
  const stored_info = {
    difference: Math.floor(traveled_distance - matrix_distance),
    matrix_distance,
    traveled_distance,
    variance,
  };
  localStorage.setItem("mileage_variance", JSON.stringify(stored_info));
  $("#calc-dist").text(matrix_distance);
  $("#actual-dist").text(parseFloat(traveled_distance).toFixed(2));
  $("#trip-variance").text(variance);
};

$("#conclude-trip").click(async (e) => {
  e.preventDefault();
  trip_end_audio.play();
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
    localStorage.setItem("destination", JSON.stringify(destination));
    $("#starting-location").text(JSON.stringify(starting_point, null, " "));
    $("#trip-api-body").text(JSON.stringify(api_body, null, " "));
    $("#destination").text(JSON.stringify(destination, null, " "));
    await fetchMatrixRes();
  });
});

$("#confirm-trip").click(async () => {
  hideTripHeaders();
  showTripResponseHeaders();
  const jwt_key = localStorage.getItem("Authorization");
  const starting_point = await handleStartingPoint();
  const location_points = await handleLocationPoints();
  const destination = await handleDestination();
  const mileage_variance = await handleMileageVariance();
  const parking = parseFloat((Math.random() * 20).toFixed(2));
  const tolls = parseFloat((Math.random() * 20).toFixed(2));
  const request_body = {
    grant_id: "SOR_HOUSING",
    request: {
      category: "MENS_HOUSE",
      date: new Date().toISOString(),
      destination: destination,
      starting_location: starting_point,
      location_points,
      parking,
      tolls,
      trip_purpose: "to move from point a to point b",
      request_variance: mileage_variance,
    },
  };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: jwt_key,
    },
    body: JSON.stringify({
      query:
        "mutation createTestMileage($grant_id: ID!, $request: test_mileage_input!){\n\ttest_create_mileage(grant_id: $grant_id, request: $request){\n\t\tid\n\t\tcurrent_status\n\t\tcreated_at\n\t\tcurrent_user\n\t\tstarting_location {\n\t\t\tlatitude\n\t\t\tlongitude\n\t\t}\n\t\tdestination {\n\t\t\tlatitude\n\t\t\tlongitude\n\t\t}\n\t\trequest_variance {\n\t\t\tdifference\n\t\t\tmatrix_distance\n\t\t\tvariance\n\t\t\ttraveled_distance\n\t\t}\n\t\tlocation_points {\n\t\t\tlatitude\n\t\t\tlongitude\n\t\t}\n\t\taction_history {\n\t\t\tid\n\t\t\tuser\n\t\t\tstatus\n\t\t\tcreated_at\n\t\t}\n\t}\n}",
      operationName: "createTestMileage",
      variables: request_body,
    }),
  };
  const mileage_create_res = await fetch(
    "https://feature-testing-sr3vwdfovq-uc.a.run.app/graphql",
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));
  $("#trip-request-response").text(
    JSON.stringify(mileage_create_res.data.test_create_mileage, null, " ")
  );
});

$("#confirm-request").on("click", () => {
  window.location.reload();
});

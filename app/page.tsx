"use client";
import { useRef, useState } from "react";

interface TrackedPoint {
  latitude: number;
  longitude: number;
}
export default function Home() {
  const [tracking, setTracking] = useState(false);
  const [password, setPassword] = useState("");
  const [logged_in, setLoggedIn] = useState(false);
  const [trip_info, setTripInfo] = useState({
    starting_location: "",
    destination: "",
    purpose: "",
  });
  const [destination_coords, setDestinationCoords] = useState({
    latitude: 0,
    longitude: 0,
  });
  const tracker_id = useRef<NodeJS.Timer | null | number>(null);
  const [request_response, setRequestResponse] = useState("");
  const resetBrowser = () => {
    setTracking(false);
    setPassword("");
    setLoggedIn(false);
    setRequestResponse("");
    setTripInfo({
      starting_location: "",
      destination: "",
      purpose: "",
    });
    clearInterval(tracker_id.current as number);
    tracker_id.current = null;
    localStorage.clear();
  };
  const handleLogin = async (e: any) => {
    e.preventDefault();
    const response = await fetch("/login", {
      method: "POST",
      body: JSON.stringify({ password: password }),
    }).then((res) => res.json());
    if (
      response.data != "null" &&
      response.message != "Incorrect Login Credentials"
    ) {
      setLoggedIn(true);
      setPassword("");
      setRequestResponse("");
      localStorage.setItem("auth_token", response.token);
    } else {
      setRequestResponse(JSON.stringify(response.message, null, 2));
    }
  };
  const handleTripChange = (e: any) => {
    e.preventDefault();
    const { name, value } = e.target;
    const new_state = { ...trip_info, [name]: value };
    setTripInfo(new_state);
  };
  const haverDistance = (
    position_one: TrackedPoint,
    position_two: TrackedPoint
  ) => {
    const lat_distance =
      (position_two.latitude * Math.PI) / 180 -
      (position_one.latitude * Math.PI) / 180;
    const long_distance =
      (position_two.longitude * Math.PI) / 180 -
      (position_one.longitude * Math.PI) / 180;
    const haver_one =
      Math.pow(Math.sin(lat_distance / 2), 2) +
      Math.cos((position_one.latitude * Math.PI) / 180) *
        Math.cos((position_two.latitude * Math.PI) / 180) *
        Math.pow(Math.sin(long_distance / 2), 2);
    return 2 * Math.asin(Math.sqrt(haver_one)) * 3956.0;
  };
  const concludeTrip = async () => {
    const auth_token = localStorage.getItem("auth_token");
    const tracked_points = JSON.parse(
      localStorage.getItem("tracked_points") as string
    );
    const response = await fetch("/end_trip", {
      method: "POST",
      body: JSON.stringify({
        auth_token,
        tracked_points,
        trip_info,
      }),
    }).then((res) => res.json());
    if (response.id) {
      setRequestResponse(JSON.stringify(response, null, 2));
      setTracking(false);
      clearInterval(tracker_id.current as number);
      tracker_id.current = null;
    }
  };
  const track_points = async () => {
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const tracked_points = JSON.parse(
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("tracked_points="))
          ?.split("=")[1] as string
      );
      const location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const new_state = [...tracked_points, location];
      document.cookie = `tracked_points=${JSON.stringify(new_state)};`;
      const distance_to_destination = haverDistance(
        destination_coords,
        location
      );
      if (distance_to_destination <= 0.1) {
        concludeTrip();
      }
    });
  };
  const handleTripBegin = async (e: any) => {
    e.preventDefault();
    const response = await fetch("/trip_begin", {
      method: "POST",
      body: JSON.stringify({ address: trip_info.destination }),
    }).then((res) => res.json());

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      document.cookie = `tracked_points=${JSON.stringify([location])};`;
    });
    if (response.target) {
      setDestinationCoords(response.target);
      tracker_id.current = setInterval(track_points, 5 * 1000);
      setTracking(true);
    } else {
      setRequestResponse(JSON.stringify(response, null, 2));
    }
  };
  return (
    <main id="container">
      <h1>Test Trip Tracker</h1>
      <h1 id="trip-tracking" className={tracking ? "shown" : "hidden"}>
        {!tracking && "Not"} Tracking
      </h1>
      <form id="login-form" className={logged_in ? "hidden" : "shown"}>
        <label>Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </form>
      <form
        id="trip-request-form"
        className={
          logged_in && !tracking && request_response === "" ? "shown" : "hidden"
        }
      >
        <label>Starting Location</label>
        <input
          type="text"
          id="start-location"
          value={trip_info.starting_location}
          name="starting_location"
          onChange={handleTripChange}
          placeholder="1400 E 55th St., Cleveland, OH 44103"
        />
        <label>Destination</label>
        <input
          type="text"
          id="end-location"
          name="destination"
          value={trip_info.destination}
          onChange={handleTripChange}
          placeholder="4642 Oberlin Ave, Lorain, OH 44053"
        />
        <label>Trip Purpose</label>
        <textarea
          id="purpose"
          name="purpose"
          value={trip_info.purpose}
          onChange={handleTripChange}
        ></textarea>
        <button id="start-trip" onClick={handleTripBegin}>
          Begin Trip
        </button>
      </form>
      {logged_in && tracking && (
        <button onClick={concludeTrip}>Force Conclude</button>
      )}
      <pre>{request_response}</pre>
      <button
        id="confirm-request"
        className={
          logged_in && !tracking && request_response != "" ? "shown" : "hidden"
        }
        onClick={resetBrowser}
      >
        Confirm Request
      </button>
      <button onClick={resetBrowser}>Browser Reset</button>
    </main>
  );
}

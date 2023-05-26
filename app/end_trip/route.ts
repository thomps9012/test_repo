import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const mileage_endpoint =
    "https://feature-testing-sr3vwdfovq-uc.a.run.app/api/mileage/variance";
  const api_request_body = {
    grant_id: "H79TI082369",
    date: new Date(),
    category: "FINANCE",
    starting_location: body.trip_info.starting_location,
    destination: body.trip_info.destination,
    trip_purpose: body.trip_info.purpose,
    tracked_points: body.tracked_points,
    tolls: Math.floor(Math.random() * 20),
    parking: Math.floor(Math.random() * 20),
  };
  const mileage_options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${body.auth_token}`,
    },
    body: JSON.stringify(api_request_body),
  };
  const mileage_api_res = await fetch(mileage_endpoint, mileage_options).then(
    (res) => res.json()
  );
  if (mileage_api_res.data.id) {
    return NextResponse.json(mileage_api_res.data);
  } else {
    return NextResponse.json(mileage_api_res);
  }
}

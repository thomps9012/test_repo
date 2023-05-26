import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const address = body.address.split(" ").join("+");
  const maps_endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.MAPS_API_KEY}`;
  const maps_api_res = await fetch(maps_endpoint).then((res) => res.json());
  if (maps_api_res.status === "OK") {
    const target = {
      latitude: maps_api_res.results[0].geometry.location.lat,
      longitude: maps_api_res.results[0].geometry.location.lng,
    };
    return NextResponse.json({ target: target });
  } else {
    return NextResponse.json(maps_api_res);
  }
}

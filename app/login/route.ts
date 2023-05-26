import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const auth_endpoint =
    "https://feature-testing-sr3vwdfovq-uc.a.run.app/api/auth/login";
  const login_options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: process.env.ID,
      email: process.env.EMAIL,
      name: process.env.NAME,
      password: body.password,
    }),
  };
  const api_res = await fetch(auth_endpoint, login_options).then((res) =>
    res.json()
  );
  if (api_res.data.token) {
    return NextResponse.json(api_res.data);
  }
  return NextResponse.json(api_res);
}

"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export default function TestAuth() {
  const { data: session, status } = useSession();
  const [result, setResult] = useState<any>(null);

  const testLogin = async () => {
    const res = await signIn("credentials", {
      email: "demo@example.com",
      password: "demo123",
      redirect: false,
    });
    setResult(res);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <p>Session Status: {status}</p>
        <p>Session Data: {JSON.stringify(session, null, 2)}</p>
      </div>

      <button
        onClick={testLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Login with Demo Account
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>Result:</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
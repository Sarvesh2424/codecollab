import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  return (
    <div className="w-full bg-gray-950 flex justify-center items-center h-screen">
      <div className="w-96 mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-black text-center mb-6 text-4xl font-bold">
          Login
        </h1>
        <label className="block text-gray-700 mb-2">User Name:</label>
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
        />
        <label className="block text-gray-700 mb-2">Password:</label>
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
        />
        <button className="w-full p-2 bg-blue-500 text-white rounded-lg hover:cursor-pointer hover:bg-blue-600 transition duration-200 mb-4">
          Login
        </button>
        <h3 className="text-center text-gray-700 mb-4">OR</h3>
        <div className="flex justify-center">
          <GoogleLogin
            clientId="202469683498-0hf0bgijnv67do9hvj7idh6aijkdgg9b.apps.googleusercontent.com"
          >
            Login with Google
          </GoogleLogin>
        </div>
      </div>
    </div>
  );
}

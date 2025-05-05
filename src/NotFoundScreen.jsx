import NavBar from "./NavBar";

export default function NotFoundScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white flex flex-col">
      <NavBar />
      <div className="flex-grow flex justify-center items-center p-8">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl text-center">
          <h1 className="text-black text-5xl font-extrabold mb-4 drop-shadow-md">
            404 Not Found
          </h1>
          <p className="text-gray-700 text-lg">
            The page you are looking for does not exist.
          </p>
        </div>
      </div>
    </div>
  );
}

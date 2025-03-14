export default function NotFoundScreen() {
  return (
    <div className="w-full bg-gray-950 flex justify-between items-center h-screen">
      <div className="w-1/3 h-1/3 mx-auto p-8 flex flex-col justify-center gap-8 bg-white rounded-xl shadow-xl">
        <h1 className="text-black text-center text-4xl font-bold">
          404 Not Found
        </h1>
        <p className="text-black text-center">
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  );
}

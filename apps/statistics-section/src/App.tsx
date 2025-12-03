import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import "./App.css";
import { store } from "./app/store";
import HeroImage from "./assets/hero.png";

const API_URL =
  "https://www.greatfrontend.com/api/projects/challenges/statistics-metrics?latest=true";

type StatisticsData = {
  metric: "downloads" | "paid_users" | "library_images";
  value: number;
}[];

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetch(API_URL);
        if (!data.ok) {
          throw new Error("Network response was not ok");
        }
        const jsonData = await data.json();
        setData(jsonData.data);
      } catch (error: any) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Provider store={store}>
      <div className="flex flex-col items-center gap-16 self-stretch p-24">
        <div className="flex flex-col items-center gap-8 self-stretch px-8">
          <div className="flex flex-wrap justify-center items-center gap-y-8 self-stretch">
            <div className="flex flex-col gap-5 grow">
              <div className="flex flex-col gap-3 self-stretch">
                <span className="font-semibold text-base text-center text-indigo-700">
                  Statistics
                </span>
                <span className="font-semibold text-5xl text-center text-neutral-900">
                  More than premium abstract imagery
                </span>
              </div>
              <span className="font-normal text-xl text-center text-neutral-600">
                Our platform is more than just as a service to us – it is a
                catalyst for enriching lives through premium abstract imagery.
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-16 self-stretch">
          <div className="flex items-center gap-8 self-stretch">
            <img
              src={HeroImage}
              className="justify-center items-center w-[592px] h-[544px] object-cover"
            />
            <div className="w-[591px] flex flex-col gap-8">
              <span className="font-normal text-lg text-neutral-600">
                Our mission, in numbers
              </span>
              <div className="flex flex-col justify-center items-center self-stretch bg-white py-6 rounded-lg border border-solid border-neutral-200">
                <div className="flex flex-col justify-center items-center gap-4 self-stretch">
                  <span className="font-bold text-5xl text-center text-indigo-700">
                    {isLoading
                      ? "..."
                      : error || data === null
                      ? "-"
                      : data
                          ?.find((item) => item.metric === "downloads")
                          ?.value.toLocaleString()}
                  </span>
                  <span className="font-normal text-xl text-center text-neutral-600">
                    Downloads
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center self-stretch bg-white py-6 rounded-lg border border-solid border-neutral-200">
                <div className="flex flex-col justify-center items-center gap-4 self-stretch">
                  <span className="font-bold text-5xl text-center text-indigo-700">
                    {isLoading
                      ? "..."
                      : error || data === null
                      ? "-"
                      : data
                          ?.find((item) => item.metric === "paid_users")
                          ?.value.toLocaleString()}
                  </span>
                  <span className="font-normal text-xl text-center text-neutral-600">
                    Paid users
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center self-stretch bg-white py-6 rounded-lg border border-solid border-neutral-200">
                <div className="flex flex-col justify-center items-center gap-4 self-stretch">
                  <span className="font-bold text-5xl text-center text-indigo-700">
                    {isLoading
                      ? "..."
                      : error || data === null
                      ? "-"
                      : data
                          ?.find((item) => item.metric === "library_images")
                          ?.value.toLocaleString()}
                  </span>
                  <span className="font-normal text-xl text-center text-neutral-600">
                    Images in library
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Provider>
  );
}

export default App;
